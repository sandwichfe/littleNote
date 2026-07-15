// 工具栏选项与编辑器尺寸常量集中维护，避免入口组件继续膨胀。
export const fonts = [
  { label: '宋体', value: 'SimSun, serif' },
  { label: '黑体', value: 'SimHei, sans-serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: '楷体', value: 'KaiTi, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: '等宽 Monospace', value: 'Consolas, Monaco, monospace' },
];

export const blockTypes = [
  { label: '正文', value: 'paragraph' },
  { label: '标题 1', value: 'heading-1' },
  { label: '标题 2', value: 'heading-2' },
  { label: '标题 3', value: 'heading-3' },
  { label: '标题 4', value: 'heading-4' },
  { label: '标题 5', value: 'heading-5' },
  { label: '标题 6', value: 'heading-6' },
];

export const codeLanguages = [
  { label: '自动 / 纯文本', value: '' },
  { label: 'Plain Text', value: 'plaintext' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'HTML / XML', value: 'xml' },
  { label: 'CSS', value: 'css' },
  { label: 'SCSS', value: 'scss' },
  { label: 'JSON', value: 'json' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Bash', value: 'bash' },
  { label: 'Shell', value: 'shell' },
  { label: 'SQL', value: 'sql' },
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'python' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'C#', value: 'csharp' },
  { label: 'PHP', value: 'php' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'Swift', value: 'swift' },
  { label: 'YAML', value: 'yaml' },
  { label: 'Diff', value: 'diff' },
];

export const DEFAULT_TEXT_COLOR = '#000000';
export const DEFAULT_BACKGROUND_COLOR = '#ffffff';
export const commonColors = [
  '#ff0000',
  '#eded0f',
  '#00b050',
  '#00b0f0',
  '#7030a0',
  '#0000ff',
  '#000000',
  '#843c0c',
  '#808080',
  '#d9ead3',
  '#d9d9d9',
  '#ffffff',
];

export const DEFAULT_IMAGE_SCALE = '100%';
export const MIN_IMAGE_SCALE_PERCENT = 10;
export const MAX_IMAGE_SCALE_PERCENT = 300;
export const TABLE_PICKER_ROWS = 8;
export const TABLE_PICKER_COLS = 10;
export const TABLE_PICKER_DEFAULT_ROWS = 6;
export const TABLE_PICKER_DEFAULT_COLS = 6;
export const TABLE_TOOLBAR_FALLBACK_WIDTH = 322;
export const TABLE_TOOLBAR_OFFSET = 8;

export const imageToolbarOptions = [
  { label: '50%', value: '50%' },
  { label: '75%', value: '75%' },
  { label: '100%', value: '100%' },
  { label: '125%', value: '125%' },
  { label: '150%', value: '150%' },
  { label: '175%', value: '175%' },
  { label: '200%', value: '200%' },
];
