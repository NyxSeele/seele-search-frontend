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

    <!-- Kiana按钮（崩坏3公告） -->
    <div
      class="kiana-fab-container"
      :style="{ transform: `translate(${kianaFabPosition.x}px, ${kianaFabPosition.y}px)` }"
      @mousedown="handleKianaMouseDown"
      @mouseenter="handleKianaMouseEnter"
    >
      <button class="kiana-fab" @click="handleKianaClick" title="崩坏3最新公告">
        <img src="/static/icons/kiana.png" alt="Kiana" class="fab-icon-img" />
      </button>
      <div v-if="showKianaTooltip" class="kiana-tooltip">
        点我查看崩坏3最新公告
      </div>
    </div>

    <!-- QNA面板 -->
    <QNAPanel :visible="qnaPanelVisible" @close="qnaPanelVisible = false" />

    <!-- 崩坏3公告卡片 -->
    <FullListModal
      :visible="honkaiModalVisible"
      platform="AGGREGATE"
      :items="honkaiItems"
      :loading="honkaiLoading"
      :error="honkaiError"
      title="崩坏3最新公告"
      :show-platform-icon="false"
      @close="closeHonkaiModal"
    />

    <!-- 崩坏3公告卡片 -->
    <FullListModal
      :visible="honkaiModalVisible"
      platform="AGGREGATE"
      :items="honkaiItems"
      :loading="honkaiLoading"
      :error="honkaiError"
      title="崩坏3最新公告"
      :show-platform-icon="false"
      @close="closeHonkaiModal"
    />

    <Teleport to="body">
      <div v-if="showVoiceModal" class="voice-modal-overlay" @click.self="closeVoiceModal">
        <div class="voice-modal-card">
          <div class="voice-modal-header">
            <h3 class="voice-modal-title">语音输入</h3>
            <button class="voice-modal-close" @click="closeVoiceModal">✕</button>
          </div>
          <div class="voice-modal-content">
            <div v-if="isListening" class="voice-listening">
              <div class="voice-animation">
                <div class="voice-wave"></div>
                <div class="voice-wave"></div>
                <div class="voice-wave"></div>
              </div>
              <p class="voice-status-text">正在聆听...</p>
              <p class="voice-hint">请开始说话</p>
            </div>
            <div v-else-if="voiceError" class="voice-error">
              <p class="voice-error-text">{{ voiceError }}</p>
            </div>
            <div v-else class="voice-ready">
              <p class="voice-ready-text">点击开始按钮开始语音输入</p>
            </div>
            <div v-if="finalTranscript || interimTranscript" class="voice-transcript">
              <p class="transcript-label">识别结果：</p>
              <p class="transcript-text">{{ finalTranscript || interimTranscript }}</p>
            </div>
          </div>
          <div class="voice-modal-actions">
            <button
              v-if="isListening"
              class="voice-modal-btn voice-stop-btn"
              @click="stopListening"
            >
              停止
            </button>
            <button
              v-else-if="!voiceError"
              class="voice-modal-btn voice-start-btn"
              @click="openVoiceModal"
            >
              重新开始
            </button>
            <button
              v-if="finalTranscript"
              class="voice-modal-btn voice-confirm-btn"
              @click="closeVoiceModal"
            >
              确认搜索
            </button>
            <button class="voice-modal-btn voice-cancel-btn" @click="closeVoiceModal">
              {{ finalTranscript ? '取消' : '关闭' }}
            </button>
          </div>
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
import FullListModal from '@/components/FullListModal.vue'
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

// Kiana按钮相关状态
const kianaFabPosition = ref({ x: 0, y: 0 })
const isKianaDragging = ref(false)
const kianaDragStart = ref({ x: 0, y: 0 })
const kianaHasDragged = ref(false)
const showKianaTooltip = ref(true)
let kianaTooltipHideTimer: ReturnType<typeof setTimeout> | null = null
const honkaiModalVisible = ref(false)
const honkaiItems = ref<HotSearchItem[]>([])
const honkaiLoading = ref(false)
const honkaiError = ref('')
const showVoiceModal = ref(false)
const isListening = ref(false)
const recognition: any = ref(null)
const voiceError = ref('')
const interimTranscript = ref('')
const finalTranscript = ref('')

