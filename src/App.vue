<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoadingPage from '@/components/LoadingPage.vue'

const isLoading = ref(true)

onMounted(() => {
  // 等待页面资源加载完成
  const checkLoadComplete = () => {
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

.app-shell {
  min-height: 100%;
  width: 100%;
  position: relative;
}

</style>
