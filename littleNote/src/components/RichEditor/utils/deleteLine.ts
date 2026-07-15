import type { ResolvedPos } from '@tiptap/pm/model';
import type { EditorState } from '@tiptap/pm/state';

// 计算当前选区对应的完整块范围，供“删除当前行”复用。
type DeleteLineRange = {
  from: number;
  to: number;
  parentListFrom?: number;
  parentListTo?: number;
  parentListContentFrom?: number;
  parentListContentTo?: number;
};

const getDeleteLineRange = ($pos: ResolvedPos): DeleteLineRange | null => {
  let blockDepth = 0;

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);

    if (node.type.name === 'listItem') {
      const parentListDepth = depth - 1;
      const parentList = $pos.node(parentListDepth);
      const parentListFrom = $pos.before(parentListDepth);
      const parentListTo = $pos.after(parentListDepth);

      if (parentList.childCount === 1) {
        return { from: parentListFrom, to: parentListTo };
      }

      return {
        from: $pos.before(depth),
        to: $pos.after(depth),
        parentListFrom,
        parentListTo,
        parentListContentFrom: parentListFrom + 1,
        parentListContentTo: parentListTo - 1,
      };
    }

    if (node.isTextblock && !blockDepth) {
      blockDepth = depth;
    }
  }

  if (!blockDepth) return null;

  return {
    from: $pos.before(blockDepth),
    to: $pos.after(blockDepth),
  };
};

const expandFullListRange = (range: DeleteLineRange, itemRange: DeleteLineRange | null) => {
  if (
    itemRange?.parentListFrom === undefined ||
    itemRange.parentListTo === undefined ||
    itemRange.parentListContentFrom === undefined ||
    itemRange.parentListContentTo === undefined
  ) {
    return range;
  }

  if (range.from <= itemRange.parentListContentFrom && range.to >= itemRange.parentListContentTo) {
    return {
      from: Math.min(range.from, itemRange.parentListFrom),
      to: Math.max(range.to, itemRange.parentListTo),
    };
  }

  return range;
};

export const getSelectionDeleteLineRange = (state: EditorState) => {
  const { selection } = state;
  const selectionEnd = selection.empty ? selection.to : Math.max(selection.from, selection.to - 1);
  const fromRange = getDeleteLineRange(state.doc.resolve(selection.from));
  const toRange = getDeleteLineRange(state.doc.resolve(selectionEnd));

  if (!fromRange || !toRange) return null;

  let range = {
    from: Math.min(fromRange.from, toRange.from),
    to: Math.max(fromRange.to, toRange.to),
  };

  range = expandFullListRange(range, fromRange);
  range = expandFullListRange(range, toRange);

  return range;
};
