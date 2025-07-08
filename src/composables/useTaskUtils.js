/**
 * 任务工具函数组合式函数
 * 提供任务相关的通用工具方法
 */
export function useTaskUtils() {
  // 获取任务类型颜色
  const getTaskTypeColor = (type) => {
    switch (type) {
      case 'work':
        return 'primary'
      case 'study':
        return 'success'
      case 'health':
        return 'warning'
      default:
        return 'info'
    }
  }

  // 获取任务类型标签
  const getTaskTypeLabel = (type) => {
    switch (type) {
      case 'work':
        return '工作任务'
      case 'study':
        return '学习计划'
      case 'health':
        return '健康习惯'
      default:
        return '其他'
    }
  }

  // 格式化日期
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  // 获取当前日期字符串
  const getCurrentDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
    return `${year}年${month}月${day}日 ${weekDay}`
  }

  return {
    getTaskTypeColor,
    getTaskTypeLabel,
    formatDate,
    getCurrentDateString
  }
}