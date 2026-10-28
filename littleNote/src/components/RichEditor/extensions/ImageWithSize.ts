import type { NodeViewRenderer } from '@tiptap/core';
import Image from '@tiptap/extension-image';

import { resolveFileUrl } from '@/utils/oss';
import {
  DEFAULT_IMAGE_SCALE,
  imageToolbarOptions,
  MAX_IMAGE_SCALE_PERCENT,
  MIN_IMAGE_SCALE_PERCENT,
} from '../config';

// 允许填写的图片来源：外链、站内相对路径、oss:// 与内联图片
const EDITABLE_SRC = /^(https?:\/\/|\/|oss:\/\/|data:image\/)/i;

// 图片节点负责尺寸属性、预设缩放和拖拽缩放交互。
const normalizeImageWidth = (value: unknown) => {
  if (typeof value !== 'string') return null;

  const width = value.trim();
  if (!width) return null;
  if (/^\d+(\.\d+)?$/.test(width)) return `${width}px`;
  if (/^\d+(\.\d+)?(px|%|rem|em|vw|vh)$/i.test(width)) return width;

  return null;
};

const normalizeImageScale = (value: unknown) => {
  if (typeof value !== 'string') return null;

  const scale = value.trim();
  if (!scale) return null;
  if (/^\d+(\.\d+)?$/.test(scale)) return `${scale}%`;
  if (/^\d+(\.\d+)?%$/.test(scale)) return scale;

  return null;
};

const getImageNaturalWidth = (image: HTMLImageElement) =>
  image.naturalWidth || Number.parseFloat(image.getAttribute('width') || '') || image.offsetWidth;

const getImageScalePercent = (scale: string | null, image: HTMLImageElement, wrapper: HTMLElement) => {
  if (scale?.endsWith('%')) return Number.parseFloat(scale);

  const naturalWidth = getImageNaturalWidth(image);
  if (!naturalWidth) return Number.parseFloat(DEFAULT_IMAGE_SCALE);

  return Math.round((wrapper.offsetWidth / naturalWidth) * 100);
};

