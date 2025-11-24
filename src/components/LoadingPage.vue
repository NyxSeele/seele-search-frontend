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
            <div class="progress-icon" :style="{ left: `clamp(0px, calc(${progress}% - 20px), calc(100% - 40px))` }"></div>
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
  try {
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
  } catch (error) {
    console.error('body样式设置失败:', error)
  }
}, { immediate: true })

const progress = ref(0)
let progressInterval: number | null = null

// 计算加载进度
const calculateProgress = () => {
  try {
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
  } catch (error) {
    return 50
  }
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
  
  try {
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
  } catch (error) {
    console.error('进度条初始化失败:', error)
    progress.value = 100
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
  gap: 0.2rem;
  width: auto;
  padding: 0;
  box-sizing: border-box;
}

/* PC端专属优化 */
@media (min-width: 769px) {
  .loading-content {
    gap: 0.15rem;
  }
}

.loading-animation {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
}

.loading-gif {
  width: 100px;
  height: 100px;
  object-fit: contain;
  display: block;
  visibility: visible;
  opacity: 1;
}

.loading-text {
  font-size: 18px;
  font-weight: 600;
  color: #4b3829;
  letter-spacing: 0.05em;
  text-align: center;
  width: auto;
  box-sizing: border-box;
}

.loading-progress {
  width: 450px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
}

.progress-bar {
  width: 100%;
  height: 50px;
  background-image: url('/static/icons/long banner.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 8px;
  overflow: visible;
  position: relative;
}

.progress-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background-image: url('/static/icons/main.png');
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  transition: left 0.3s ease-out;
  z-index: 10;
  left: 0;
  max-width: calc(100% - 50px);
  box-sizing: border-box;
}

.progress-text {
  font-size: 18px;
  font-weight: bold;
  color: #1f701f;
  letter-spacing: 0.05em;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  margin-top: -12px;
}

/* PC端专属优化 */
@media (min-width: 769px) {
  .loading-gif {
    width: 120px;
    height: 120px;
  }

  .loading-text {
    font-size: 22px;
  }

  .loading-progress {
    width: 550px;
    gap: 0.15rem;
  }

  .progress-bar {
    height: 60px;
  }

  .progress-icon {
    width: 60px;
    height: 60px;
    max-width: calc(100% - 60px);
  }

  .progress-text {
    font-size: 20px;
    margin-top: -20px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-content {
    gap: 0.15rem;
  }
  
  .loading-gif {
    width: 0.8rem;
    height: 0.8rem;
    margin-bottom: 0.16rem;
  }
  
  .loading-text {
    font-size: 0.16rem;
    color: #4b3829;
  }
  
  .loading-progress {
    width: 3.5rem;
  }
  
  .progress-bar {
    height: 0.35rem;
  }

  .progress-icon {
    width: 0.35rem;
    height: 0.35rem;
    max-width: calc(100% - 0.35rem);
  }
  
  .progress-text {
    font-size: 0.18rem;
  }
}

@media (max-width: 480px) {
  .loading-content {
    gap: 0.12rem;
  }
  
  .loading-gif {
    width: 0.8rem;
    height: 0.8rem;
    margin-bottom: 0.16rem;
  }
  
  .loading-text {
    font-size: 0.16rem;
    color: #4b3829;
  }
  
  .loading-progress {
    width: 3rem;
  }
  
  .progress-bar {
    height: 0.35rem;
  }

  .progress-icon {
    width: 0.35rem;
    height: 0.35rem;
    max-width: calc(100% - 0.35rem);
  }
  
  .progress-text {
    font-size: 0.18rem;
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

