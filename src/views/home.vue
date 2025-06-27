<template>
  <div class="home-container">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="decoration-circle decoration-circle-1"></div>
      <div class="decoration-circle decoration-circle-2"></div>
      <div class="decoration-circle decoration-circle-3"></div>
      <div class="welcome-content">
        <div class="logo-container">
          <svg-icon icon-class="app-icon" class="app-logo" />
        </div>
        <h1 class="welcome-title">欢迎使用 <span class="highlight">LittleNote</span></h1>
        <p class="welcome-subtitle">简单、高效的笔记管理系统</p>
        <div class="action-buttons">
          <el-button type="default" size="large" @click="navigateTo('/note')" class="action-button">
            <el-icon class="el-icon--left"><svg-icon icon-class="list-icon" /></el-icon> 开始记录
          </el-button>
        </div>
      </div>
    </div>

    <!-- 功能卡片区域 -->
    <div class="features-section">
      <h2 class="section-title">系统功能</h2>
      <div class="feature-cards">
        <div class="feature-card" v-for="(feature, index) in features" :key="index" @click="navigateTo(feature.path)">
          <div class="feature-icon">
            <el-icon><svg-icon :icon-class="feature.icon" /></el-icon>
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>

    <!-- 统计信息区域 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-value">{{ stats.notes }}</div>
        <div class="stat-label">笔记总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.groups }}</div>
        <div class="stat-label">分组总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.users }}</div>
        <div class="stat-label">用户总数</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 功能卡片数据
const features = ref([
  {
    title: '笔记管理',
    description: '创建、编辑和管理您的个人笔记，支持富文本编辑和标签分类',
    icon: 'list-icon',
    path: '/note'
  },
  {
    title: '系统管理',
    description: '管理系统用户和权限，控制访问级别和数据安全',
    icon: 'search',
    path: '/user'
  },
]);

// 统计数据
const stats = ref({
  notes: '500+',
  groups: '50+',
  users: '100+'
});

// 导航方法
const navigateTo = (path) => {
  router.push(path);
};

// 页面加载动画
onMounted(() => {
  // 添加页面加载时的动画效果
  const welcomeSection = document.querySelector('.welcome-section');
  const featureCards = document.querySelectorAll('.feature-card');
  const statCards = document.querySelectorAll('.stat-card');
  
  // 欢迎区域动画
  if (welcomeSection) {
    welcomeSection.classList.add('animate-in');
  }
  
  // 功能卡片动画
  featureCards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('animate-in');
    }, 300 + 100 * index);
  });
  
  // 统计卡片动画
  statCards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('animate-in');
    }, 800 + 100 * index);
  });
});
</script>

<style scoped>
.home-container {
  padding: 20px 0;
  width: 100%;
  margin: 0;
  animation: fadeIn 0.8s ease-out;
  overflow: hidden;
  background-color: #f8f9fa;
  min-height: calc(100vh - 40px); /* 减去padding的高度 */
  display: flex;
  flex-direction: column;
}

/* 欢迎区域样式 */
.welcome-section {
  background: linear-gradient(120deg, #f8f9fa 0%, #e9f5ff 35%, #f0f7ff 65%, #e6f7f2 100%);
  border-radius: 0;
  padding: 80px 40px;
  margin-bottom: 50px;
  color: #2c3e50;
  position: relative;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.05);
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease-out;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: none;
  flex: 1;
}

.welcome-section.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 200%;
  background: radial-gradient(circle, rgba(65, 184, 131, 0.05) 0%, rgba(65, 184, 131, 0) 70%);
  transform: rotate(-30deg);
  animation: shimmer 8s infinite linear;
}

.welcome-section::after {
  content: '';
  position: absolute;
  bottom: -30px;
  left: 30%;
  width: 100px;
  height: 100px;
  background: rgba(65, 184, 131, 0.05);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite reverse;
}

.welcome-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 1200px;
  padding: 0 5%;
}

.logo-container {
  margin-bottom: 30px;
  position: relative;
}

.logo-container::after {
  content: '';
  position: absolute;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(65, 184, 131, 0.1) 0%, rgba(65, 184, 131, 0) 70%);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -1;
}

.app-logo {
  width: 100px;
  height: 100px;
  animation: pulse 2s infinite ease-in-out, rotate 15s linear infinite;
  color: #41b883;
  font-size: 100px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.welcome-title {
  font-size: 3.2rem;
  font-weight: 800;
  margin-bottom: 20px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.1);
  letter-spacing: -0.5px;
  color: #2c3e50;
}

