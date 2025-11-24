<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoadingPage from '@/components/LoadingPage.vue'

const isLoading = ref(true)

onMounted(() => {
  // 等待页面资源加载完成
  const checkLoadComplete = () => {
    try {
      if (document.readyState === 'complete') {
        // 额外等待一小段时间确保所有资源都已加载
        setTimeout(() => {
          isLoading.value = false
        }, 800)
      } else {
        window.addEventListener('load', () => {
          setTimeout(() => {
            isLoading.value = false
          }, 800)
        })
      }
    } catch (error) {
      console.error('加载检查失败:', error)
      isLoading.value = false
    }
  }
  
  checkLoadComplete()
  
  // 设置最大加载时间，防止无限加载
  setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false
    }
  }, 10000) // 10秒后强制完成加载
})
</script>

<template>
  <div class="app-shell">
    <LoadingPage :is-loading="isLoading" />
    <router-view />
  </div>
</template>

<style>
/* 引入自定义字体 */
@font-face {
  font-family: 'SourceHanSansCN';
  src: url('/static/fonts/SourceHanSansCN-Bold.woff2') format('woff2');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 100px; /* 默认基准值，移动端会动态调整 */
}

html,
body,
#app {
  height: 100%;
  width: 100%;
  font-family:
    'SourceHanSansCN',
    'Noto Sans SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'Microsoft YaHei',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* CSS变量 - REM适配系统 */
:root {
  --design-base: 414px;
  --rem-base: 100px;
  --spacing-xs: 0.08rem;   /* 8px */
  --spacing-sm: 0.16rem;   /* 16px */
  --spacing-md: 0.24rem;   /* 24px */
  --spacing-lg: 0.32rem;   /* 32px */
  --spacing-xl: 0.4rem;    /* 40px */
}

/* 大屏手机适配 (414px以上) */
@media screen and (min-width: 415px) {
  html {
    font-size: 100px;
  }
}

/* 中等屏幕 (393-414px) - 小米14/华为Mate等 */
@media screen and (max-width: 414px) and (min-width: 393px) {
  html {
    font-size: 95px; /* 轻微缩放 */
  }
}

/* 小屏适配 (360-392px) - 中端机型 */
@media screen and (max-width: 392px) and (min-width: 360px) {
  html {
    font-size: 87px;
  }
}

/* 超小屏 (320-359px) - 老旧机型 */
@media screen and (max-width: 359px) {
  html {
    font-size: 77px;
  }
}

.app-shell {
  min-height: 100%;
  width: 100%;
  position: relative;
}

</style>
