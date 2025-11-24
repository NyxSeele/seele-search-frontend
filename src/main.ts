import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'

// REM适配脚本 - 基于414px设计稿，1rem = 100px
function setRem() {
  try {
    const designWidth = 414 // 设计稿宽度
    const baseSize = 100 // 1rem基准值(100px)
    const clientWidth = document.documentElement.clientWidth || window.innerWidth || 414
    const scale = clientWidth / designWidth
    const fontSize = baseSize * Math.min(scale, 2) // 限制最大缩放2倍
    document.documentElement.style.fontSize = fontSize + 'px'
  } catch (error) {
    console.error('REM适配失败:', error)
  }
}

// 初始化REM - 确保在DOM加载后执行
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setRem)
  } else {
    setRem()
  }
  
  // 监听窗口大小变化
  window.addEventListener('resize', setRem)
  window.addEventListener('orientationchange', setRem)
} catch (error) {
  console.error('REM初始化失败:', error)
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