const openVoiceModal = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    voiceError.value = '您的浏览器不支持语音识别功能，请使用Chrome、Edge等现代浏览器'
    showVoiceModal.value = true
    return
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  recognition.value = new SpeechRecognition()
  recognition.value.continuous = false
  recognition.value.interimResults = true
  recognition.value.lang = 'zh-CN'

  recognition.value.onstart = () => {
    isListening.value = true
    voiceError.value = ''
    interimTranscript.value = ''
    finalTranscript.value = ''
  }

  recognition.value.onresult = (event: any) => {
    let interim = ''
    let final = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        final += transcript
      } else {
        interim += transcript
      }
    }

    interimTranscript.value = interim
    finalTranscript.value = final
  }

  recognition.value.onerror = (event: any) => {
    console.error('语音识别错误:', event.error)
    isListening.value = false
    switch (event.error) {
      case 'no-speech':
        voiceError.value = '未检测到语音，请重试'
        break
      case 'audio-capture':
        voiceError.value = '无法访问麦克风，请检查权限设置'
        break
      case 'not-allowed':
        voiceError.value = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问'
        break
      default:
        voiceError.value = '语音识别出错，请重试'
    }
  }

  recognition.value.onend = () => {
    isListening.value = false
    if (finalTranscript.value) {
      searchQuery.value = finalTranscript.value
      closeVoiceModal()
      handleSearch()
    }
  }

  showVoiceModal.value = true
  try {
    recognition.value.start()
  } catch (error) {
    console.error('启动语音识别失败:', error)
    voiceError.value = '启动语音识别失败，请重试'
    isListening.value = false
  }
}

const closeVoiceModal = () => {
  if (recognition.value && isListening.value) {
    try {
      recognition.value.stop()
    } catch (error) {
      console.error('停止语音识别失败:', error)
    }
  }
  isListening.value = false
  showVoiceModal.value = false
  interimTranscript.value = ''
  finalTranscript.value = ''
  voiceError.value = ''
}