// 显式标注 NodeViewRenderer，返回的对象字面量才能拿到上下文类型（update 等回调参数不再隐式 any）
const createImageView: NodeViewRenderer = ({ node, view, getPos, editor }) => {
  let currentNode = node;
  let resizeFrame = 0;
  let pendingResizeScale: string | null = null;
  let cleanupResizeListeners: (() => void) | null = null;

  const wrapper = document.createElement('span');
  wrapper.className = 're-image-node';
  wrapper.contentEditable = 'false';

  const image = document.createElement('img');
  image.draggable = true;
  // 长笔记里图片多，可视区外不加载
  image.loading = 'lazy';
  image.decoding = 'async';

  const stage = document.createElement('span');
  stage.className = 're-image-stage';

  const controls = document.createElement('span');
  controls.className = 're-image-controls';

  const sizeLabel = document.createElement('span');
  sizeLabel.className = 're-image-size-label';
  sizeLabel.textContent = '尺寸';

  const sizeSelect = document.createElement('select');
  sizeSelect.className = 're-image-size-select';
  sizeSelect.title = '图片尺寸';
  imageToolbarOptions.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    sizeSelect.appendChild(option);
  });
  const customSizeOption = document.createElement('option');
  customSizeOption.hidden = true;
  sizeSelect.appendChild(customSizeOption);
  sizeSelect.addEventListener('change', () => {
    updateScale(sizeSelect.value);
    view.focus();
  });

  const keepControlsFromSelectingEditor = (event: MouseEvent | PointerEvent) => {
    if (sizeSelect.contains(event.target as globalThis.Node)) {
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  };
  controls.addEventListener('pointerdown', keepControlsFromSelectingEditor);
  controls.addEventListener('mousedown', keepControlsFromSelectingEditor);

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 're-image-control-btn';
  editButton.textContent = '编辑';
  editButton.title = '编辑图片地址和名称';

  controls.append(sizeLabel, sizeSelect, editButton);

  const handle = document.createElement('span');
  handle.className = 're-image-resize-handle';
  handle.title = '拖拽调整图片大小';
  stage.append(image, handle);

  const createEditField = (labelText: string, placeholder: string) => {
    const field = document.createElement('label');
    field.className = 're-image-edit-field';

    const label = document.createElement('span');
    label.className = 're-image-edit-label';
    label.textContent = labelText;

    const input = document.createElement('input');
    input.className = 're-image-edit-input';
    input.type = 'text';
    input.placeholder = placeholder;

    field.append(label, input);
    return { field, input };
  };

  const srcField = createEditField('地址', 'https://example.com/a.png');
  const nameField = createEditField('名称', '可选，作为图片描述');

  const editActions = document.createElement('div');
  editActions.className = 're-image-edit-actions';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 're-image-edit-btn';
  cancelButton.textContent = '取消';

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.className = 're-image-edit-btn primary';
  saveButton.textContent = '保存';

  editActions.append(cancelButton, saveButton);

  const editPanel = document.createElement('div');
  editPanel.className = 're-image-edit-panel';
  editPanel.append(srcField.field, nameField.field, editActions);

  wrapper.append(stage, controls, editPanel);

  editButton.addEventListener('click', () => openEdit());
  cancelButton.addEventListener('click', () => {
    closeEdit();
    view.focus();
  });
  saveButton.addEventListener('click', () => saveEdit());
  image.addEventListener('dblclick', (event) => {
    event.preventDefault();
    openEdit();
  });

  const bindEditInputKeys = (input: HTMLInputElement) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveEdit();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeEdit();
        view.focus();
      }
    });
    input.addEventListener('input', () => input.classList.remove('invalid'));
  };
  bindEditInputKeys(srcField.input);
  bindEditInputKeys(nameField.input);

  const updateScaleControls = (scale: string | null) => {
    const hasPresetScale = imageToolbarOptions.some((item) => item.value === scale);
    if (scale && hasPresetScale) {
      sizeSelect.value = scale;
      customSizeOption.value = '';
      customSizeOption.textContent = '';
    } else if (scale) {
      customSizeOption.value = scale;
      customSizeOption.textContent = scale;
      sizeSelect.value = scale;
    }
    sizeSelect.classList.toggle('has-custom-size', Boolean(scale && !hasPresetScale));
  };

  let srcToken = 0;

  // 节点 attrs 里存的是 objectKey（正文为站内相对路径），渲染时换成预签名地址，
  // 浏览器直连 OSS；地址只影响 DOM，getHTML() 落库的仍是 objectKey。
  const loadImage = (src: string, scale: string | null, width: string | null, allowRetry = true) => {
    if (!src) return;

    if (image.getAttribute('src') === src) {
      applyImageScale(scale, width);
      return;
    }

    image.onload = () => applyImageScale(scale, width);
    image.onerror = () => {
      if (!allowRetry) return;
      // 预签名地址可能刚好过期，强刷一次再重试
      void resolveFileUrl(currentNode.attrs.src, true).then((next) => {
        if (next && next !== src) loadImage(next, scale, width, false);
      });
    };
    image.src = src;
    applyImageScale(scale, width);
  };

  const updateImage = () => {
    const width = normalizeImageWidth(currentNode.attrs.width);
    const scale = normalizeImageScale(currentNode.attrs.scale) || normalizeImageScale(width) || DEFAULT_IMAGE_SCALE;
    image.alt = currentNode.attrs.alt || '';
    image.title = currentNode.attrs.title || '';
    updateScaleControls(scale);

    const token = ++srcToken;
    void resolveFileUrl(currentNode.attrs.src).then((url) => {
      if (token !== srcToken) return;
      loadImage(url, scale, width);
    });
  };

  function applyImageScale(scale: string | null, fallbackWidth?: string | null) {
    const normalizedScale = normalizeImageScale(scale) || DEFAULT_IMAGE_SCALE;
    const naturalWidth = getImageNaturalWidth(image);

    if (!naturalWidth) {
      if (fallbackWidth) wrapper.style.width = fallbackWidth;
      return;
    }

    const scalePercent = Number.parseFloat(normalizedScale);
    const width = `${Math.round((naturalWidth * scalePercent) / 100)}px`;
    wrapper.style.width = width;
    wrapper.dataset.scale = normalizedScale;
  }

  function previewScale(scale: string | null) {
    const normalizedScale = normalizeImageScale(scale) || DEFAULT_IMAGE_SCALE;

    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    pendingResizeScale = normalizedScale;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      applyImageScale(pendingResizeScale);
      updateScaleControls(pendingResizeScale);
      wrapper.dataset.resizeLabel = pendingResizeScale || '';
    });
  }

  function updateAttributes(attributes: Record<string, unknown>) {
    const pos = getPos();
    if (typeof pos !== 'number') return;

    const current = view.state.doc.nodeAt(pos);
    if (!current) return;

    view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...current.attrs, ...attributes }));
  }

  function updateScale(scale: string | null) {
    updateAttributes({
      scale: normalizeImageScale(scale) || DEFAULT_IMAGE_SCALE,
      width: null,
    });
  }

  // 面板默认贴在图片下方，再按编辑区可视范围做左右夹取、必要时翻到图片上方，
  // 否则窄图或靠边的图会把面板顶出滚动容器被裁掉。
  function positionEditPanel() {
    const host = wrapper.closest('.re-content') as HTMLElement | null;
    const hostRect = (host || document.documentElement).getBoundingClientRect();
    const margin = 8;

    editPanel.style.left = '0px';
    editPanel.style.top = 'calc(100% + 8px)';
    editPanel.style.bottom = '';
    editPanel.style.width = `${Math.min(272, Math.max(hostRect.width - margin * 2, 160))}px`;

    const panelRect = editPanel.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();

    let left = 0;
    const overflowRight = panelRect.right - (hostRect.right - margin);
    if (overflowRight > 0) left -= overflowRight;

    const overflowLeft = hostRect.left + margin - (wrapperRect.left + left);
    if (overflowLeft > 0) left += overflowLeft;

    editPanel.style.left = `${left}px`;

    if (panelRect.bottom > hostRect.bottom - margin) {
      editPanel.style.top = 'auto';
      editPanel.style.bottom = 'calc(100% + 8px)';
    }
  }

  // 编辑面板里显示的是节点 attrs 里的稳定地址，不是 DOM 上的预签名地址，
  // 否则保存后会把会过期的签名写进正文。
  function openEdit() {
    if (!editor.isEditable) return;

    srcField.input.value = typeof currentNode.attrs.src === 'string' ? currentNode.attrs.src : '';
    nameField.input.value = currentNode.attrs.alt || currentNode.attrs.title || '';
    srcField.input.classList.remove('invalid');

    wrapper.classList.add('editing');
    positionEditPanel();
    requestAnimationFrame(() => {
      srcField.input.focus();
      srcField.input.select();
    });
  }

  function closeEdit() {
    wrapper.classList.remove('editing');
    srcField.input.classList.remove('invalid');
  }

  function saveEdit() {
    const src = srcField.input.value.trim();
    if (!src || !EDITABLE_SRC.test(src)) {
      srcField.input.classList.add('invalid');
      srcField.input.focus();
      return;
    }

    const name = nameField.input.value.trim();
    updateAttributes({ src, alt: name || null, title: name || null });
    closeEdit();
    view.focus();
  }

  handle.addEventListener('pointerdown', (event) => {
    if (!editor.isEditable) return;

    event.preventDefault();
    event.stopPropagation();
    handle.setPointerCapture?.(event.pointerId);
    wrapper.classList.add('resizing');

    const startX = event.clientX;
    const naturalWidth = getImageNaturalWidth(image) || 1;
    const startPercent =
      getImageScalePercent(normalizeImageScale(currentNode.attrs.scale), image, wrapper) ||
      Number.parseFloat(DEFAULT_IMAGE_SCALE);
    let lastPercent = startPercent;
    let finalPercent = startPercent;
    wrapper.dataset.resizeLabel = `${startPercent}%`;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaPercent = ((moveEvent.clientX - startX) / naturalWidth) * 100;
      const nextPercent = Math.max(
        MIN_IMAGE_SCALE_PERCENT,
        Math.min(MAX_IMAGE_SCALE_PERCENT, Math.round(startPercent + deltaPercent))
      );

      if (nextPercent === lastPercent) return;
      lastPercent = nextPercent;
      finalPercent = nextPercent;
      previewScale(`${nextPercent}%`);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      cleanupResizeListeners?.();
      cleanupResizeListeners = null;
      handle.releasePointerCapture?.(upEvent.pointerId);
      wrapper.classList.remove('resizing');
      delete wrapper.dataset.resizeLabel;
      if (resizeFrame) {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = 0;
      }
      if (finalPercent !== startPercent) {
        updateScale(`${finalPercent}%`);
      }
      view.focus();
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    cleanupResizeListeners = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  });

  updateImage();

  return {
    dom: wrapper,
    update: (updatedNode) => {
      if (updatedNode.type !== currentNode.type) return false;
      currentNode = updatedNode;
      updateImage();
      return true;
    },
    selectNode: () => wrapper.classList.add('selected'),
    deselectNode: () => {
      wrapper.classList.remove('selected');
      closeEdit();
    },
    stopEvent: (event: Event) =>
      controls.contains(event.target as globalThis.Node) ||
      handle.contains(event.target as globalThis.Node) ||
      editPanel.contains(event.target as globalThis.Node),
    ignoreMutation: () => true,
    destroy: () => {
      srcToken += 1;
      cleanupResizeListeners?.();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
    },
  };
};

export const ImageWithSize = Image.extend({
  addAttributes() {
    const parentAttributes = this.parent?.() ?? {};

    return {
      ...parentAttributes,
      width: {
        default: null,
        parseHTML: (element) =>
          normalizeImageWidth(element.style.width || element.getAttribute('width')),
        renderHTML: (attributes) => {
          if (normalizeImageScale(attributes.scale)) return {};

          const width = normalizeImageWidth(attributes.width);
          if (!width) return {};

          return {
            'data-width': width,
            style: `width: ${width};`,
          };
        },
      },
      scale: {
        default: null,
        parseHTML: (element) =>
          normalizeImageScale(element.getAttribute('data-scale')) ||
          normalizeImageScale(element.getAttribute('scale')),
        renderHTML: (attributes) => {
          const scale = normalizeImageScale(attributes.scale) || DEFAULT_IMAGE_SCALE;

          return {
            'data-scale': scale,
          };
        },
      },
    };
  },
  addNodeView() {
    return createImageView;
  },
});
