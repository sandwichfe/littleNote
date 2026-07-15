import type { NodeViewRendererProps } from '@tiptap/core';
import Image from '@tiptap/extension-image';

import {
  DEFAULT_IMAGE_SCALE,
  imageToolbarOptions,
  MAX_IMAGE_SCALE_PERCENT,
  MIN_IMAGE_SCALE_PERCENT,
} from '../config';

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

const createImageView = ({ node, view, getPos, editor }: NodeViewRendererProps) => {
  let currentNode = node;
  let resizeFrame = 0;
  let pendingResizeScale: string | null = null;
  let cleanupResizeListeners: (() => void) | null = null;

  const wrapper = document.createElement('span');
  wrapper.className = 're-image-node';
  wrapper.contentEditable = 'false';

  const image = document.createElement('img');
  image.draggable = true;

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

  controls.append(sizeLabel, sizeSelect);

  const handle = document.createElement('span');
  handle.className = 're-image-resize-handle';
  handle.title = '拖拽调整图片大小';
  stage.append(image, handle);
  wrapper.append(stage, controls);

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

  const updateImage = () => {
    const width = normalizeImageWidth(currentNode.attrs.width);
    const scale = normalizeImageScale(currentNode.attrs.scale) || normalizeImageScale(width) || DEFAULT_IMAGE_SCALE;
    image.src = currentNode.attrs.src;
    image.alt = currentNode.attrs.alt || '';
    image.title = currentNode.attrs.title || '';
    image.onload = () => applyImageScale(scale, width);
    applyImageScale(scale, width);
    updateScaleControls(scale);
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

  function updateScale(scale: string | null) {
    const pos = getPos();
    if (typeof pos !== 'number') return;

    const normalizedScale = normalizeImageScale(scale) || DEFAULT_IMAGE_SCALE;
    const current = view.state.doc.nodeAt(pos);
    if (!current) return;

    view.dispatch(
      view.state.tr.setNodeMarkup(pos, undefined, {
        ...current.attrs,
        scale: normalizedScale,
        width: null,
      })
    );
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
    deselectNode: () => wrapper.classList.remove('selected'),
    stopEvent: (event: Event) =>
      controls.contains(event.target as globalThis.Node) ||
      handle.contains(event.target as globalThis.Node),
    ignoreMutation: () => true,
    destroy: () => {
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
