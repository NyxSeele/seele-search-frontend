<template>
  <div class="home-page">
    <Navbar />

    <main class="home-content">
      <div class="search-section">
        <!-- Top Logo -->
        <div class="top-logo"></div>

        <div class="action-buttons">
          <div class="heat-icon-container" @click="goToHotSearch">
            <img src="/static/icons/heat.png" alt="查看热搜" class="heat-icon" />
            <div class="heat-bubble">
              <img src="/static/icons/bubble.png" alt="气泡" class="bubble-img" />
              <span class="bubble-text">点我查看热搜哦</span>
            </div>
          </div>
        </div>

        <div class="search-container">
          <div class="search-box-wrapper">
            <svg class="search-icon-left" width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path
                d="M7 12.5C10.0376 12.5 12.5 10.0376 12.5 7C12.5 3.96243 10.0376 1.5 7 1.5C3.96243 1.5 1.5 3.96243 1.5 7C1.5 10.0376 3.96243 12.5 7 12.5Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M14.5 14.5L10.875 10.875"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="搜索任何内容..."
              @focus="showSuggestions = true"
              @input="handleSearchInput"
              @keyup.enter="handleSearch"
            />
            <button v-if="searchQuery" class="clear-button" @click="clearSearch" title="清除">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
            <button class="mic-button" title="语音输入" @click.prevent="openVoiceModal">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 11C9.65685 11 11 9.65685 11 8V3C11 1.34315 9.65685 0 8 0C6.34315 0 5 1.34315 5 3V8C5 9.65685 6.34315 11 8 11Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M3 8C3 10.7614 5.23858 13 8 13C10.7614 13 13 10.7614 13 8"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <path
                  d="M8 13V16"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
            <button class="search-button" @click="handleSearch" title="搜索">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path
                  d="M7 12.5C10.0376 12.5 12.5 10.0376 12.5 7C12.5 3.96243 10.0376 1.5 7 1.5C3.96243 1.5 1.5 3.96243 1.5 7C1.5 10.0376 3.96243 12.5 7 12.5Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M14.5 14.5L10.875 10.875"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <!-- 搜索建议下拉框 - Edge风格 -->
          <div
            v-if="showSuggestions && searchQuery && searchSuggestions.length > 0"
            class="suggestions-dropdown"
          >
            <!-- 搜索建议 -->
            <div
              v-for="(suggestion, index) in searchSuggestions"
              :key="index"
              class="suggestion-item"
              @click="handleSearchSuggestion(suggestion)"
            >
              <svg class="search-icon-svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M7 12.5C10.0376 12.5 12.5 10.0376 12.5 7C12.5 3.96243 10.0376 1.5 7 1.5C3.96243 1.5 1.5 3.96243 1.5 7C1.5 10.0376 3.96243 12.5 7 12.5Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M14.5 14.5L10.875 10.875"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div class="suggestion-content">
                <div class="suggestion-title">{{ suggestion }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- AI提问悬浮按钮 -->
    <div
      class="qna-fab-container"
      :style="{ transform: `translate(${qnaFabPosition.x}px, ${qnaFabPosition.y}px)` }"
      @mousedown="handleQnaMouseDown"
      @mouseenter="handleQnaMouseEnter"
    >
      <button class="qna-fab" @click="handleQnaClick" title="AI智能问答">
        <img src="/static/icons/thinking.png" alt="AI" class="fab-icon-img" />
      </button>
      <div v-if="showQnaTooltip" class="qna-tooltip">
        {{ qnaPanelVisible ? '点我也可以关闭提问哦' : '有什么问题都可以点我哦' }}
      </div>
    </div>

    <!-- QNA面板 -->
    <QNAPanel :visible="qnaPanelVisible" @close="qnaPanelVisible = false" />

    <Teleport to="body">
      <div v-if="showVoiceModal" class="voice-modal-overlay" @click.self="closeVoiceModal">
        <div class="voice-modal-card">
          <p class="voice-modal-text">敬请期待</p>
          <button class="voice-modal-btn" @click="closeVoiceModal">确定</button>
        </div>
      </div>
    </Teleport>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import QNAPanel from '@/components/QNAPanel.vue'
import Footer from '@/components/Footer.vue'
import hotSearchApi from '@/api/hotSearch'
import type { HotSearchItem } from '@/types'
import { Platform } from '@/types'

const router = useRouter()
const searchQuery = ref('')
const showSuggestions = ref(false)
const loadingSuggestions = ref(false)
const searchSuggestions = ref<string[]>([])
const qnaPanelVisible = ref(false)
const qnaFabPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const hasDragged = ref(false)
const DRAG_THRESHOLD = 6
const showQnaTooltip = ref(true)
let tooltipHideTimer: ReturnType<typeof setTimeout> | null = null
const showVoiceModal = ref(false)
const openVoiceModal = () => {
  showVoiceModal.value = true
}

const closeVoiceModal = () => {
  showVoiceModal.value = false
}

const getPlatformLabel = (platform: Platform) => {
  const map: Record<Platform, string> = {
    [Platform.WEIBO]: '微博',
    [Platform.TOUTIAO]: '今日头条',
    [Platform.BILIBILI]: 'B站',
    [Platform.DOUYIN]: '抖音',
  }
  return map[platform]
}

  // 防抖处理（尽量接近即时响应）
let searchTimer: ReturnType<typeof setTimeout> | null = null

const handleSearchInput = async () => {
  if (!searchQuery.value.trim()) {
    searchSuggestions.value = []
    showSuggestions.value = false
    return
  }

  showSuggestions.value = true

  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  // 轻量防抖，30ms 后请求，更接近浏览器原生搜索建议的速度
  searchTimer = setTimeout(async () => {
    loadingSuggestions.value = true
    try {
      const query = searchQuery.value.trim()
      // 使用百度搜索建议API（JSONP方式，更稳定）
      const callbackName = `baiduSuggestion_${Date.now()}`

      // 定义全局回调函数
      ;(window as any)[callbackName] = (data: any) => {
        try {
          if (data && data.s && Array.isArray(data.s)) {
            searchSuggestions.value = data.s.slice(0, 5)
          } else {
            searchSuggestions.value = []
          }
        } catch (e) {
          console.error('解析建议失败:', e)
          searchSuggestions.value = []
        }
        loadingSuggestions.value = false
        // 清理全局回调
        delete (window as any)[callbackName]
      }

      const script = document.createElement('script')
      script.src = `https://suggestion.baidu.com/su?wd=${encodeURIComponent(query)}&cb=${callbackName}`

      // 错误处理
      script.onerror = () => {
        searchSuggestions.value = []
        loadingSuggestions.value = false
        delete (window as any)[callbackName]
      }

      document.head.appendChild(script)

      // 超时处理和清理
      setTimeout(() => {
        loadingSuggestions.value = false
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
        delete (window as any)[callbackName]
      }, 3000)
    } catch (error) {
      console.error('获取搜索建议失败:', error)
      searchSuggestions.value = []
      loadingSuggestions.value = false
    }
  }, 30)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchSuggestions.value = []
}

const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  showSuggestions.value = false
  // 跳转到Bing搜索
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery.value)}`
  window.open(searchUrl, '_blank')
}

const handleSearchSuggestion = (suggestion: string) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  // 跳转到Bing搜索
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(suggestion)}`
  window.open(searchUrl, '_blank')
}

