<template>
  <Teleport to="body">
    <Transition name="panel">
      <div v-if="visible" class="panel-overlay">
        <div class="qna-panel" :style="panelStyle" @mousedown="handleMouseDown" @click.stop>
          <!-- Header -->
          <div class="panel-header" style="cursor: grab">
            <div class="header-left">
              <img src="/static/icons/dashboard.png" alt="dashboard" class="header-icon" />
            </div>
            <button class="panel-close" @click="$emit('close')">✕</button>
          </div>

          <!-- Chat History -->
          <div class="chat-container" ref="chatContainerRef">
            <div v-if="chatHistory.length === 0" class="empty-state">
              <img src="/static/icons/heat.png" alt="heat" class="empty-icon" />
              <div class="example-questions">
                <button
                  v-for="(example, index) in exampleQuestions"
                  :key="index"
                  class="example-btn"
                  @click="handleExampleQuestion(example)"
                >
                  {{ example }}
                </button>
              </div>
            </div>

            <div v-else class="chat-history">
              <div v-for="(chat, index) in chatHistory" :key="index" class="chat-item">
                <!-- User Question -->
                <div class="message user-message">
                  <div class="message-avatar user-avatar">用户</div>
                  <div class="message-content">
                    <div class="message-text">{{ chat.question }}</div>
                    <div v-if="chat.platformFilter" class="message-meta">
                      平台: {{ getPlatformLabel(chat.platformFilter) }}
                    </div>
                  </div>
                </div>

                <!-- AI Answer -->
                <div class="message ai-message">
                  <div class="message-avatar ai-avatar">AI</div>
                  <div class="message-content">
                    <div v-if="chat.loading" class="loading-state">
                      <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <p>AI 正在思考...</p>
                    </div>
                    <div v-else-if="chat.error" class="error-state">
                      <p>{{ chat.error }}</p>
                      <button class="retry-btn" @click="retryQuestion(index)">重试</button>
                    </div>
                    <div v-else class="answer-content">
                      <div class="message-text">{{ chat.answer }}</div>

                      <!-- Related Hot Searches -->
                      <div
                        v-if="chat.relatedHotSearches && chat.relatedHotSearches.length > 0"
                        class="related-searches"
                      >
                        <h4 class="related-title">相关热搜</h4>
                        <div class="related-list">
                          <a
                            v-for="(item, idx) in chat.relatedHotSearches"
                            :key="idx"
                            :href="item.url"
                            target="_blank"
                            class="related-item"
                          >
                            <span class="related-platform">
                              {{ getPlatformLabel(item.platform) }}
                            </span>
                            <span class="related-title-text">{{ item.title }}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="input-area">
            <div class="platform-filter">
              <button
                v-for="option in platformOptions"
                :key="option.value"
                class="filter-btn"
                :class="{ active: selectedPlatform === option.value }"
                :style="getFilterStyle(option.value as Platform | '')"
                @click="selectedPlatform = (option.value as Platform | '')"
              >
                {{ option.label }}
              </button>
            </div>
            <div class="input-wrapper">
              <input
                v-model="question"
                type="text"
                class="question-input"
                placeholder="请输入你的问题..."
                @keyup.enter="handleAskQuestion"
                @input="handleSearchInput"
                @focus="showSuggestions = true"
                :disabled="isAsking"
              />
              <!-- 搜索建议下拉框 -->
              <div
                v-if="showSuggestions && question && searchSuggestions.length > 0"
                class="suggestions-dropdown"
              >
                <div
                  v-for="(suggestion, index) in searchSuggestions"
                  :key="index"
                  class="suggestion-item"
                  @click="handleSearchSuggestion(suggestion)"
                >
                  {{ suggestion }}
                </div>
              </div>
              <button class="voice-btn" title="语音输入" @click.stop>
                <svg class="voice-icon" width="18" height="18" viewBox="0 0 16 16" fill="none">
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
              <button
                class="send-btn"
                @click="handleAskQuestion"
                :disabled="!question.trim() || isAsking"
              >
                <span v-if="!isAsking" class="arrow-icon">↑</span>
                <span v-else class="loading-spinner"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, watch, onBeforeUnmount } from 'vue'