const stopListening = () => {
  if (recognition.value && isListening.value) {
    try {
      recognition.value.stop()
    } catch (error) {
      console.error('停止语音识别失败:', error)
    }
  }
  isListening.value = false
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

const handleKianaMouseDown = (e: MouseEvent) => {
  isKianaDragging.value = true
  kianaHasDragged.value = false
  kianaDragStart.value = {
    x: e.clientX - kianaFabPosition.value.x,
    y: e.clientY - kianaFabPosition.value.y,
  }
  document.addEventListener('mousemove', handleKianaMouseMove)
  document.addEventListener('mouseup', handleKianaMouseUp)
}

const handleKianaMouseMove = (e: MouseEvent) => {
  if (!isKianaDragging.value) return
  const nextPosition = {
    x: e.clientX - kianaDragStart.value.x,
    y: e.clientY - kianaDragStart.value.y,
  }
  const deltaX = nextPosition.x - kianaFabPosition.value.x
  const deltaY = nextPosition.y - kianaFabPosition.value.y
  if (!kianaHasDragged.value) {
    const movedEnough = Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD
    if (movedEnough) {
      kianaHasDragged.value = true
    }
  }
  if (kianaHasDragged.value) {
    kianaFabPosition.value = nextPosition
  }
}

const handleKianaMouseUp = () => {
  isKianaDragging.value = false
  document.removeEventListener('mousemove', handleKianaMouseMove)
  document.removeEventListener('mouseup', handleKianaMouseUp)
}

const handleKianaClick = async () => {
  if (kianaHasDragged.value) {
    kianaHasDragged.value = false
    return
  }
  // 显示崩坏3公告卡片
  honkaiModalVisible.value = true
  hideKianaTooltipTemporarily()
  
  if (honkaiItems.value.length === 0) {
    await loadHonkaiData()
  }
}

const loadHonkaiData = async () => {
  honkaiLoading.value = true
  honkaiError.value = ''
  try {
    const response = await hotSearchApi.getHonkaiHotSearch()
    honkaiItems.value = response.data || []
  } catch (error) {
    console.error('加载崩坏3数据失败:', error)
    honkaiError.value = '加载失败，请稍后重试'
  } finally {
    honkaiLoading.value = false
  }
}

const closeHonkaiModal = () => {
  honkaiModalVisible.value = false
}

const handleKianaMouseEnter = () => {
  hideKianaTooltipTemporarily()
}

const hideKianaTooltipTemporarily = () => {
  showKianaTooltip.value = false
  if (kianaTooltipHideTimer) {
    clearTimeout(kianaTooltipHideTimer)
  }
  kianaTooltipHideTimer = setTimeout(() => {
    showKianaTooltip.value = true
  }, 10000)
}

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('mousemove', handleQnaMouseMove)
  document.removeEventListener('mouseup', handleQnaMouseUp)
  document.removeEventListener('mousemove', handleKianaMouseMove)
  document.removeEventListener('mouseup', handleKianaMouseUp)
  if (tooltipHideTimer) {
    clearTimeout(tooltipHideTimer)
  }
  if (kianaTooltipHideTimer) {
    clearTimeout(kianaTooltipHideTimer)
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

/* Kiana按钮容器 */
.kiana-fab-container {
  position: fixed;
  bottom: 100px;
  left: 32px;
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

/* Kiana按钮样式（与QNA完全一致） */
.kiana-fab {
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

.kiana-fab:hover {
  transform: translateY(-4px) scale(1.1);
  box-shadow: none;
}

.kiana-fab:active {
  transform: translateY(-2px) scale(1.02);
}

.kiana-fab:hover + .kiana-tooltip {
  opacity: 0;
  visibility: hidden;
}

/* Kiana提示气泡 */
.kiana-tooltip {
  position: absolute;
  bottom: 76px;
  left: 0;
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

.kiana-tooltip::after {
  display: none;
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
  gap: 20px;
  min-width: 360px;
  max-width: 500px;
}

.voice-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.voice-modal-title {
  font-size: 20px;
  color: #4b3829;
  font-weight: 700;
  margin: 0;
}

.voice-modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 50%;
  font-size: 18px;
  color: #4b3829;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.voice-modal-close:hover {
  background: rgba(75, 56, 41, 0.1);
}

.voice-modal-content {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.voice-listening {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.voice-animation {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.voice-wave {
  width: 12px;
  height: 40px;
  background: linear-gradient(135deg, #f7c38a, #f4956c);
  border-radius: 6px;
  animation: voiceWave 1.2s ease-in-out infinite;
}

.voice-wave:nth-child(2) {
  animation-delay: 0.2s;
}

.voice-wave:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes voiceWave {
  0%, 100% {
    transform: scaleY(0.5);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

.voice-status-text {
  font-size: 18px;
  color: #4b3829;
  font-weight: 600;
  margin: 0;
}

.voice-hint {
  font-size: 14px;
  color: rgba(75, 56, 41, 0.7);
  margin: 0;
}

.voice-error {
  text-align: center;
}

.voice-error-text {
  font-size: 16px;
  color: #e74c3c;
  font-weight: 600;
  margin: 0;
}

.voice-ready {
  text-align: center;
}

.voice-ready-text {
  font-size: 16px;
  color: #4b3829;
  margin: 0;
}

.voice-transcript {
  width: 100%;
  margin-top: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(75, 56, 41, 0.2);
}

.transcript-label {
  font-size: 14px;
  color: rgba(75, 56, 41, 0.7);
  margin: 0 0 8px 0;
  font-weight: 600;
}

.transcript-text {
  font-size: 16px;
  color: #4b3829;
  margin: 0;
  line-height: 1.6;
  word-break: break-word;
}

.voice-modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.voice-modal-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 15px;
}

.voice-start-btn,
.voice-confirm-btn {
  background: linear-gradient(135deg, #f7c38a, #f4956c);
  color: #4b3829;
}

.voice-start-btn:hover,
.voice-confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(247, 195, 138, 0.4);
}

.voice-stop-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: #fff;
}

.voice-stop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}

.voice-cancel-btn {
  background: rgba(75, 56, 41, 0.1);
  color: #4b3829;
}

.voice-cancel-btn:hover {
  background: rgba(75, 56, 41, 0.2);
}
</style>
