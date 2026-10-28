import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface PlaceholderOptions {
  /** 空正文时展示的提示文案 */
  text: string;
  /** 挂在空段落上的 class，样式由 styles.css 用 ::before 渲染 */
  emptyNodeClass: string;
}

// 轻量占位提示：仅当整篇文档只有一个空段落且编辑器可编辑时渲染，预览态不展示
export const Placeholder = Extension.create<PlaceholderOptions>({
  name: 'placeholder',

  addOptions() {
    return {
      text: '',
      emptyNodeClass: 'is-editor-empty',
    };
  },

  addProseMirrorPlugins() {
    const { text, emptyNodeClass } = this.options;
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey('placeholder'),
        props: {
          decorations: (state) => {
            if (!editor.isEditable || !text) return null;

            const { doc } = state;
            const firstChild = doc.firstChild;

            // 只处理新建的空笔记：单段落且没有文本内容
            const isEmptyDoc =
              doc.childCount === 1 &&
              !!firstChild &&
              firstChild.isTextblock &&
              firstChild.content.size === 0;

            if (!isEmptyDoc || !firstChild) return null;

            return DecorationSet.create(doc, [
              Decoration.node(0, firstChild.nodeSize, {
                class: emptyNodeClass,
                'data-placeholder': text,
              }),
            ]);
          },
        },
      }),
    ];
  },
});
