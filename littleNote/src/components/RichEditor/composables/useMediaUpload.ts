import { ref, type Ref } from 'vue';
import type { Editor } from '@tiptap/vue-3';
import { ElMessage } from 'element-plus';
import { uploadFile } from '@/network/file';
import {
  DEFAULT_IMAGE_SCALE,
  IMAGE_UPLOAD_MAX_MB,
  VIDEO_UPLOAD_MAX_MB,
} from '../config';

// 网络图片只需校验协议，外链地址会原样进入正文，渲染时 fileUrl 也原样返回
const NETWORK_IMAGE_SRC = /^(https?:\/\/|\/|data:image\/)/i;

export type MediaKind = 'image' | 'video';

export type SelectFilePayload = {
  kind: MediaKind;
  file: File;
};

/**
 * 编辑器内的图片/视频上传：进度、体积校验、落点插入，以及网络图片插入。
 * 失败提示统一在这里给出，调用方只需关心返回值。
 */
export const useMediaUpload = (editor: Ref<Editor | undefined>) => {
  const networkImageUrl = ref('');
  const networkImageName = ref('');
  const uploadPercent = ref<number | null>(null);

  const doUpload = async (file: File) => {
    uploadPercent.value = 0;

    try {
      const res = await uploadFile(file, 'note-image', (percent) => {
        uploadPercent.value = percent;
      });
      // 上传返回 UploadVo，正文只落 objectKey；目录由服务端按 bizType 决定。
      const objectKey = typeof res?.data === 'string' ? res.data : res?.data?.objectKey;
      if (!objectKey) throw new Error('上传未返回 objectKey');
      return `/${String(objectKey).replace(/^\/+/, '')}`;
    } finally {
      uploadPercent.value = null;
    }
  };

  // 上传前校验类型与体积，避免超大文件或类型不符的文件直接推到服务端
  const checkUploadFile = (file: File, kind: MediaKind) => {
    const isImage = kind === 'image';
    const typeLabel = isImage ? '图片' : '视频';
    const maxMb = isImage ? IMAGE_UPLOAD_MAX_MB : VIDEO_UPLOAD_MAX_MB;

    // 个别格式浏览器取不到 MIME，此时只按体积限制，避免误拦有效文件
    if (file.type && !file.type.startsWith(`${kind}/`)) {
      ElMessage.warning(`请选择${typeLabel}文件`);
      return false;
    }
    if (file.size > maxMb * 1024 * 1024) {
      ElMessage.warning(`${typeLabel}不能超过 ${maxMb}MB`);
      return false;
    }
    return true;
  };

  // 上传期间文档可能已被修改，原坐标越界时退回当前选区，避免插入抛错
  const insertContentAtSafe = (content: any, position?: number) => {
    const instance = editor.value;
    if (!instance) return;

    const docSize = instance.state.doc.content.size;
    const hasValidPosition =
      typeof position === 'number' && position >= 0 && position <= docSize;
    const targetPos = hasValidPosition ? position : instance.state.selection.from;

    instance.chain().focus().insertContentAt(targetPos, content).run();
  };

  // 块级节点（视频）不能落在段落内部，落点在文本块时对齐到该块末尾
  const toBlockPosition = (position?: number) => {
    const instance = editor.value;
    if (!instance || typeof position !== 'number') return position;

    const docSize = instance.state.doc.content.size;
    if (position < 0 || position > docSize) return position;

    const $pos = instance.state.doc.resolve(position);
    return $pos.parent.isTextblock ? $pos.after($pos.depth) : position;
  };

  const insertUploadedImage = async (file: File, position?: number) => {
    if (!checkUploadFile(file, 'image')) return;

    try {
      const url = await doUpload(file);
      insertContentAtSafe(
        [
          { type: 'image', attrs: { src: url, scale: DEFAULT_IMAGE_SCALE } },
          { type: 'text', text: ' ' },
        ],
        position
      );
    } catch (err) {
      console.error('图片上传失败:', err);
      ElMessage.error('图片上传失败');
    }
  };

  // 拖拽上传入口：按文件类型分发到图片 / 视频
  const insertUploadedMedia = async (file: File, position?: number) => {
    if (!file.type.startsWith('video/')) {
      await insertUploadedImage(file, position);
      return;
    }

    if (!checkUploadFile(file, 'video')) return;

    try {
      const url = await doUpload(file);
      insertContentAtSafe({ type: 'video', attrs: { src: url } }, toBlockPosition(position));
    } catch (err) {
      console.error('视频上传失败:', err);
      ElMessage.error('视频上传失败');
    }
  };

  // 工具栏选择文件后的统一入口：image 落在光标处，video 作为块插入
  const onSelectFile = async ({ kind, file }: SelectFilePayload) => {
    if (kind === 'image') {
      await insertUploadedImage(file);
      return;
    }

    if (!checkUploadFile(file, 'video')) return;

    try {
      const url = await doUpload(file);
      editor.value?.chain().focus().setVideo({ src: url }).run();
    } catch (err) {
      console.error('视频上传失败:', err);
      ElMessage.error('视频上传失败');
    }
  };

  // 返回是否插入成功，调用方据此决定是否收起网络图片面板
  const insertNetworkImage = () => {
    if (!editor.value) return false;

    const url = networkImageUrl.value.trim();
    if (!url) {
      ElMessage.warning('请填写图片地址');
      return false;
    }
    if (!NETWORK_IMAGE_SRC.test(url)) {
      ElMessage.warning('图片地址需以 http(s):// 或 / 开头');
      return false;
    }

    const name = networkImageName.value.trim();
    editor.value
      ?.chain()
      .focus()
      .insertContent([
        {
          type: 'image',
          attrs: {
            src: url,
            alt: name || null,
            title: name || null,
            scale: DEFAULT_IMAGE_SCALE,
          },
        },
        { type: 'text', text: ' ' },
      ])
      .run();

    networkImageUrl.value = '';
    networkImageName.value = '';
    return true;
  };

  const getImageFileFromClipboard = (event: ClipboardEvent) => {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => item.kind === 'file' && item.type.startsWith('image/'));

    return imageItem?.getAsFile() || null;
  };

  return {
    uploadPercent,
    networkImageUrl,
    networkImageName,
    insertUploadedImage,
    insertUploadedMedia,
    insertNetworkImage,
    getImageFileFromClipboard,
    onSelectFile,
  };
};
