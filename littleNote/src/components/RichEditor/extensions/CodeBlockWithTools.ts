import type { NodeViewRendererProps } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import type { ViewMutationRecord } from '@tiptap/pm/view';
import { ElMessage } from 'element-plus';

import { codeLanguages } from '../config';

// 代码块节点集中处理语言选择和复制操作。
let languagePickerId = 0;

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
  let selectedLanguage = node.attrs.language || '';
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

  // 自定义 combobox 便于统一样式，同时支持输入筛选和键盘选择。
  const picker = document.createElement('div');
  picker.className = 're-code-language-picker';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 're-code-language-trigger';
  trigger.title = '选择代码语言';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const triggerLabel = document.createElement('span');
  triggerLabel.className = 're-code-language-trigger-label';

  const triggerArrow = document.createElement('span');
  triggerArrow.className = 're-code-language-trigger-arrow';
  triggerArrow.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 10 5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  trigger.append(triggerLabel, triggerArrow);

  const dropdown = document.createElement('div');
  dropdown.className = 're-code-language-dropdown';
  dropdown.hidden = true;

  const searchWrap = document.createElement('div');
  searchWrap.className = 're-code-language-search-wrap';
  searchWrap.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 're-code-language-search';
  search.placeholder = '搜索语言';
  search.autocomplete = 'off';
  search.setAttribute('aria-label', '搜索代码语言');
  search.setAttribute('role', 'combobox');
  search.setAttribute('aria-autocomplete', 'list');
  search.setAttribute('aria-expanded', 'false');
  searchWrap.appendChild(search);

  const list = document.createElement('div');
  const pickerIndex = ++languagePickerId;
  list.id = `re-code-language-list-${pickerIndex}`;
  list.className = 're-code-language-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', '代码语言');
  trigger.setAttribute('aria-controls', list.id);
  search.setAttribute('aria-controls', list.id);
  dropdown.append(searchWrap, list);
  picker.append(trigger, dropdown);

  let filteredLanguages = [...codeLanguages];
  let activeIndex = -1;
  let isDropdownOpen = false;

  const updateActiveOption = (index: number, shouldScroll = true) => {
    const options = Array.from(
      list.querySelectorAll<HTMLButtonElement>('.re-code-language-option')
    );
    if (!options.length) {
      activeIndex = -1;
      search.removeAttribute('aria-activedescendant');
      return;
    }

    activeIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => {
      option.classList.toggle('is-active', optionIndex === activeIndex);
    });

    const activeOption = options[activeIndex];
    search.setAttribute('aria-activedescendant', activeOption.id);
    if (shouldScroll) activeOption.scrollIntoView({ block: 'nearest' });
  };

  const selectLanguage = (language: string) => {
    const pos = getPos();
    if (typeof pos !== 'number') return;

    const current = view.state.doc.nodeAt(pos);
    if (!current) return;

    view.dispatch(
      view.state.tr.setNodeMarkup(pos, undefined, {
        ...current.attrs,
        language: language || null,
      })
    );
  };

  const closeDropdown = (restoreFocus = false) => {
    if (!isDropdownOpen) return;
    isDropdownOpen = false;
    picker.classList.remove('is-open');
    dropdown.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    search.setAttribute('aria-expanded', 'false');
    search.removeAttribute('aria-activedescendant');
    if (restoreFocus) trigger.focus();
  };

  const renderLanguages = () => {
    list.replaceChildren();
    if (!filteredLanguages.length) {
      const empty = document.createElement('div');
      empty.className = 're-code-language-empty';
      empty.textContent = '未找到相关语言';
      list.appendChild(empty);
      updateActiveOption(-1, false);
      return;
    }

    filteredLanguages.forEach((item, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.id = `re-code-language-option-${pickerIndex}-${index}`;
      option.className = 're-code-language-option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(item.value === selectedLanguage));

      const label = document.createElement('span');
      label.textContent = item.label;

      const check = document.createElement('span');
      check.className = 're-code-language-option-check';
      check.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      check.hidden = item.value !== selectedLanguage;
      option.append(label, check);

      option.addEventListener('mouseenter', () => updateActiveOption(index, false));
      option.addEventListener('mousedown', (event) => event.preventDefault());
      option.addEventListener('click', () => {
        selectLanguage(item.value);
        closeDropdown(true);
      });
      list.appendChild(option);
    });

    const selectedIndex = filteredLanguages.findIndex((item) => item.value === selectedLanguage);
    updateActiveOption(selectedIndex >= 0 ? selectedIndex : 0, false);
  };

  const openDropdown = () => {
    if (isDropdownOpen) return;
    isDropdownOpen = true;
    picker.classList.add('is-open');
    dropdown.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    search.setAttribute('aria-expanded', 'true');
    search.value = '';
    filteredLanguages = [...codeLanguages];
    renderLanguages();
    requestAnimationFrame(() => search.focus());
  };

  trigger.addEventListener('click', () => {
    if (isDropdownOpen) closeDropdown();
    else openDropdown();
  });
  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (!isDropdownOpen) openDropdown();
    else updateActiveOption(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
  });
  search.addEventListener('input', () => {
    const keyword = search.value.trim().toLocaleLowerCase();
    filteredLanguages = codeLanguages.filter((item) => {
      return (
        item.label.toLocaleLowerCase().includes(keyword) ||
        item.value.toLocaleLowerCase().includes(keyword)
      );
    });
    renderLanguages();
  });
  search.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      updateActiveOption(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
      return;
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectLanguage(filteredLanguages[activeIndex].value);
      closeDropdown(true);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown(true);
    }
  });
  picker.addEventListener('focusout', () => {
    window.setTimeout(() => {
      if (!picker.contains(document.activeElement)) closeDropdown();
    });
  });

  toolsLeft.appendChild(picker);
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
    selectedLanguage = language;
    triggerLabel.textContent =
      codeLanguages.find((item) => item.value === language)?.label || language || '自动 / 纯文本';
    if (language) {
      pre.dataset.language = language;
      code.className = `language-${language}`;
    } else {
      delete pre.dataset.language;
      code.removeAttribute('class');
    }
    if (isDropdownOpen) renderLanguages();
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
