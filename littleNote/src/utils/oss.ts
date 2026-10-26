import { getPresignedUrls, MAX_PRESIGN_BATCH_SIZE } from '@/network/file';

// 两层约定：
// 1. 业务字段（头像、附件）存裸 objectKey；正文图片存站内相对路径 /note/image/xxx.png。
// 2. 渲染时用 objectKey 换预签名地址，浏览器直连 OSS，不经过后端字节转发。
//    预签名地址只在内存里缓存，绝不写回正文或数据库（会过期、也会泄露签名）。

const OSS_SCHEME = 'oss://';
const API_FILE_PREFIX = '/api/oss/file/';
const LEGACY_LOAD_PREFIX = '/assets/oss/';
const OSS_BUCKET = (import.meta.env.VITE_OSS_BUCKET || 'yiru').trim();

// http(s)://、//cdn 这类外链
const EXTERNAL_SRC = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;
const NON_KEY_SCHEME = /^(?:data|blob|file):/i;

// 有效期给长一点，减少签名次数，也延长浏览器复用同一 URL 的时间
const PRESIGN_EXPIRE_SECONDS = 3600;
// 提前过期，避免地址刚好在失效瞬间加载失败
const REFRESH_AHEAD_SECONDS = 300;
const MAX_CACHE_SIZE = 300;
// 合并窗口：同一轮渲染里同步触发的图片请求会合并成一次批量签名
const BATCH_DELAY_MS = 0;

interface CacheEntry {
  url: string;
  expireAt: number;
}

type Waiter = (url: string) => void;

const urlCache = new Map<string, CacheEntry>();
// 已发起请求的 key，避免同一张图渲染多次时重复签名
const inflight = new Map<string, Promise<string>>();
// 待批量签名的 key -> 等待结果的回调
const queue = new Map<string, Waiter[]>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const stripQuery = (value: string) => value.split('#')[0].split('?')[0];

const normalizeKey = (value: string) => {
  const key = value.replace(/^\/+/, '');
  if (!key) return null;
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
};

const encodeKeyPath = (key: string) => key.split('/').map((segment) => encodeURIComponent(segment)).join('/');

/**
 * 还原桶内 objectKey。
 * 支持 /note/image/xxx.png、/api/oss/file/yiru/xxx.png、/assets/oss/xxx.png、oss://xxx、裸 key。
 * 返回 null 表示不是本站 OSS 资源（外链、data: 等），调用方应原样使用。
 */
export const toObjectKey = (src?: string | null): string | null => {
  if (!src || typeof src !== 'string') return null;

  const value = src.trim();
  if (!value) return null;
  if (value.startsWith(OSS_SCHEME)) return normalizeKey(value.slice(OSS_SCHEME.length));
  if (NON_KEY_SCHEME.test(value) || EXTERNAL_SRC.test(value)) return null;

  const path = stripQuery(value);
  const apiPrefix = `${API_FILE_PREFIX}${OSS_BUCKET}/`;
  // 已经是代理地址时再解析一次，保证幂等
  if (path.startsWith(apiPrefix)) return normalizeKey(path.slice(apiPrefix.length));
  // 其他后端接口地址不属于文件，原样保留
  if (path.startsWith('/api/')) return null;
  if (path.startsWith(LEGACY_LOAD_PREFIX)) return normalizeKey(path.slice(LEGACY_LOAD_PREFIX.length));

  // 站内相对路径与裸 key
  return normalizeKey(path);
};

const buildProxyUrl = (objectKey: string) => `${API_FILE_PREFIX}${OSS_BUCKET}/${encodeKeyPath(objectKey)}`;

/**
 * 兜底地址：走后端文件代理直出。只在批量签名异常时使用，正常渲染不会走到这里。
 */
export const proxyFileUrl = (src?: string | null): string => {
  if (!src || typeof src !== 'string') return '';
  const objectKey = toObjectKey(src);
  return objectKey ? buildProxyUrl(objectKey) : src;
};

const trimCache = () => {
  while (urlCache.size > MAX_CACHE_SIZE) {
    const oldestKey = urlCache.keys().next().value;
    if (typeof oldestKey !== 'string') break;
    urlCache.delete(oldestKey);
  }
};

const setCache = (objectKey: string, url: string) => {
  urlCache.delete(objectKey);
  urlCache.set(objectKey, {
    url,
    expireAt: Date.now() + Math.max(PRESIGN_EXPIRE_SECONDS - REFRESH_AHEAD_SECONDS, 60) * 1000,
  });
  trimCache();
};

const scheduleFlush = () => {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushQueue();
  }, BATCH_DELAY_MS);
};

const flushQueue = async () => {
  const batch = Array.from(queue.keys()).slice(0, MAX_PRESIGN_BATCH_SIZE);
  if (!batch.length) return;

  const waitersByKey = new Map<string, Waiter[]>();
  batch.forEach((objectKey) => {
    waitersByKey.set(objectKey, queue.get(objectKey) || []);
    queue.delete(objectKey);
  });

  const urls = new Map<string, string>();
  const task = (async () => {
    try {
      const res = await getPresignedUrls(batch, PRESIGN_EXPIRE_SECONDS);
      const list = Array.isArray(res?.data) ? res.data : [];
      list.forEach((item: any) => {
        // 后端字段为 objectKey/url，这里顺带兼容 previewUrl 命名
        const objectKey = normalizeKey(String(item?.objectKey ?? item?.key ?? ''));
        const url = item?.url ?? item?.previewUrl;
        if (!objectKey || typeof url !== 'string' || !url) return;
        setCache(objectKey, url);
        urls.set(objectKey, url);
      });
    } catch (err) {
      // 批量接口异常时退回后端代理地址，至少保证图片能显示
      console.error('批量获取 OSS 预签名地址失败:', err);
    }
  })();

  waitersByKey.forEach((waiters, objectKey) => {
    const promise = task.then(() => urls.get(objectKey) || buildProxyUrl(objectKey));
    inflight.set(objectKey, promise);
    void promise.finally(() => inflight.delete(objectKey));
    waiters.forEach((resolve) => void promise.then(resolve));
  });

  await task;

  // 超过单次上限的部分继续排队
  if (queue.size) scheduleFlush();
};

/**
 * 渲染入口：把正文/业务字段里的 objectKey 换成可直接访问的地址。
 * 命中内存缓存直接返回；同一轮渲染里的多个 key 会自动合并成一次批量签名。
 */
export const resolveFileUrl = (src?: string | null, forceRefresh = false): Promise<string> => {
  if (!src || typeof src !== 'string') return Promise.resolve('');

  const objectKey = toObjectKey(src);
  // 外链、data: 等非本站资源原样返回
  if (!objectKey) return Promise.resolve(src);

  if (!forceRefresh) {
    const cached = urlCache.get(objectKey);
    if (cached && cached.expireAt > Date.now()) return Promise.resolve(cached.url);
  }

  const running = inflight.get(objectKey);
  if (running) return running;

  return new Promise<string>((resolve) => {
    const waiters = queue.get(objectKey);
    if (waiters) {
      waiters.push(resolve);
      return;
    }
    queue.set(objectKey, [resolve]);
    scheduleFlush();
  });
};

/**
 * 预取一批地址（超过 200 个会自动分批）。
 * 在渲染内容前调用可以一次性把整篇笔记的图片地址拿到。
 */
export const preloadFileUrls = (srcs: Array<string | null | undefined>) =>
  Promise.all(srcs.map((src) => resolveFileUrl(src)));
