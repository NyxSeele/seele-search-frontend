<template>
  <Transition name="loading-fade">
    <div v-if="isLoading" class="loading-page">
      <div class="loading-background"></div>
      <div class="loading-content">
        <div class="loading-animation">
          <img src="/static/icons/loading.gif" alt="加载中" class="loading-gif" />
        </div>
        <div class="loading-text">加载中</div>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
          <div class="progress-text">{{ Math.round(progress) }}%</div>
        </div>
      </div>
      <Footer />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Footer from '@/components/Footer.vue'

const props = defineProps<{
  isLoading: boolean
}>()

// 当加载完成时，防止body滚动
watch(() => props.isLoading, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
  } else {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
    document.body.style.height = ''
  }
}, { immediate: true })

const progress = ref(0)
let progressInterval: number | null = null

// 计算加载进度
const calculateProgress = () => {
  // 检查页面资源加载状态
  if (document.readyState === 'complete') {
    // 页面已完全加载，检查关键资源
    const images = document.querySelectorAll('img')
    const totalImages = images.length
    let loadedImages = 0
    
    images.forEach((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        loadedImages++
      }
    })
    
    // 基础进度：页面加载完成 50%
    // 图片加载进度：50%
    const baseProgress = 50
    const imageProgress = totalImages > 0 ? (loadedImages / totalImages) * 50 : 50
    return Math.min(100, baseProgress + imageProgress)
  } else if (document.readyState === 'interactive') {
    // DOM 已加载，但资源可能还在加载
    return 40
  } else if (document.readyState === 'loading') {
    // 正在加载
    return 20
  }
  return 10
}

// 更新进度
const updateProgress = () => {
  const currentProgress = calculateProgress()
  
  // 平滑过渡到目标进度
  if (currentProgress > progress.value) {
    progress.value = Math.min(100, progress.value + Math.max(1, (currentProgress - progress.value) * 0.3))
  }
  
  // 如果页面已完全加载且进度接近100%，快速完成
  if (document.readyState === 'complete' && progress.value < 95) {
    progress.value = Math.min(100, progress.value + 5)
  }
}

onMounted(() => {
  // 初始进度
  progress.value = 0
  
  // 监听页面加载事件
  const handleLoad = () => {
    // 确保进度达到100%
    progress.value = 100
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
  }
  
  // 如果页面已经加载完成
  if (document.readyState === 'complete') {
    progress.value = 90
    setTimeout(() => {
      progress.value = 100
    }, 300)
  } else {
    window.addEventListener('load', handleLoad, { once: true })
    
    // 定期更新进度
    progressInterval = window.setInterval(() => {
      updateProgress()
      if (progress.value >= 99) {
        progress.value = 100
        if (progressInterval) {
          clearInterval(progressInterval)
          progressInterval = null
        }
      }
    }, 150) as unknown as number
  }
  
  // 快速提升初始进度，模拟加载过程
  setTimeout(() => {
    if (progress.value < 15) progress.value = 15
  }, 100)
  
  setTimeout(() => {
    if (progress.value < 30) progress.value = 30
  }, 300)
  
  setTimeout(() => {
    if (progress.value < 50) progress.value = 50
  }, 600)
  
  setTimeout(() => {
    if (progress.value < 70) progress.value = 70
  }, 1200)
})

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
})
</script>

<style scoped>
.loading-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* 防止滚动 */
  touch-action: none;
  -webkit-overflow-scrolling: none;
}

/* 当加载页面显示时，防止body滚动 */
body:has(.loading-page) {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}

.loading-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/static/images/background2.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.loading-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  width: auto;
  padding: 0;
}

.loading-animation {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
}

.loading-gif {
  width: 180px;
  height: auto;
  object-fit: contain;
}

.loading-text {
  font-size: 2rem;
  font-weight: bold;
  color: #228B22;
  letter-spacing: 0.1em;
}

.loading-progress {
  width: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.progress-bar {
  width: 100%;
  height: 40px;
  background-image: url('/static/icons/long banner.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(6, 147, 95, 0.9) 0%,
    rgba(25, 183, 72, 0.83) 50%,
    rgba(9, 160, 42, 0.865) 100%
  );
  border-radius: 8px;
  transition: width 0.3s ease-out;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(14, 218, 167, 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #228B22;
  letter-spacing: 0.05em;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-content {
    gap: 1.5rem;
  }
  
  .loading-gif {
    width: 150px;
  }
  
  .loading-text {
    font-size: 1.8rem;
  }
  
  .loading-progress {
    width: 350px;
  }
  
  .progress-bar {
    height: 35px;
  }
  
  .progress-text {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .loading-content {
    gap: 1.2rem;
  }
  
  .loading-gif {
    width: 120px;
  }
  
  .loading-text {
    font-size: 1.5rem;
  }
  
  .loading-progress {
    width: 280px;
  }
  
  .progress-bar {
    height: 30px;
  }
  
  .progress-text {
    font-size: 1rem;
  }
}

/* 过渡动画 */
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.5s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}
</style>

