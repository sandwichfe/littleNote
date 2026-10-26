import { Node, mergeAttributes } from '@tiptap/core';

import { resolveFileUrl } from '@/utils/oss';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string }) => ReturnType;
    };
  }
}

export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'video[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, { controls: 'controls' }),
    ];
  },

  // attrs 里存的是 objectKey，播放前换成预签名地址，浏览器直连 OSS。
  addNodeView() {
    return ({ node }) => {
      let currentNode = node;
      let token = 0;
      const video = document.createElement('video');
      video.controls = true;
      video.setAttribute('controls', 'controls');

      const apply = (allowRetry = true) => {
        const current = ++token;
        void resolveFileUrl(currentNode.attrs.src).then((src) => {
          if (current !== token || !src || video.getAttribute('src') === src) return;

          video.onerror = () => {
            if (!allowRetry) return;
            void resolveFileUrl(currentNode.attrs.src, true).then((next) => {
              if (current !== token || !next || next === src) return;
              video.onerror = null;
              video.src = next;
            });
          };
          video.src = src;
        });
      };

      apply();

      return {
        dom: video,
        update: (updatedNode) => {
          if (updatedNode.type !== currentNode.type) return false;
          const srcChanged = updatedNode.attrs.src !== currentNode.attrs.src;
          currentNode = updatedNode;
          if (srcChanged) apply();
          return true;
        },
        ignoreMutation: () => true,
        destroy: () => {
          token += 1;
        },
      };
    };
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    };
  },
});

export default Video;
