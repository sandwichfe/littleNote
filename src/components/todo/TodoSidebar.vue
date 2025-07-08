<template>
  <nav class="todo-sidebar">
    <div class="sidebar-header">
      <div class="user-avatar">
        <el-avatar :size="40" :src="userInfo.avatar" />
      </div>
      <div class="user-info">
        <div class="username">{{ userInfo.nickname }}</div>
        <div class="user-role">{{ userInfo.role }}</div>
      </div>
    </div>
    
    <div class="nav-menu">
      <div 
        v-for="item in navItems" 
        :key="item.key"
        class="nav-item"
        :class="{ active: activeNav === item.key }"
        @click="$emit('nav-change', item.key)"
      >
        <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
        <span class="nav-label">{{ item.label }}</span>
      </div>
    </div>
    
    <div class="points-display">
      <el-icon class="points-icon"><Star /></el-icon>
      <span class="points-text">积分: {{ userPoints }}</span>
    </div>
  </nav>
</template>

<script setup>
import { 
  Calendar, 
  Trophy, 
  Present, 
  Star, 
  Clock,
  List
} from '@element-plus/icons-vue'

// Props
defineProps({
  userInfo: {
    type: Object,
    required: true
  },
  userPoints: {
    type: Number,
    default: 0
  },
  activeNav: {
    type: String,
    required: true
  }
})

// Emits
defineEmits(['nav-change'])

// 导航菜单项
const navItems = [
  { key: 'daily', label: '每日待办', icon: Calendar },
  { key: 'todoList', label: '待办列表', icon: List },
  { key: 'rewards', label: '奖励超市', icon: Present },
  { key: 'myRewards', label: '我的奖励', icon: Trophy },
  { key: 'taskViews', label: '任务视图', icon: Clock }
]
</script>

<style scoped>
.todo-sidebar {
  width: 260px;
  background: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.user-avatar {
  margin-bottom: 12px;
}

.user-info {
  text-align: center;
}

.username {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.user-role {
  font-size: 14px;
  color: #666;
}

.nav-menu {
  flex: 1;
  padding: 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.nav-item:hover {
  background: #fce4ec;
  color: #8e6ff7;
}

.nav-item.active {
  background: #8e6ff7;
  color: white;
}

.nav-icon {
  margin-right: 12px;
  font-size: 18px;
}

.nav-label {
  font-weight: 500;
}

.points-display {
  padding: 16px 24px;
  background: #fce4ec;
  margin: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.points-icon {
  color: #ffc107;
  font-size: 18px;
}

.points-text {
  font-weight: 600;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .todo-sidebar {
    width: 100%;
    height: auto;
  }
}
</style>