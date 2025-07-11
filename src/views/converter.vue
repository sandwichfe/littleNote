<template>
  <div class="converter-container">
    <div class="converter-header">
      <h1 class="title">HTML ⇄ Markdown 转换器</h1>
      <p class="subtitle">在线转换HTML和Markdown格式</p>
    </div>

    <div class="converter-main">
      <!-- 转换方向选择 -->
      <div class="direction-selector">
        <el-radio-group v-model="conversionDirection" size="large">
          <el-radio-button label="html-to-md">HTML → Markdown</el-radio-button>
          <el-radio-button label="md-to-html">Markdown → HTML</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 转换区域 -->
      <div class="conversion-area">
        <!-- 输入区域 -->
        <div class="input-section">
          <div class="section-header">
            <h3>{{ inputTitle }}</h3>
            <div class="section-actions">
              <el-button size="small" @click="clearInput">清空</el-button>
              <el-button size="small" @click="loadExample">示例</el-button>
              <el-button size="small" @click="copyInput">复制</el-button>
            </div>
          </div>
          <el-input
            v-model="inputContent"
            type="textarea"
            :placeholder="inputPlaceholder"
            :rows="20"
            class="input-textarea"
            @input="handleInputChange"
          />
        </div>

        <!-- 转换按钮 -->
        <div class="convert-button-section">
          <el-button 
            type="primary" 
            size="large" 
            @click="convertContent"
            :loading="converting"
            :disabled="!inputContent.trim()"
          >
            <el-icon><Switch /></el-icon>
            转换
          </el-button>
        </div>

        <!-- 输出区域 -->
        <div class="output-section">
          <div class="section-header">
            <h3>{{ outputTitle }}</h3>
            <div class="section-actions">
              <el-button size="small" @click="clearOutput">清空</el-button>
              <el-button size="small" @click="copyOutput">复制</el-button>
              <el-button size="small" @click="downloadOutput">下载</el-button>
            </div>
          </div>
          
          <!-- 预览模式切换 -->
          <div class="preview-tabs">
            <el-tabs v-model="previewMode" class="preview-tabs-content">
              <el-tab-pane label="源码" name="source">
                <el-input
                  v-model="outputContent"
                  type="textarea"
                  :placeholder="outputPlaceholder"
                  :rows="20"
                  class="output-textarea"
                  readonly
                />
              </el-tab-pane>
              <el-tab-pane label="预览" name="preview">
                <div 
                  class="preview-content"
                  v-html="previewContent"
                ></div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Switch } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'

// 初始化转换器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
})

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full'
})

// 响应式数据
const conversionDirection = ref('html-to-md')
const inputContent = ref('')
const outputContent = ref('')
const converting = ref(false)
const previewMode = ref('source')

// 计算属性
const inputTitle = computed(() => {
  return conversionDirection.value === 'html-to-md' ? 'HTML 输入' : 'Markdown 输入'
})

const outputTitle = computed(() => {
  return conversionDirection.value === 'html-to-md' ? 'Markdown 输出' : 'HTML 输出'
})

const inputPlaceholder = computed(() => {
  return conversionDirection.value === 'html-to-md' 
    ? '请输入HTML代码...'
    : '请输入Markdown文本...'
})

const outputPlaceholder = computed(() => {
  return conversionDirection.value === 'html-to-md'
    ? 'Markdown输出将显示在这里...'
    : 'HTML输出将显示在这里...'
})

const previewContent = computed(() => {
  if (conversionDirection.value === 'md-to-html') {
    return outputContent.value
  } else {
    // 如果是HTML转Markdown，预览Markdown渲染后的HTML
    return markdownToHtml(outputContent.value)
  }
})

// 监听转换方向变化
watch(conversionDirection, () => {
  inputContent.value = ''
  outputContent.value = ''
})

// 方法
const handleInputChange = () => {
  // 实时转换（可选）
  // convertContent()
}

const convertContent = async () => {
  if (!inputContent.value.trim()) {
    ElMessage.warning('请输入要转换的内容')
    return
  }

  converting.value = true
  
  try {
    if (conversionDirection.value === 'html-to-md') {
      outputContent.value = await htmlToMarkdown(inputContent.value)
    } else {
      outputContent.value = await markdownToHtml(inputContent.value)
    }
    ElMessage.success('转换成功！')
  } catch (error) {
    console.error('转换失败:', error)
    ElMessage.error('转换失败，请检查输入格式')
  } finally {
    converting.value = false
  }
}

