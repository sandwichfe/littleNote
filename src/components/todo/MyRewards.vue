<template>
  <div class="content-section">
    <div class="section-header">
      <h2 class="section-title">我的奖励</h2>
      <div class="section-actions">
        <el-tooltip content="刷新列表" placement="top">
          <el-button circle size="small" @click="$emit('refresh-rewards')">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
    
    <transition-group 
      name="reward-list" 
      tag="div" 
      class="my-rewards-list"
    >
      <div 
        v-for="reward in myRewards" 
        :key="reward.id"
        class="my-reward-item"
      >
        <div class="reward-card-content">
          
          <span class="reward-points">{{ reward.pointsCost }}积分</span>

            <div class="reward-header">
              <h3 class="reward-name">{{ reward.rewardName}}</h3>
            </div>

            <div class="reward-timeline">
                <el-tooltip :content="`${reward.obtainedDate}获得`" placement="top">
                    <span class="timeline-text">{{ reward.obtainedDate }}</span>
                </el-tooltip>
            </div>

          <div class="reward-action">
            <el-button 
              v-if="reward.status === 0"
              type="primary" 
              size="small"
              @click="$emit('use-reward', reward)"
              class="status-unused"
            >
              使用
            </el-button>
            <div v-else class="used-label status-used">
              <span class="timeline-text">已使用: {{ reward.usedDate }}</span>
            </div>
          </div>

        </div>
        
      </div>
    </transition-group>
    
    <div v-if="myRewards.length === 0" class="empty-state">
      <el-empty description="暂无奖励，快去兑换吧！">
        <el-button type="primary" @click="$emit('go-to-shop')">前往奖励商店</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { onMounted } from 'vue'
import type { UserReward } from '@/network/todo'

// Props
defineProps<{
  myRewards: UserReward[]
}>()

// Emits
defineEmits<{
  'use-reward': [reward: UserReward]
  'refresh-rewards': []
  'go-to-shop': []
}>()

// 组件挂载时添加动画效果
onMounted(() => {
  // 可以在这里添加额外的初始化逻辑
})
</script>

<style scoped>
.content-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: 300px;
  position: relative;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 16px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
  position: relative;
}

.section-actions {
  display: flex;
  gap: 8px;
}

/* 列表动画 */
.reward-list-enter-active,
.reward-list-leave-active {
  transition: all 0.5s ease;
}

.reward-list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.reward-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.reward-list-move {
  transition: transform 0.5s ease;
}

.my-rewards-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.my-reward-item {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  transform-origin: center;
  animation: fadeIn 0.5s ease-out forwards;
  will-change: transform; /* 优化动画性能 */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.my-reward-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
}

.my-reward-item:hover .reward-card-content {
  border-left-color: #85ce61; /* 悬停时改变左侧边框颜色 */
}

.reward-card-content {
  padding: 20px;
  padding-bottom: 50px; /* 为右下角按钮留出空间 */
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
  min-height: 100px; /* 减小卡片高度 */
  box-sizing: border-box; /* 确保边框不会影响整体宽度 */
}

.reward-card-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: transform 0.8s ease-in-out;
  z-index: 1;
  pointer-events: none; /* 确保不会干扰鼠标事件 */
}

.my-reward-item:hover .reward-card-content::before {
  transform: translateX(200%);
}

.reward-info {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 2;
  width: 100%;
}

.reward-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.reward-name {
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
  font-size: 18px;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s ease;
}

.my-reward-item:hover .reward-name {
  color: #67c23a;
}

/* 移除了 reward-meta 样式 */

.reward-points {
  color: #8e6ff7;
  font-weight: 600;
  font-size: 14px;
  position: absolute;
  top: 10px;
  right: 15px;
  z-index: 3;
}

.reward-status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.reward-status-badge:hover {
  transform: translateY(-2px);
}

.reward-status-badge.status-unused {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.reward-status-badge.status-used {
  background: #f0f2f5;
  color: #909399;
  border: 1px solid #e4e7ed;
}

.reward-status-badge.status-unknown {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.reward-timeline {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 12px;
  position: absolute;
  bottom: 15px;
  left: 20px; /* 增加左侧间距，与左侧边框保持一致 */
  z-index: 2;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  max-width: calc(100% - 120px); /* 避免与右下角按钮重叠 */
}

.timeline-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.timeline-item.used {
  background: rgba(129, 199, 132, 0.2);
}

.timeline-item.used:hover {
  background: rgba(129, 199, 132, 0.3);
}

.timeline-icon {
  color: #6c757d;
  font-size: 16px;
}

.timeline-item.used .timeline-icon {
  color: #2e7d32;
}

.timeline-text {
  font-size: 13px;
  color: #495057;
  font-weight: 500;
}

.reward-action {
  position: absolute;
  bottom: 15px;
  right: 15px;
  z-index: 2;
}

.used-label {
  text-align: center;
  padding: 6px 12px;
  color: #909399;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  background: #f0f2f5;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  cursor: default;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.used-label.status-used {
  background: #f0f2f5;
  color: #909399;
  border: 1px solid #e4e7ed;
}

.used-label:hover {
  color: #606266;
  background: #e9ecef;
}

.used-label .timeline-text {
  color: #909399;
}

.el-button {
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.el-button.status-unused {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.el-button.status-unused:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reward-card-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px;
    padding-top: 30px; /* 为右上角的积分留出空间 */
    padding-bottom: 60px; /* 为右下角的按钮留出空间 */
    border-left-width: 3px; /* 减小移动端左侧边框宽度 */
  }
  
  .reward-points {
    top: 8px;
    right: 10px;
  }
  
  .reward-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  /* 移除了 reward-meta 响应式样式 */
  
  .reward-name {
    white-space: normal;
    line-height: 1.3;
    margin-bottom: 8px;
  }
  
  .reward-info {
    padding-left: 3px; /* 移动端减小左侧内边距 */
  }
  
  .reward-timeline {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    bottom: 10px;
    left: 15px; /* 调整移动端左侧间距 */
  }
  
  .timeline-item {
    justify-content: flex-start;
    width: calc(100% - 120px); /* 避免与右下角按钮重叠 */
  }
  
  .reward-action {
    bottom: 10px;
    right: 10px;
    width: calc(100% - 20px);
  }
  
  .el-button, .used-label {
    width: 100%;
    justify-content: center;
    text-align: center;
    padding: 8px 12px;
  }
  
  .el-button .el-icon, .used-label .el-icon {
    margin-right: 4px;
  }
}

/* 平板响应式设计 */
@media (min-width: 769px) and (max-width: 1024px) {
  .reward-timeline {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .timeline-item {
    flex: 1;
    min-width: 120px;
  }
}
</style>