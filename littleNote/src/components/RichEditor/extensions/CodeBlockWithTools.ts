import type { NodeViewRendererProps } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import type { ViewMutationRecord } from '@tiptap/pm/view';
import { ElMessage } from 'element-plus';

import { codeLanguages } from '../config';

// 代码块节点集中处理语言选择和复制操作。
const copyText = async (text: string) => {
  if (!text) {
    ElMessage.warning('当前代码块没有可复制的内容');
    return;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    ElMessage.success('代码已复制');
  } catch (err) {
    console.error('代码复制失败:', err);
    ElMessage.error('代码复制失败');
  }
};

const createCodeBlockView = ({ node, view, getPos, HTMLAttributes }: NodeViewRendererProps) => {
  let currentNode = node;
  const pre = document.createElement('pre');
  Object.entries(HTMLAttributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) pre.setAttribute(key, String(value));
  });

  const tools = document.createElement('div');
  tools.className = 're-code-tools';
  tools.contentEditable = 'false';
  tools.addEventListener('mousedown', (event) => {
    event.stopPropagation();
  });

  const toolsLeft = document.createElement('div');
  toolsLeft.className = 're-code-tools-left';

  const select = document.createElement('select');
  select.className = 're-code-language';
  select.title = '代码语言';
  select.addEventListener('change', () => {
    const pos = getPos();
    if (typeof pos !== 'number') return;

    const current = view.state.doc.nodeAt(pos);
    if (!current) return;

    view.dispatch(
      view.state.tr.setNodeMarkup(pos, undefined, {
        ...current.attrs,
        language: select.value || null,
      })
    );
  });
  codeLanguages.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });
  toolsLeft.appendChild(select);
  tools.appendChild(toolsLeft);

  const toolsRight = document.createElement('div');
  toolsRight.className = 're-code-tools-right';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 're-code-copy';
  button.innerHTML =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  button.setAttribute('aria-label', '复制代码');
  button.title = '复制代码';
  button.addEventListener('click', () => {
    void copyText(code.textContent || '');
  });
  toolsRight.appendChild(button);
  tools.appendChild(toolsRight);

  const code = document.createElement('code');
  pre.append(tools, code);

  const updateLanguage = (language: string) => {
    select.value = language;
    if (language) {
      pre.dataset.language = language;
      code.className = `language-${language}`;
    } else {
      delete pre.dataset.language;
      code.removeAttribute('class');
    }
  };
  updateLanguage(node.attrs.language || '');

  return {
    dom: pre,
    contentDOM: code,
    update: (updatedNode) => {
      if (updatedNode.type !== currentNode.type) return false;
      currentNode = updatedNode;
      updateLanguage(updatedNode.attrs.language || '');
      return true;
    },
    stopEvent: (event: Event) => tools.contains(event.target as globalThis.Node),
    ignoreMutation: (mutation: ViewMutationRecord) =>
      tools.contains(mutation.target as globalThis.Node),
  };
};

export const CodeBlockWithTools = CodeBlockLowlight.extend({
  addNodeView() {
    return createCodeBlockView;
  },
});