.highlight {
  position: relative;
  background: linear-gradient(90deg, #41b883, #34495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.highlight::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #41b883;
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 0.5s ease-out;
  animation: underline 1.5s forwards 0.5s;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
  width: 100%;
  max-width: 400px;
}

.action-buttons .el-button+.el-button {
  margin-left: 0;
}

.action-button {
  width: 100%;
  min-width: 180px;
  height: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 8px;
  background-color: #41b883;
  color: #ffffff;
  border: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
}

.action-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(65, 184, 131, 0.25);
  background-color: #3ca876;
}


/* 功能卡片区域样式 */
.features-section {
  margin-bottom: 40px;
  padding: 0 5%;
  max-width: 1600px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 30px;
  text-align: center;
  color: #34495e;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background-color: #41b883;
  border-radius: 3px;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
}

.feature-card {
  background-color: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.04);
  transition: all 0.4s ease;
  cursor: pointer;
  opacity: 0;
  transform: translateY(20px);
  border: 1px solid #f0f0f0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.feature-card.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  border-color: #41b883;
  background-color: rgba(65, 184, 131, 0.03);
}

.feature-card:hover .feature-icon {
  animation: pulse 1s infinite ease-in-out;
  background-color: rgba(65, 184, 131, 0.2);
}

.feature-card:hover .feature-title {
  color: #41b883;
}

.feature-icon {
  width: 70px;
  height: 70px;
  background-color: rgba(65, 184, 131, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 25px;
  position: relative;
  overflow: hidden;
}

.feature-icon::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%);
  top: 0;
  left: 0;
}

.feature-icon .el-icon {
  font-size: 30px;
  color: #41b883;
}

.feature-icon svg {
  width: 30px;
  height: 30px;
  color: #41b883;
}

.feature-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #34495e;
}

.feature-description {
  color: #606266;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* 统计信息区域样式 */
.stats-section {
  display: flex;
  justify-content: space-around;
  margin-top: 50px;
  margin-bottom: 50px;
  padding: 40px 5%;
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
  border-radius: 0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  width: 100%;
  max-width: 100%;
}

.stat-card {
  text-align: center;
  padding: 20px;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
}

.stat-card.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.stat-card:hover {
  transform: translateY(-5px);
  background-color: white;
  box-shadow: 0 10px 20px rgba(65, 184, 131, 0.1);
  border-radius: 10px;
}

.stat-card:hover .stat-value {
  animation: pulse 1s infinite ease-in-out;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #41b883;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 1rem;
  color: #606266;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes shimmer {
  0% { transform: rotate(-30deg) translateY(0); }
  100% { transform: rotate(-30deg) translateY(50%); }
}

@keyframes underline {
  to { transform: scaleX(1); transform-origin: bottom left; }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 装饰元素 */
.decoration-circle {
  position: absolute;
  border-radius: 50%;
  z-index: 0;
}

.decoration-circle-1 {
  width: 350px;
  height: 350px;
  top: -120px;
  right: 2%;
  animation: float 12s ease-in-out infinite;
  background: radial-gradient(circle, rgba(65, 184, 131, 0.1) 0%, rgba(65, 184, 131, 0) 70%);
}

.decoration-circle-2 {
  width: 280px;
  height: 280px;
  bottom: -80px;
  left: 5%;
  animation: float 8s ease-in-out infinite reverse;
  background: radial-gradient(circle, rgba(52, 73, 94, 0.08) 0%, rgba(52, 73, 94, 0) 70%);
}

.decoration-circle-3 {
  width: 180px;
  height: 180px;
  top: 25%;
  left: 2%;
  animation: float 6s ease-in-out infinite;
  background: radial-gradient(circle, rgba(65, 184, 131, 0.05) 0%, rgba(65, 184, 131, 0) 70%);
}

/* 添加欢迎副标题 */
.welcome-subtitle {
  font-size: 1.4rem;
  font-weight: 400;
  margin-bottom: 30px;
  opacity: 0.7;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  color: #5a6a7a;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-container {
    padding: 10px 0;
    width: 100%;
  }

  .welcome-section {
    padding: 50px 15px;
    min-height: 300px;
  }
  
  .welcome-title {
    font-size: 2.2rem;
  }
  
  .welcome-subtitle {
    font-size: 1.2rem;
    margin-bottom: 25px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 15px;
    max-width: 100%;
  }
  
  .stats-section {
    flex-direction: column;
    gap: 20px;
    padding: 25px 15px;
  }
  
  .stat-card {
    padding: 15px;
    width: 100%;
  }
  
  .feature-cards {
    grid-template-columns: 1fr;
  }
  
  .app-logo {
    width: 80px;
    height: 80px;
    font-size: 80px;
  }
}
</style>