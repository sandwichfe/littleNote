type TreeNode = {
  id?: number | string
  name?: string
  title?: string
  roleName?: string
  children?: TreeNode[]
}

export const formatDateTime = (value?: string | number | Date | null) => {
  if (!value) {
    return '--'
  }

  const parsed = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(parsed)
}

export const countTreeNodes = (nodes: TreeNode[] = []) => (
  nodes.reduce((total, node) => total + 1 + countTreeNodes(node.children || []), 0)
)

export const findTreeNodeById = (
  nodes: TreeNode[] = [],
  targetId?: number | string | null
): TreeNode | null => {
  if (targetId === null || typeof targetId === 'undefined') {
    return null
  }

  for (const node of nodes) {
    if (node.id === targetId) {
      return node
    }

    const childHit = findTreeNodeById(node.children || [], targetId)

    if (childHit) {
      return childHit
    }
  }

  return null
}

export const getInitial = (value?: string | null) => {
  const normalized = String(value || '').trim()
  return normalized ? normalized.slice(0, 1).toUpperCase() : '·'
}