import { Platform } from '@/types'
import type { QNARequest } from '@/types'
import aiApi from '@/api/ai'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// 拖动相关状态
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const panelX = ref(0)
const panelY = ref(0)
const initialPanelX = ref(0)
const initialPanelY = ref(0)

const panelStyle = computed(() => {
  return {
    transformOrigin: 'calc(100% - 64px) calc(100% - 64px)',
    transform: `translate(${panelX.value}px, ${panelY.value}px)`,
    cursor: isDragging.value ? 'grabbing' : 'default',
  }
})

// 拖动功能
const handleMouseDown = (e: MouseEvent) => {
  // 只在header区域允许拖动
  const target = e.target as HTMLElement
  if (!target.closest('.panel-header')) return

  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  initialPanelX.value = panelX.value
  initialPanelY.value = panelY.value

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return

  const deltaX = e.clientX - dragStartX.value
  const deltaY = e.clientY - dragStartY.value

  panelX.value = initialPanelX.value + deltaX
  panelY.value = initialPanelY.value + deltaY
}

const handleMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 清理事件监听
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

interface ChatItem {
  question: string
  platformFilter?: Platform
  answer?: string
  loading: boolean
  error?: string
  relatedHotSearches?: Array<{
    title: string
    platform: Platform
    heat?: number
    url?: string
  }>
}

const question = ref('')
const selectedPlatform = ref<Platform | ''>('')
const chatHistory = ref<ChatItem[]>([])
const chatContainerRef = ref<HTMLElement | null>(null)
const isAsking = ref(false)
const showSuggestions = ref(false)
const searchSuggestions = ref<string[]>([])
const loadingSuggestions = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const platformOptions = [
  { label: '全部平台', value: '' },
  { label: '微博', value: Platform.WEIBO },
  { label: '今日头条', value: Platform.TOUTIAO },
  { label: 'B站', value: Platform.BILIBILI },
  { label: '抖音', value: Platform.DOUYIN },
]

const getFilterIcon = (value: Platform | '') => {
  if (!value) return '/static/icons/dashboard.png'
  const map: Record<Platform, string> = {
    [Platform.WEIBO]: '/static/icons/weibo.jpg',
    [Platform.TOUTIAO]: '/static/icons/toutiao.png',
    [Platform.BILIBILI]: '/static/icons/bilibili.png',
    [Platform.DOUYIN]: '/static/icons/doyin.png',
  }
  return map[value]
}

const getFilterStyle = (value: Platform | '') => ({
  '--option-icon': `url(${getFilterIcon(value)})`,
})

const exampleQuestions = ['今天有什么热门话题？', '最近世界局势如何？', '最近有什么热梗？']

