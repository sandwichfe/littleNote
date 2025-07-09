<template>
  <div class="content-section">
    <div class="section-header">
      <h2 class="section-title">奖励超市</h2>
      <el-button 
        type="primary" 
        @click="$emit('show-add-reward')"
      >
        <el-icon><Plus /></el-icon>
        创建奖励
      </el-button>
    </div>
    
    <div class="rewards-grid">
      <div 
        v-for="reward in rewardsList" 
        :key="reward.id"
        class="reward-card"
      >
        <div class="reward-info">
          <h3 class="reward-name">{{ reward.name }}</h3>
          <p class="reward-desc">{{ reward.description }}</p>
        </div>
        <div class="reward-action">
          <span class="reward-points">{{ reward.points }}积分</span>
          <el-button 
            type="primary" 
            size="small"
            :disabled="userPoints < reward.points"
            @click="$emit('exchange-reward', reward)"
          >
            兑换
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import type { Reward } from '@/network/todo'

// Props
defineProps<{
  rewardsList: Reward[]
  userPoints: number
}>()

// Emits
defineEmits<{
  'show-add-reward': []
  'exchange-reward': [reward: Reward]
}>()
</script>

<style scoped>
.content-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.reward-card {
  padding: 20px;
  background: #fce4ec;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reward-info h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-weight: 600;
}

.reward-desc {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.reward-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.reward-points {
  color: #8e6ff7;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rewards-grid {
    grid-template-columns: 1fr;
  }
}
</style>