const goToHotSearch = () => {
  router.push('/hot-search')
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.search-container')) {
    showSuggestions.value = false
  }
}

const handleQnaMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  hasDragged.value = false
  dragStart.value = {
    x: e.clientX - qnaFabPosition.value.x,
    y: e.clientY - qnaFabPosition.value.y,
  }
  document.addEventListener('mousemove', handleQnaMouseMove)
  document.addEventListener('mouseup', handleQnaMouseUp)
}

const handleQnaMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  const nextPosition = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y,
  }
  const deltaX = nextPosition.x - qnaFabPosition.value.x
  const deltaY = nextPosition.y - qnaFabPosition.value.y
  if (!hasDragged.value) {
    const movedEnough = Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD
    if (movedEnough) {
      hasDragged.value = true
    }
  }
  if (hasDragged.value) {
    qnaFabPosition.value = nextPosition
  }
}

const handleQnaMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleQnaMouseMove)
  document.removeEventListener('mouseup', handleQnaMouseUp)
}

const handleQnaClick = () => {
  if (hasDragged.value) {
    hasDragged.value = false
    return
  }
  qnaPanelVisible.value = !qnaPanelVisible.value
  hideTooltipTemporarily()
}

const handleQnaMouseEnter = () => {
  hideTooltipTemporarily()
}

const hideTooltipTemporarily = () => {
  showQnaTooltip.value = false
  if (tooltipHideTimer) {
    clearTimeout(tooltipHideTimer)
  }
  tooltipHideTimer = setTimeout(() => {
    showQnaTooltip.value = true
  }, 10000)
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('mousemove', handleQnaMouseMove)
  document.removeEventListener('mouseup', handleQnaMouseUp)
  if (tooltipHideTimer) {
    clearTimeout(tooltipHideTimer)
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: url('/static/images/background.webp') no-repeat center center;
  background-size: 100% 100%;
  background-attachment: fixed;
}

.home-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 20px;
  position: relative;
  z-index: 2;
  margin-top: -180px;
}

.search-section {
  text-align: center;
  width: 100%;
  max-width: 880px;
}

/* Top Logo */
.top-logo {
  width: 335px;
  height: 335px;
  background: url('/static/icons/LOGO3.png') no-repeat center center;
  background-size: contain;
  margin: 40px auto 20px;
  position: relative;
  top: 50px;
  animation: floatUpDown 3s ease-in-out infinite;
}

