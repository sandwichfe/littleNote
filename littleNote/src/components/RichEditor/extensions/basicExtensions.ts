import ListItem from '@tiptap/extension-list-item';
import Table from '@tiptap/extension-table';
import { columnResizing, tableEditing } from '@tiptap/pm/tables';

// 列表项允许保留标题块，表格扩展沿用可调整列宽的原有行为。
export const ListItemWithHeading = ListItem.extend({
  content: '(paragraph | heading) block*',
});

export const TableWithResizableColumns = Table.extend({
  addProseMirrorPlugins() {
    return [
      ...(this.options.resizable
        ? [
            columnResizing({
              handleWidth: this.options.handleWidth,
              cellMinWidth: this.options.cellMinWidth,
              defaultCellMinWidth: this.options.cellMinWidth,
              View: this.options.View,
              lastColumnResizable: this.options.lastColumnResizable,
            }),
          ]
        : []),
      tableEditing({
        allowTableNodeSelection: this.options.allowTableNodeSelection,
      }),
    ];
  },
});
