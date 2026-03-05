<template>
  <nav class="todo-sidebar">
    <div class="sidebar-header">
      <div class="weather-card">
        <div class="weather-top">
          <div class="weather-temp">26°</div>
          <div class="weather-info">
            <div class="weather-status">晴 · 适合专注</div>
            <div class="weather-date">
              {{ todayLabel }} · {{ weekdayLabel }}
            </div>
          </div>
        </div>
        <div class="weather-bottom">
          <span class="weather-city">今日 · 小记</span>
          <span class="weather-tip">保持一点点进步就很好</span>
        </div>
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

defineProps({
  userPoints: {
    type: Number,
    default: 0
  },
  activeNav: {
    type: String,
    required: true
  }
})

defineEmits(['nav-change'])

const navItems = [
  { key: 'daily', label: '每日待办', icon: Calendar },
  { key: 'todoList', label: '待办列表', icon: List },
  { key: 'taskViews', label: '任务视图', icon: Clock }
]

const today = new Date()
const todayLabel = `${today.getMonth() + 1}月${today.getDate()}日`
const weekdayMap = ['日', '一', '二', '三', '四', '五', '六']
const weekdayLabel = `周${weekdayMap[today.getDay()]}`
</script>

<style scoped>
.todo-sidebar {
  width: 260px;
  background: linear-gradient(180deg, #f9fbff 0%, #e7f2ff 45%, #f6f7ff 100%);
  box-shadow: 4px 0 18px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(148, 163, 184, 0.12);
}

.sidebar-header {
  padding: 22px 22px 6px;
}

.weather-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(241, 245, 255, 0.7) 45%,
    rgba(231, 242, 255, 0.9) 100%
  );
  border-radius: 18px;
  padding: 16px 18px 14px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.weather-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.weather-temp {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #1e293b;
}

.weather-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.weather-status {
  font-size: 14px;
  font-weight: 600;
  color: #4f46e5;
}

.weather-date {
  font-size: 12px;
  color: #6b7280;
}

.weather-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.weather-city {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #111827;
}

.weather-tip {
  font-size: 12px;
  color: #4b5563;
}

.nav-menu {
  flex: 1;
  padding: 14px 14px 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 11px 14px;
  margin-bottom: 8px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.22s ease;
  color: #6b7280;
  background: transparent;
}

.nav-item:hover {
  background: rgba(129, 140, 248, 0.07);
  color: #4f46e5;
  box-shadow: 0 10px 28px rgba(129, 140, 248, 0.3);
}

.nav-item.active {
  background: linear-gradient(135deg, #8e6ff7, #4f46e5);
  color: #ffffff;
  box-shadow: 0 14px 32px rgba(79, 70, 229, 0.55);
}

.nav-icon {
  margin-right: 12px;
  font-size: 18px;
}

.nav-label {
  font-weight: 500;
}

.points-display {
  padding: 16px 20px 18px;
  margin: 6px 16px 20px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 14px 40px rgba(148, 163, 184, 0.3);
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.points-icon {
  color: #fbbf24;
  font-size: 18px;
}

.points-text {
  font-weight: 600;
  color: #111827;
}

@media (max-width: 768px) {
  .todo-sidebar {
    width: 100%;
    height: auto;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  }

  .sidebar-header {
    padding: 16px 16px 4px;
  }

  .points-display {
    margin: 10px 14px 18px;
  }
}
</style>