@keyframes floatUpDown {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.heat-icon-container {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
}

.heat-icon-container:hover {
  transform: scale(1.1);
}

.heat-icon {
  width: 110px;
  height: 110px;
  object-fit: contain;
  transition: transform 0.3s ease;
  /* animation: pulse 2s ease-in-out infinite; */
}

.heat-icon-container:hover .heat-icon {
  transform: scale(1.05);
}

.heat-bubble {
  position: relative;
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  /* animation: pulse 2s ease-in-out infinite; */
}

.bubble-img {
  width: 170px;
  height: auto;
  object-fit: contain;
}

.bubble-text {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ffb3d9;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  padding: 0 4px;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.search-container {
  position: relative;
}

.search-box-wrapper {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 36px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  transition: all 0.2s ease;
  padding: 0 28px;
  gap: 16px;
  height: 70px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-box-wrapper:hover {
  background: #fff;
  border-color: #d0d0d0;
}

.search-box-wrapper:focus-within {
  border-color: #0ea5e9;
  box-shadow: 0 2px 12px rgba(14, 165, 233, 0.3);
}

.search-icon-left {
  color: #5f6368;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.search-input {
  flex: 1;
  padding: 0;
  border: none;
  outline: none;
  font-size: 18px;
  color: #202124;
  background: transparent;
  min-width: 0;
  line-height: 70px;
}

.search-input::placeholder {
  color: #5f6368;
}

.clear-button,
.mic-button,
.search-button {
  padding: 8px;
  border: none;
  background: transparent;
  color: #5f6368;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.15s ease;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
}

.clear-button:hover,
.mic-button:hover,
.search-button:hover {
  background: rgba(0, 0, 0, 0.06);
}

.clear-button:active,
.mic-button:active,
.search-button:active {
  background: rgba(0, 0, 0, 0.1);
}

.mic-button {
  color: #0078d4;
}

.search-button {
  color: #0078d4;
}

.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow: hidden;
  z-index: 100;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestions-loading,
.suggestions-empty {
  padding: 24px;
  text-align: center;
  color: #999;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e8e8e8;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-right: 8px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;
  border-left: 3px solid transparent;
}

.suggestion-item:hover {
  background: #f5f7fa;
  border-left-color: #667eea;
}

.search-icon-svg {
  flex-shrink: 0;
  color: #666;
  opacity: 0.7;
}

.suggestion-item:hover .search-icon-svg {
  color: #667eea;
  opacity: 1;
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-size: 18px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
  font-weight: 400;
}

.suggestion-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.suggestion-platform {
  color: #1890ff;
}

.suggestion-category {
  color: #999;
}


@media (max-width: 768px) {
  .title-gradient {
    font-size: 40px;
  }

  .title-subtitle {
    font-size: 16px;
  }

  .search-input {
    padding: 14px 20px;
    font-size: 14px;
  }

  .heat-icon {
    width: 110px;
    height: 110px;
  }

  .bubble-img {
    width: 180px;
  }

  .bubble-text {
    font-size: 17px;
  }
}

/* AI提问悬浮按钮容器 */
.qna-fab-container {
  position: fixed;
  bottom: 100px;
  right: 32px;
  z-index: 1000;
  cursor: move;
  user-select: none;
}

.qna-fab {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: transparent;
  border: none;
  box-shadow: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.qna-fab:hover {
  transform: translateY(-4px) scale(1.1);
  box-shadow: none;
}

.qna-fab:active {
  transform: translateY(-2px) scale(1.02);
}

.qna-fab:hover + .qna-tooltip {
  opacity: 0;
  visibility: hidden;
}

/* 提示气泡 */
.qna-tooltip {
  position: absolute;
  bottom: 76px;
  right: 0;
  background: url('/static/icons/bubble.png') no-repeat center center;
  background-size: contain;
  background-color: transparent;
  color: #ffb3d9;
  padding: 20px 28px 16px;
  border-radius: 0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: none;
  animation: tooltipBounce 3s ease-in-out infinite;
  pointer-events: none;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  min-width: 150px;
}

.qna-tooltip::after {
  display: none;
}

@keyframes tooltipBounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-5px);
    opacity: 0.9;
  }
}

.fab-icon-img {
  width: 82px;
  height: 82px;
  animation: pulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.voice-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
}

.voice-modal-card {
  background: url('/static/images/card.png') no-repeat center center;
  background-size: 100% 100%;
  padding: 32px 48px;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  min-width: 260px;
}

.voice-modal-text {
  font-size: 18px;
  color: #4b3829;
  font-weight: 700;
}

.voice-modal-btn {
  padding: 8px 32px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #f7c38a, #f4956c);
  color: #4b3829;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.voice-modal-btn:hover {
  transform: translateY(-2px);
}
</style>
