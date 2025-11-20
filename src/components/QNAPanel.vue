<template>
  <Teleport to="body">
    <Transition name="panel">
      <div v-if="visible" class="panel-overlay">
        <div class="qna-panel" :style="panelStyle" @mousedown="handleMouseDown" @click.stop>
          <!-- Header -->
          <div class="panel-header" style="cursor: grab">
            <h2 class="panel-title">
              <span class="ai-icon">🤖</span>
              AI 智能问答
            </h2>
            <button class="panel-close" @click="$emit('close')">✕</button>
          </div>

          <!-- Chat History -->
          <div class="chat-container" ref="chatContainerRef">
            <div v-if="chatHistory.length === 0" class="empty-state">
              <div class="empty-icon">💬</div>
              <p>向AI提问关于热搜的任何问题</p>
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
                  <div class="message-avatar">👤</div>
                  <div class="message-content">
                    <div class="message-text">{{ chat.question }}</div>
                    <div v-if="chat.platformFilter" class="message-meta">
                      平台: {{ getPlatformLabel(chat.platformFilter) }}
                    </div>
                  </div>
                </div>

                <!-- AI Answer -->
                <div class="message ai-message">
                  <div class="message-avatar">🤖</div>
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
                @click="selectedPlatform = option.value"
              >
                {{ option.label }}
              </button>
            </div>
            <div class="input-wrapper">
              <input
                v-model="question"
                type="text"
                class="question-input"
                placeholder="输入你的问题..."
                @keyup.enter="handleAskQuestion"
                :disabled="isAsking"
              />
              <button
                class="send-btn"
                @click="handleAskQuestion"
                :disabled="!question.trim() || isAsking"
              >
                <span v-if="!isAsking">发送</span>
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
import { Platform, QNARequest } from '@/types'
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

const platformOptions = [
  { label: '全部平台', value: '' },
  { label: '微博', value: Platform.WEIBO },
  { label: '今日头条', value: Platform.TOUTIAO },
  { label: 'B站', value: Platform.BILIBILI },
  { label: '抖音', value: Platform.DOUYIN },
]

const exampleQuestions = ['今天有什么热门话题?', '娱乐圈最近有什么新闻?', '科技领域有哪些热点?']

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
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 600px;
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
  padding: 24px 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.panel-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-icon {
  font-size: 28px;
}

.panel-close {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  font-size: 20px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-close:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: rotate(90deg);
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f8f9fa;
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
  min-height: 400px;
  color: #999;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.example-questions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.example-btn {
  padding: 12px 24px;
  background: #fff;
  border: 2px solid #667eea;
  border-radius: 20px;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.example-btn:hover {
  background: #667eea;
  color: #fff;
  transform: translateY(-2px);
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
  background: #fff;
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
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px;
  background: #fff;
}

.platform-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn.active {
  background: #667eea;
  color: #fff;
}

.filter-btn:hover:not(.active) {
  background: #e0e0e0;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.question-input {
  flex: 1;
  padding: 14px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 24px;
  font-size: 15px;
  outline: none;
  transition: all 0.3s ease;
}

.question-input:focus {
  border-color: #667eea;
}

.question-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5568d3 0%, #6a3f8c 100%);
  transform: translateY(-2px);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn .loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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