const clearInput = () => {
  inputContent.value = ''
}

const clearOutput = () => {
  outputContent.value = ''
}

const copyInput = async () => {
  try {
    await navigator.clipboard.writeText(inputContent.value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputContent.value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const downloadOutput = () => {
  if (!outputContent.value.trim()) {
    ElMessage.warning('没有内容可下载')
    return
  }

  const extension = conversionDirection.value === 'html-to-md' ? '.md' : '.html'
  const mimeType = conversionDirection.value === 'html-to-md' 
    ? 'text/markdown' 
    : 'text/html'
  
  const blob = new Blob([outputContent.value], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `converted_${Date.now()}${extension}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('文件下载成功')
}

const loadExample = () => {
  if (conversionDirection.value === 'html-to-md') {
    inputContent.value = `<h1>示例HTML文档</h1>
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
<h2>代码示例</h2>
<pre><code>function hello() {
  console.log("Hello, World!");
}</code></pre>
<blockquote>
  <p>这是一个引用块的示例。</p>
</blockquote>`
  } else {
    inputContent.value = `# 示例Markdown文档

这是一个**示例**Markdown文档，包含了常见的Markdown语法。

## 列表示例

- 列表项1
- 列表项2
- 列表项3

## 链接和图片

这是一个[链接示例](https://example.com)。

![示例图片](https://via.placeholder.com/300x200)

## 代码示例

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

> 这是一个引用块的示例。

### 表格示例

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |`
  }
}

// 转换函数
const htmlToMarkdown = async (html) => {
  try {
    return turndownService.turndown(html)
  } catch (error) {
    console.error('HTML转Markdown失败:', error)
    throw new Error('HTML转换失败，请检查HTML格式是否正确')
  }
}

const markdownToHtml = async (markdown) => {
  try {
    return md.render(markdown)
  } catch (error) {
    console.error('Markdown转HTML失败:', error)
    throw new Error('Markdown转换失败，请检查Markdown语法是否正确')
  }
}
</script>

<style scoped>
.converter-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #ecedf1 0%, #ffffff 100%);;
  padding: 20px;
}

.converter-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.converter-main {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.direction-selector {
  text-align: center;
  margin-bottom: 30px;
}

.conversion-area {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: start;
}

.input-section,
.output-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e9ecef;
  transition: border-color 0.3s ease;
}

.input-section:focus-within {
  border-color: #409eff;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.input-textarea,
.output-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.convert-button-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.convert-button-section .el-button {
  padding: 15px 30px;
  font-size: 16px;
  border-radius: 25px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.convert-button-section .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.preview-tabs {
  margin-top: 15px;
}

.preview-tabs-content {
  border: none;
}

.preview-content {
  min-height: 400px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

.preview-content h1,
.preview-content h2,
.preview-content h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 16px;
}

.preview-content h1 {
  font-size: 2rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.preview-content h2 {
  font-size: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.preview-content h3 {
  font-size: 1.25rem;
}

.preview-content p {
  margin-bottom: 16px;
  color: #555;
}

.preview-content ul,
.preview-content ol {
  margin-bottom: 16px;
  padding-left: 30px;
}

.preview-content li {
  margin-bottom: 8px;
}

.preview-content pre {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.preview-content code {
  background: #f6f8fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.preview-content blockquote {
  border-left: 4px solid #dfe2e5;
  padding-left: 16px;
  margin: 16px 0;
  color: #6a737d;
  font-style: italic;
}

.preview-content img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 16px 0;
}

.preview-content table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.preview-content th,
.preview-content td {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
  text-align: left;
}

.preview-content th {
  background: #f6f8fa;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .conversion-area {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .convert-button-section {
    order: 2;
  }
  
  .output-section {
    order: 3;
  }
}

@media (max-width: 768px) {
  .converter-container {
    padding: 10px;
  }
  
  .converter-main {
    padding: 20px;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .section-actions {
    flex-wrap: wrap;
  }
  
  .input-textarea,
  .output-textarea {
    font-size: 12px;
  }
}
</style>