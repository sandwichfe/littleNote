# HTML ⇄ Markdown 转换器

这是一个基于Vue3开发的在线HTML和Markdown互转工具，集成在littleNote项目中。

## 功能特性

### 🔄 双向转换
- **HTML → Markdown**: 将HTML代码转换为Markdown格式
- **Markdown → HTML**: 将Markdown文本转换为HTML代码

### 🎨 用户界面
- 现代化的响应式设计
- 实时预览功能
- 源码和预览模式切换
- 美观的渐变背景和卡片布局

### 🛠️ 实用功能
- **一键转换**: 点击转换按钮即可完成格式转换
- **示例加载**: 提供示例内容帮助快速上手
- **复制功能**: 一键复制输入或输出内容
- **文件下载**: 支持将转换结果下载为文件
- **清空操作**: 快速清空输入或输出区域

## 技术实现

### 核心依赖
- **markdown-it**: 用于Markdown到HTML的转换
- **turndown**: 用于HTML到Markdown的转换
- **Element Plus**: UI组件库
- **Vue 3**: 前端框架

### 转换器配置

#### Markdown-it 配置
```javascript
const md = new MarkdownIt({
  html: true,        // 允许HTML标签
  linkify: true,     // 自动识别链接
  typographer: true, // 启用排版功能
  breaks: true       // 换行符转换为<br>
})
```

#### Turndown 配置
```javascript
const turndownService = new TurndownService({
  headingStyle: 'atx',           // 使用 # 风格的标题
  hr: '---',                     // 水平线样式
  bulletListMarker: '-',         // 无序列表标记
  codeBlockStyle: 'fenced',      // 使用围栏式代码块
  fence: '```',                  // 代码块围栏
  emDelimiter: '*',              // 斜体分隔符
  strongDelimiter: '**',         // 粗体分隔符
  linkStyle: 'inlined',          // 内联链接样式
  linkReferenceStyle: 'full'     // 完整引用样式
})
```

## 使用方法

### 访问转换器
1. 启动项目: `npm run dev`
2. 访问: `http://localhost:3000/converter`

### 转换操作
1. **选择转换方向**: 使用顶部的单选按钮选择转换方向
2. **输入内容**: 在左侧输入区域粘贴或输入要转换的内容
3. **执行转换**: 点击中间的"转换"按钮
4. **查看结果**: 在右侧查看转换结果，可切换源码和预览模式

### 示例内容

#### HTML示例
```html
<h1>示例HTML文档</h1>
<p>这是一个<strong>示例</strong>HTML文档，包含了常见的HTML元素。</p>
<h2>列表示例</h2>
<ul>
  <li>列表项1</li>
  <li>列表项2</li>
  <li>列表项3</li>
</ul>
<h2>链接和图片</h2>
<p>这是一个<a href="https://example.com">链接示例</a>。</p>
<img src="https://via.placeholder.com/300x200" alt="示例图片">
```

#### Markdown示例
```markdown
# 示例Markdown文档

这是一个**示例**Markdown文档，包含了常见的Markdown语法。

## 列表示例

- 列表项1
- 列表项2
- 列表项3

## 链接和图片

这是一个[链接示例](https://example.com)。

![示例图片](https://via.placeholder.com/300x200)

## 代码示例

```javascript
function hello() {
  console.log("Hello, World!");
}
```

> 这是一个引用块的示例。
```

## 支持的元素

### HTML → Markdown
- 标题 (h1-h6)
- 段落 (p)
- 粗体 (strong, b)
- 斜体 (em, i)
- 链接 (a)
- 图片 (img)
- 列表 (ul, ol, li)
- 代码块 (pre, code)
- 引用 (blockquote)
- 水平线 (hr)
- 表格 (table, tr, td, th)

### Markdown → HTML
- ATX风格标题 (# ## ###)
- 段落
- 粗体 (**text**)
- 斜体 (*text*)
- 链接 ([text](url))
- 图片 (![alt](url))
- 无序列表 (- item)
- 有序列表 (1. item)
- 代码块 (```code```)
- 行内代码 (`code`)
- 引用 (> text)
- 水平线 (---)
- 表格

## 响应式设计

转换器支持多种屏幕尺寸:
- **桌面端**: 左右分栏布局，最佳体验
- **平板端**: 上下布局，保持功能完整
- **移动端**: 优化的单列布局，适配小屏幕

## 文件结构

```
src/
├── views/
│   └── converter.vue          # 转换器主页面
├── router/
│   └── index.ts              # 路由配置
package.json                   # 项目依赖
```

## 开发说明

### 添加新功能
1. 在`converter.vue`中添加新的转换逻辑
2. 可以扩展markdown-it和turndown的插件
3. 添加新的UI组件和样式

### 自定义配置
- 修改markdown-it配置以支持更多Markdown扩展
- 调整turndown配置以改变HTML转换行为
- 自定义CSS样式以匹配项目主题

## 注意事项

1. **HTML安全**: 转换器会保留HTML标签，请注意XSS安全
2. **复杂表格**: 复杂的HTML表格可能转换效果不理想
3. **自定义样式**: CSS样式信息在转换过程中会丢失
4. **JavaScript**: HTML中的JavaScript代码会被移除

## 未来改进

- [ ] 支持更多Markdown扩展语法
- [ ] 添加语法高亮
- [ ] 支持批量文件转换
- [ ] 添加转换历史记录
- [ ] 支持自定义转换规则
- [ ] 集成更多格式支持(如AsciiDoc)

---

**项目地址**: littleNote HTML/Markdown转换器  
**技术栈**: Vue 3 + Element Plus + markdown-it + turndown  
**开发时间**: 2024年