const getPlatformLabel = (platform: Platform) => {
  const map: Record<Platform, string> = {
    [Platform.WEIBO]: '微博',
    [Platform.TOUTIAO]: '今日头条',
    [Platform.BILIBILI]: 'B站',
    [Platform.DOUYIN]: '抖音',
  }
  return map[platform]
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

const handleExampleQuestion = (exampleQ: string) => {
  question.value = exampleQ
  handleAskQuestion()
}

const handleAskQuestion = async () => {
  if (!question.value.trim() || isAsking.value) return

  const chatItem: ChatItem = {
    question: question.value.trim(),
    platformFilter: selectedPlatform.value || undefined,
    loading: true,
  }

  chatHistory.value.push(chatItem)
  const currentQuestion = question.value
  question.value = ''
  isAsking.value = true

  scrollToBottom()

  try {
    const payload: QNARequest = {
      question: currentQuestion,
      platformFilter: selectedPlatform.value || undefined,
    }

    const response = await aiApi.askQuestion(payload)

    chatItem.loading = false
    chatItem.answer = response.data.answer
    chatItem.relatedHotSearches = response.data.relatedHotSearches
  } catch (error) {
    console.error('AI提问失败:', error)
    chatItem.loading = false
    chatItem.error = 'AI回答失败，请稍后重试'
  } finally {
    isAsking.value = false
    scrollToBottom()
  }
}

const retryQuestion = async (index: number) => {
  const chatItem = chatHistory.value[index]
  if (!chatItem) return
  
  chatItem.loading = true
  chatItem.error = undefined

  try {
    const payload: QNARequest = {
      question: chatItem.question,
      platformFilter: chatItem.platformFilter,
    }

    const response = await aiApi.askQuestion(payload)

    chatItem.loading = false
    chatItem.answer = response.data.answer
    chatItem.relatedHotSearches = response.data.relatedHotSearches
  } catch (error) {
    console.error('AI提问重试失败:', error)
    chatItem.loading = false
    chatItem.error = 'AI回答失败，请稍后重试'
  }
}

const handleSearchInput = () => {
  if (!question.value.trim()) {
    showSuggestions.value = false
    searchSuggestions.value = []
    return
  }

  showSuggestions.value = true

  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  // 轻量防抖，30ms 后请求，尽量提升联想速度
  searchTimer = setTimeout(async () => {
    loadingSuggestions.value = true
    try {
      const query = question.value.trim()
      const callbackName = `baiduSuggestion_${Date.now()}`

      ;(window as any)[callbackName] = (data: any) => {
        try {
          if (data && data.s && Array.isArray(data.s)) {
            searchSuggestions.value = data.s.slice(0, 4)
          } else {
            searchSuggestions.value = []
          }
        } catch (e) {
          console.error('解析建议失败:', e)
          searchSuggestions.value = []
        }
        loadingSuggestions.value = false
        delete (window as any)[callbackName]
      }

      const script = document.createElement('script')
      script.src = `https://suggestion.baidu.com/su?wd=${encodeURIComponent(query)}&cb=${callbackName}`

      script.onerror = () => {
        searchSuggestions.value = []
        loadingSuggestions.value = false
        delete (window as any)[callbackName]
      }

      document.head.appendChild(script)

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

const handleSearchSuggestion = (suggestion: string) => {
  question.value = suggestion
  showSuggestions.value = false
}
</script>

<style scoped>
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.qna-panel {
  background: url('/static/images/card.png') no-repeat center center;
  background-size: 100% 100%;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90vw;
  max-width: 550px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  will-change: transform, opacity;
  pointer-events: auto;
  user-select: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: none;
  background: transparent;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 88px;
  height: 88px;
  object-fit: contain;
}

.panel-close {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 50%;
  font-size: 20px;
  color: #555;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}

.panel-close:hover {
  background: rgba(0, 0, 0, 0.08);
  transform: rotate(90deg);
  opacity: 1;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: transparent;
}

.chat-container::-webkit-scrollbar {
  width: 8px;
}

.chat-container::-webkit-scrollbar-track {
  background: transparent;
}

.chat-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  color: #999;
  text-align: center;
  padding-top: 12px;
}

.empty-icon {
  width: 160px;
  height: 160px;
  object-fit: contain;
  margin-bottom: 24px;
}

.example-questions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: -24px;
}

.example-btn {
  padding: 16px 28px;
  background: url('/static/icons/banner2.png') no-repeat center center;
  background-size: 100% 100%;
  border: none;
  border-radius: 24px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.4;
}

.example-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.chat-history {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chat-item {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-message .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ai-message .message-avatar {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.message-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-text {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  color: #666;
}

.typing-indicator {
  display: flex;
  gap: 6px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.retry-btn {
  padding: 8px 20px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

.answer-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.related-searches {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.related-title {
  font-size: 14px;
  font-weight: 700;
  color: #666;
  margin: 0 0 12px 0;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.related-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(4px);
}

.related-platform {
  padding: 4px 10px;
  background: #667eea;
  color: #fff;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.related-title-text {
  flex: 1;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.input-area {
  border-top: none;
  padding: 20px;
  background: transparent;
}

.platform-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 10px 26px;
  background: transparent !important;
  border: none;
  border-radius: 999px;
  font-size: 13px;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: visible;
}

.filter-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('/static/icons/circular bubble.png') no-repeat center center;
  background-size: 100% 100%;
  z-index: -1;
  transition: all 0.3s ease;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.18));
}

.filter-btn::after {
  content: '';
  position: absolute;
  bottom: -40px;
  left: 50%;
  width: 48px;
  height: 48px;
  background-image: var(--option-icon);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  transform: translate(-50%, 10px) scale(0.85);
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
}

.filter-btn.active {
  background: transparent !important;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
}

.filter-btn.active::before {
  background: url('/static/icons/long banner.png') no-repeat center center;
  background-size: 100% 100%;
  transform: scaleX(1.08);
  filter: brightness(1);
}

.filter-btn:hover:not(.active) {
  filter: brightness(1.08);
  transform: translateY(-2px);
}

.filter-btn:hover::after {
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  position: relative;
}

.question-input {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  outline: none;
  transition: all 0.3s ease;
  background: url('/static/icons/banner.png') no-repeat center center;
  background-size: 100% 100%;
  color: #333;
}

.question-input:focus {
  background: url('/static/icons/banner.png') no-repeat center center;
  background-size: 100% 100%;
}

.question-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.suggestions-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 8px;
}

.suggestion-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
  color: #333;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: #f5f7ff;
  color: #667eea;
}

.voice-btn {
  width: 50px;
  height: 50px;
  border: none;
  background: url('/static/icons/circular bubble.png') no-repeat center center;
  background-size: 100% 100%;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  padding: 0;
  flex-shrink: 0;
}

.voice-btn:hover {
  transform: scale(1.1);
  filter: brightness(1.1);
}

.voice-icon {
  width: 20px;
  height: 20px;
  color: #ffffff;
  stroke: currentColor;
  opacity: 1;
}

.send-btn {
  padding: 0;
  background: url('/static/icons/circular bubble.png') no-repeat center center;
  background-size: 100% 100%;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
  filter: brightness(1.1);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.arrow-icon {
  font-size: 24px;
  line-height: 1;
  color: #ffffff;
  opacity: 1;
  font-weight: bold;
}

.send-btn .loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  opacity: 0.9;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Panel Transitions - 从右下角按钮位置缩放 */
.panel-enter-active {
  animation: panelIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.panel-leave-active {
  animation: panelOut 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes panelIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes panelOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.panel-enter-active .qna-panel {
  animation: panelScaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.panel-leave-active .qna-panel {
  animation: panelScaleOut 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes panelScaleIn {
  from {
    transform: translate(calc(50vw - 50% - 32px), calc(50vh - 50% + 32px)) scale(0);
    border-radius: 50%;
  }
  to {
    transform: translate(0, 0) scale(1);
    border-radius: 24px;
  }
}

@keyframes panelScaleOut {
  from {
    transform: translate(0, 0) scale(1);
    border-radius: 24px;
  }
  to {
    transform: translate(calc(50vw - 50% - 32px), calc(50vh - 50% + 32px)) scale(0);
    border-radius: 50%;
  }
}

@keyframes glow-pulse {
  0% {
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 25px rgba(255, 255, 255, 0.6), 0 0 50px rgba(255, 255, 255, 0.3);
  }
  100% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3);
  }
}

@media (max-width: 768px) {
  .qna-panel {
    width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  @keyframes panelScaleIn {
    from {
      transform: translate(calc(50vw - 50% - 24px), calc(50vh - 50% + 24px)) scale(0);
      border-radius: 50%;
    }
    to {
      transform: translate(0, 0) scale(1);
      border-radius: 0;
    }
  }

  @keyframes panelScaleOut {
    from {
      transform: translate(0, 0) scale(1);
      border-radius: 0;
    }
    to {
      transform: translate(calc(50vw - 50% - 24px), calc(50vh - 50% + 24px)) scale(0);
      border-radius: 50%;
    }
  }
}
</style>
