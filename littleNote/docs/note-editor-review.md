# 笔记详情页 & 富文本编辑器 · 评审报告

> 评审对象
>
> - `src/views/apps/note/noteDetail.vue`
> - `src/components/RichEditor/index.vue`（含 `config.ts` / `styles.css` / `extensions/`）
>
> 参考上下文：`src/router/index.ts`、`src/network/note/*`、`src/views/apps/note/note.vue`、`src/components/layout/GlobalHeader.vue`、`src/utils/aesUtil.js`

## 总体结论

编辑器本体完成度相当高：代码块带语言选择、图片可缩放/可改地址、表格带行列工具栏与尺寸选择器、文字色/背景色面板、自定义视频节点，这些都是加分项。

真正的短板集中在两层：

1. **笔记详情页（noteDetail.vue）更像一个壳**：没有标题、没有未保存保护、没有保存状态反馈，路由复用还存在数据不刷新的隐患。
2. **编辑器（RichEditor）缺几个高频入口**（超链接 / 引用块 / 行内代码），并存在若干响应式刷新隐患。

---

## 目录

- [一、必须修的缺陷](#一必须修的缺陷)
- [二、功能缺口](#二功能缺口)
- [三、交互与设计](#三交互与设计)
- [四、代码与性能](#四代码与性能)
- [五、落地顺序建议](#五落地顺序建议)

---

## 一、必须修的缺陷

### P0-1 同一标签页切换笔记时，页面内容不会更新

`onMounted` 里只读一次路由参数：

```ts
// src/views/apps/note/noteDetail.vue:173-186
onMounted(() => {
  const paramId = Number(router.currentRoute.value.params.id);
  noteData.value.noteId = paramId;

  if (paramId !== -1) {
    getNote(paramId).then((res) => {
```

`/noteDetail/:id` 是同一个 route record，从 A 笔记跳到 B 笔记时组件会被**复用**，`onMounted` 不再执行：

- 编辑器仍显示上一篇内容；
- `noteData.noteId` 也不更新，此时按 `Ctrl+S` 会**把 A 的内容覆盖写入 A**，而用户以为在编辑 B；
- `props.initialViewMode`（来自 query 的函数式 props）同样只在初始化时生效。

**建议**：抽出 `loadNote(id)`，在 `onMounted` 与 `watch(() => route.params.id, loadNote, { immediate: true })` 中调用；`viewMode` 一并跟随 query 变化。

### P0-2 没有任何「未保存」保护

- 编辑后切到预览、点删除、刷新、关标签页，全都不提示；
- 没有自动保存（Ctrl+S 属于「靠用户记得」的方案）；
- 切分组只改本地 `noteData.groupId`，不保存就丢失，也没有脏标记。

全仓库搜索 `beforeunload / onBeforeRouteLeave` 为 0 命中。

**建议**：编辑器 `onUpdate` 置 `dirty = true` → `onBeforeRouteLeave` + `beforeunload` 拦截 → 再配 3~5 秒防抖自动保存（复用 `saveNote`，加 `saving` 锁）。

### P0-3 保存逻辑的健壮性问题

```ts
// src/views/apps/note/noteDetail.vue:212-235
const saveNote = () => {
  ...
  if (noteData.value.noteId === -1) {
    addNote(...).then((res) => {
      if (res.code === 200) { ... }
    });
  } else {
    editNote(...).then((res) => {
      ElMessage.success('保存成功！');
    });
  }
};
```

1. `editNote` 分支**完全不看 `res.code`**，接口失败也弹「保存成功」；
2. 两个分支都没有 `catch`，也没有 `finally` 解锁，连点会并发提交；
3. 新建分支 `if (res.data)` 为假时静默失败，用户只知道没跳转；
4. 没有「保存中」态，按钮不 disabled；
5. `addNote` 成功后 `router.replace` 会触发路由变化，若按 P0-1 加了 watch，需在 `loadNote` 里用 `id === noteData.noteId` 短路，避免重复请求。

### P0-4 标题无法编辑，且自动生成有坑

`buildNoteTitle` 取纯文本前 100 字（`noteDetail.vue:208-210`），而列表页展示的正是这个标题。

后果：

- 正文以图片/表格开头时标题为空；
- 代码块内容会被拼进标题；
- 用户想改标题只能改正文。

**建议**：工具栏下方加无边框大号标题输入框；为空时回填正文首行；正文首行为 `h1` 时自动同步。

### P1-1 预览模式下仍能改分组、保存，语义混乱

`viewMode === 'preview'` 时编辑器只读，但分组 `el-select`、保存、删除按钮全部可交互：

- 用户改了分组以为生效，实际要再点保存；
- 或者点了保存，把没想保存的改动落库。

**建议**：预览模式隐藏/禁用分组与保存（或保存后自动回到预览）。

### P1-2 工具栏选中态刷新不可靠

```vue
<!-- src/components/RichEditor/index.vue:23-26 -->
<button class="re-btn" :class="{ active: editor.isActive('bold') }"
        @click="run(c => c.toggleBold())" title="加粗 (Ctrl+B)">
```

`useEditor` 返回的是 `shallowRef`，`editor.isActive()` 在模板里**不是响应式依赖**（见 `node_modules/@tiptap/vue-3/dist/index.js:253-257`，只做了 `editor.value = new Editor(...)`）。

目前「看起来正常」靠的是父级 `v-model` 回流触发子组件重渲染；而**纯移动光标（同类型文本块之间）不触发 `onUpdate`**，此时加粗/斜体/对齐/列表/代码块的高亮态会停留在上一次状态。

`syncToolbarState` 只改 `currentBlock / currentFont / isSelectionInTable` 三个值，值相同不触发渲染。

**建议**：加 `const toolbarTick = ref(0)`，在 `onSelectionUpdate` / `onUpdate` 中自增，模板里引用一次（`void toolbarTick`）即可强制重算。

### P1-3 颜色指示条不同步

`syncToolbarState` 只同步了 `fontFamily`，没同步 `textStyle.color` 与 `highlight.color`。

- 光标落到红字上，颜色条仍显示上次选的色；
- 此时点「文字颜色」主按钮，会把红字刷成那个旧色。

### P1-4 异步上传后使用旧坐标插入

```ts
// src/components/RichEditor/index.vue:916-936
const insertUploadedImage = async (file: File, position?: number) => {
  try {
    const url = await doUpload(file);
    ...
    if (typeof position === 'number') {
      chain.insertContentAt(position, imageContent).run();
```

`position` 是粘贴瞬间的 `selection.from`，await 期间用户继续打字/撤销会导致坐标越界 → 抛异常或插错位置。

**建议**：上传结束后改用 `editor.state.selection.from`，并用 `editor.can().insertContentAt(...)` 兜底。

### P1-5 粘贴图片会吞掉同时存在的文字

`handlePaste` 只要发现剪贴板里有 image 文件就 `preventDefault()` 并返回 `true`（`index.vue:558-566`）。从 Word/网页复制「文字 + 图片」时，文字全部丢失。

**建议**：存在 `text/html` 时交给默认粘贴；图片走 `handleDrop`，或仅在剪贴板仅含图片时拦截。

### P2 细节清单

| 问题 | 位置 | 说明 |
| --- | --- | --- |
| `Ctrl+S` 用 `event.key === 's'` | `noteDetail.vue:271` | Caps Lock 开启时 `key` 为 `'S'`，保存失效；也未支持 Mac 的 `metaKey` |
| `ctrlS_timer` 未在卸载时清理 | `noteDetail.vue:254, 203-205` | 只移除了 keydown 监听；类型建议 `ReturnType<typeof setTimeout>` 而非 `NodeJS.Timeout` |
| 切换模式每次弹 toast | `noteDetail.vue:169-171` | 「进入编辑模式/预览模式」属噪音，应改为静默按钮态或状态栏文字 |
| 新笔记删除按钮未禁用 | `noteDetail.vue:72-80` | 目前点了才 `warning('新笔记无法删除')`，应 `:disabled` |
| `groupValue` 类型不一致 | `noteDetail.vue:148, 152-154, 183` | `ref('')` 是 string，选项 id 是 number，`changeGroup(newValue: string)` 收 number；建议 `ref<number \| null>(null)` |
| 页面高度硬编码 | `noteDetail.vue:292, 730-731` | `calc(100vh - 64px)` 依赖 GlobalHeader 的 `min-height`，移动端 `100vh` 会被地址栏顶破；父级 `.app-content` 已是 `flex:1; min-height:0`，直接 `height:100%` 更稳 |
| 编辑器容器内联样式 | `noteDetail.vue:84-87` | `border: 1px solid #ccc` 与整页灰阶（`#dadce0` / `#5f6368`）不统一，且应下沉到 class |
| 解密无容错 | `noteDetail.vue:182` | `decrypted()` 遇到历史明文/损坏密文会得到空串或乱码，静默丢内容；建议 `try/catch` 并回退原文 |
| `closeLoading()` 时机 | `noteDetail.vue:200` | 在请求发出前就关闭，骨架与 loading 都指望不上；建议页面自带 loading 骨架 |
| 上传无大小/类型/进度 | `index.vue:276-277, 908-914` | `accept="video/*"` 可直接选几百 MB 文件，无体积上限、无进度、失败只能整次重来 |
| 无空文档占位 | `index.vue:519-568` | 未安装 Placeholder 扩展，空笔记一片空白，缺「开始输入…」引导 |
| AES 密钥硬编码在包内 | `src/utils/aesUtil.js:3` | 明文 `key` + ECB 模式，属「混淆」而非加密；且列表页 `highlightContent` 由 ES 返回高亮片段，说明服务端仍能拿到明文，加密收益有限。至少应改为 CBC + 随机 IV，或移到服务端 |

---

## 二、功能缺口

### 编辑器（按性价比排序）

1. **超链接** —— 完全没有。未安装 `@tiptap/extension-link`，工具栏无入口，粘贴 URL 也无法变成可点链接。博客编辑器必需品。
2. **引用块** —— `styles.css:706-712` 已写好 `blockquote` 样式，但工具栏**没有按钮**（StarterKit 自带命令），样式白写。
3. **行内代码** `code` —— 代码块有，行内 `code` 没有。
4. **清除格式** —— 粘贴网页内容后无法一键去样式。
5. **查找替换** —— 长文必备（浏览器 Ctrl+F 只能找 DOM，无法定位到 ProseMirror 选区）。
6. **Markdown 快捷输入** —— `# ` / `- ` / `> ` / ` ``` ` / `**x**` 触发。`markdown-it` 已在 `package.json` 但 `src/` 零引用，属于「依赖装了功能没做」。
7. **拖拽上传** —— 只有剪贴板粘贴与 input 选择，没有 `drop / dragover`，拖图片进来会变成 `file://` 或直接被浏览器打开。
8. **粘贴 Word/网页清洗** —— `Color` + `TextStyle` 会全量保留外来 `style="color:...;font-family:..."`，排版会很花。
9. **字数统计** —— `@tiptap/extension-character-count`，含选中字数。
10. **全屏 / 专注模式**、**大纲目录** —— 提取 heading 做侧边 TOC，长文刚需。
11. **导出** —— Markdown / HTML / 图片 / PDF。
12. **表格增强** —— 合并单元格、表头切换、单元格对齐。
13. **可选** —— 待办清单 `taskList`、上标下标、缩进。

### 笔记详情页

- 标题编辑、创建/更新时间、字数展示；
- 自动保存 + 保存状态（`保存中… / 已保存 12:03 / 未保存`）；
- 版本历史 / 快照（现在一次覆盖，误删只能靠 Ctrl+Z，刷新即无）；
- 笔记操作：置顶、星标、多标签、复制为 Markdown、分享只读链接、导出；
- 回收站（`deleteNoteItem` 是物理删除，见 `network/note/note.ts:65`，无恢复）；
- 上一篇 / 下一篇、同分组快速切换；
- 加密提示（用户不知道内容被加密，换设备/清缓存后无法恢复的误解风险）。

---

## 三、交互与设计

1. **信息层级**：当前顶部只有「分组 + 编辑/预览 + 保存 + 删除」，正文直接顶到工具栏下方，没有标题层级。合理结构：`返回 → 标题输入 → 元信息（分组·更新时间·字数）→ 工具栏 → 正文`。
2. **保存反馈**：`toolbar-btn-save` 是实心深灰主按钮，视觉权重过高且无保存态。改为右侧低调按钮 + 状态文字（「已保存」带勾）更接近 Notion / 语雀心智。
3. **预览排版**：预览与编辑内容宽度完全一致（`.re-content .ProseMirror` 仅 `padding: 20px 24px`，`styles.css:421-427`）。预览应 `max-width: 760px; margin: 0 auto` 居中，否则大屏满行文字，阅读体验差。
4. **模式切换 toast**：见 P2，去掉。
5. **移动端工具栏**：`.re-toolbar-row` 是 `flex-wrap: wrap`（`styles.css:21-26`），小屏会堆成 3~4 行挤压正文。建议单行横向滚动 + 溢出「更多」菜单。
6. **工具栏分组**：现在 20+ 按钮平铺，仅靠 `re-sep` 分隔。可把「字体 / 字号 / 颜色」收进「文本格式」下拉，减少约 60% 横向占用。
7. **无障碍**：大量按钮只有 `title`、没有 `aria-label`（表格工具、视频按钮）；`<select>` 无 `<label>`；工具栏无 `role="toolbar"`。`title` 在触屏上不显示，等于没有提示。
8. **暗色主题**：`store/theme.ts` 存在，但编辑器把 `#fff` / `#262626` / `#fafafa` 写死（`styles.css:402, 427, 715`），暗色下白底刺眼。至少抽成 CSS 变量。
9. **快捷键提示**：`Ctrl+S / Ctrl+D` 目前靠口口相传，可在工具栏加 `?` 弹层统一暴露。

---

## 四、代码与性能

1. **`index.vue` 已 998 行**，单文件含 25 个工具栏按钮 + 全部业务逻辑。建议拆分：`EditorToolbar.vue`、`useImageUpload.ts`、`useTableToolbar.ts`、`icons.ts`（现在 20+ 内联 SVG 硬编码在模板里）。
2. **每次输入序列化两遍整篇文档**：`onUpdate` 中 `editor.getHTML()`（`index.vue:550`）+ 父级回流后 `watch(modelValue)` 再次 `editor.getHTML()` 比较（`index.vue:573`）。长文档带图片表格时是明显卡顿源。建议 `onUpdate` 用 150~300ms 防抖 emit，`watch` 侧改比较来源标记或直接用 `setContent(val, false)` 控制。
3. **类型大量 `any`**：`syncToolbarState(targetEditor?: any)`、`run(fn: (chain: any) => any)`、`groups = ref<any[]>([])`。`Editor` / `ChainedCommands` 均有正式类型。
4. **`toggleCodeBlock` 手写 `nodesBetween` 找插入位置**（`index.vue:696-713`），`from - 2 / + nodeSize + 2` 属启发式偏移；简化为「插入后 `Selection.near(tr.mapping.map(from))`」更稳。
5. **`updateTableToolbarPosition` 每次 selectionUpdate 都 `nextTick` + `getBoundingClientRect` + 两次递归重排**（`index.vue:441-471`），打字时频繁触发布局读取。建议仅在 `isActive('table')` 时计算并节流。
6. **两套并行键盘体系**：`document` 监听在编辑器内（`index.vue:587-596`），`window` 监听在详情页（`noteDetail.vue:199`），`Ctrl+D` 由页面处理、`Esc` 由编辑器处理，易互相打架。建议统一到 `useEditorShortcuts`。
7. **`Note` 类型缺 `groupId`**：`network/note/note.ts:5-13` 未声明，但详情页在用 `res.data.groupId`。建议补齐，顺带补 `pinned / tags / wordCount` 等字段。
8. **`viewMode` 与 URL 脱钩**：模式切换后 query 不更新，刷新又回默认 `preview`，用户以为编辑态丢失。建议 `router.replace({ query: { viewMode } })`。

---

## 五、落地顺序建议

| 阶段 | 内容 | 验证方式 |
| --- | --- | --- |
| 第一批（约半天） | P0-1 路由 watch、P0-3 保存分支校验 + loading/失败提示、P1-1 预览态禁用分组/保存、P2 快捷键与小问题 | 同标签页 A→B 切换内容正确；断网保存有 error；预览态按钮禁用 |
| 第二批（约 1 天） | 标题输入 + 脏标记 + `beforeunload` / `onBeforeRouteLeave` + 防抖自动保存 + 保存状态文字 | 编辑后关标签页有提示；3 秒后出现「已保存」 |
| 第三批（约 1 天） | 链接、引用块、行内代码、清除格式、拖拽上传、placeholder、字数统计 | 逐项手测 |
| 第四批（按需） | 工具栏 active 刷新修复、预览居中排版、整篇文档防抖、样式变量化 & 暗色、拆分组件 | 光标移动时按钮高亮正确；长文档输入不卡 |

> 建议从**第一批 + 标题/自动保存**开始：改动集中在 `noteDetail.vue`，不碰编辑器内部，风险最低。
