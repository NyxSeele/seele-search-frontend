<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleClose">
        <div
          ref="modalContainer"
          class="modal-container"
          :class="{ 'is-dragging': isDragging }"
          @click.stop
          @mousedown="dragStart"
          @touchstart="dragStart"
        >
          <button class="modal-close" @click="handleClose">✕</button>

          <div class="modal-content">
            <!-- Loading -->
            <div v-if="loading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>AI正在分析热搜数据...</p>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="error-state">
              <p>{{ error }}</p>
              <button class="retry-btn" @click="$emit('retry')">重试</button>
            </div>

            <!-- Summary Content -->
            <div v-else-if="summary" class="summary-content">
              <!-- 全局总结 -->
              <div class="summary-section">
                <h3 class="section-title">📊 全局分析</h3>
                <p class="summary-text">{{ summary.summary }}</p>
              </div>

              <!-- 核心话题 -->
              <div
                v-if="summary.coreTopics && summary.coreTopics.length > 0"
                class="summary-section"
              >
                <h3 class="section-title">🔥 核心话题</h3>
                <div class="topics-grid">
                  <div v-for="(topic, index) in summary.coreTopics" :key="index" class="topic-card">
                    <div class="topic-header">
                      <span class="topic-name">{{ topic.topic }}</span>
                      <span class="heat-badge" :class="`heat-${topic.heatLevel.toLowerCase()}`">
                        {{ topic.heatLevel }}
                      </span>
                    </div>
                    <p class="topic-desc">{{ topic.description }}</p>
                    <div class="topic-platforms">
                      <span
                        v-for="platform in topic.platforms"
                        :key="platform"
                        class="platform-tag"
                      >
                        {{ getPlatformLabel(platform) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 跨平台洞察 -->
              <div
                v-if="summary.crossPlatformInsights && summary.crossPlatformInsights.length > 0"
                class="summary-section"
              >
                <h3 class="section-title">💡 跨平台洞察</h3>
                <ul class="insights-list">
                  <li v-for="(insight, index) in summary.crossPlatformInsights" :key="index">
                    {{ insight }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { AISummary, Platform } from '@/types'

const props = defineProps<{
  visible: boolean
  title: string
  summary: AISummary | null
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  close: []
  retry: []
}>()

// 拖动功能
const isDragging = ref(false)
const currentX = ref(0)
const currentY = ref(0)
const initialX = ref(0)
const initialY = ref(0)
const xOffset = ref(0)
const yOffset = ref(0)
const modalContainer = ref<HTMLElement | null>(null)

const dragStart = (e: MouseEvent | TouchEvent) => {
  const target = e.target as HTMLElement
  // 只在点击 modal-header 时开始拖动
  if (!target.closest('.modal-header')) return

  if (e.type === 'touchstart') {
    const touch = (e as TouchEvent).touches[0]
    initialX.value = touch.clientX - xOffset.value
    initialY.value = touch.clientY - yOffset.value
  } else {
    initialX.value = (e as MouseEvent).clientX - xOffset.value
    initialY.value = (e as MouseEvent).clientY - yOffset.value
  }

  isDragging.value = true
}

const drag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return

  e.preventDefault()

  if (e.type === 'touchmove') {
    const touch = (e as TouchEvent).touches[0]
    currentX.value = touch.clientX - initialX.value
    currentY.value = touch.clientY - initialY.value
  } else {
    currentX.value = (e as MouseEvent).clientX - initialX.value
    currentY.value = (e as MouseEvent).clientY - initialY.value
  }

  xOffset.value = currentX.value
  yOffset.value = currentY.value

  setTranslate(currentX.value, currentY.value)
}

const dragEnd = () => {
  isDragging.value = false
}

const setTranslate = (xPos: number, yPos: number) => {
  if (modalContainer.value) {
    modalContainer.value.style.transform = `translate(${xPos}px, ${yPos}px)`
  }
}

onMounted(() => {
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', dragEnd)
  document.addEventListener('touchmove', drag)
  document.addEventListener('touchend', dragEnd)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', dragEnd)
  document.removeEventListener('touchmove', drag)
  document.removeEventListener('touchend', dragEnd)
})

const getPlatformLabel = (platform: Platform) => {
  const map: Record<Platform, string> = {
    WEIBO: '微博',
    TOUTIAO: '今日头条',
    BILIBILI: 'B站',
    DOUYIN: '抖音',
  }
  return map[platform]
}

const handleClose = () => {
  // 重置位置
  xOffset.value = 0
  yOffset.value = 0
  if (modalContainer.value) {
    modalContainer.value.style.transform = 'translate(0px, 0px)'
  }
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.modal-container {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  cursor: grab;
  user-select: none;
}

.modal-container.is-dragging {
  cursor: grabbing;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
  transform: rotate(90deg);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.modal-content::-webkit-scrollbar {
  width: 10px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #0ea5e9;
  border-radius: 5px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #0284c7;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #666;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e8e8e8;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.retry-btn:hover {
  background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.summary-section {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0 0 16px 0;
}

.summary-text {
  font-size: 15px;
  line-height: 1.8;
  color: #555;
  margin: 0;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.topic-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.topic-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.topic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.topic-name {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.heat-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.heat-high {
  background: #ff4d4f;
  color: #fff;
}

.heat-medium {
  background: #faad14;
  color: #fff;
}

.heat-low {
  background: #52c41a;
  color: #fff;
}

.topic-desc {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin: 0 0 12px 0;
}

.topic-platforms {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.platform-tag {
  padding: 4px 12px;
  background: rgba(14, 165, 233, 0.1);
  color: #0ea5e9;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.insights-list {
  margin: 0;
  padding-left: 24px;
}

.insights-list li {
  font-size: 15px;
  line-height: 1.8;
  color: #555;
  margin-bottom: 12px;
}

.insights-list li:last-child {
  margin-bottom: 0;
}

/* 拖动状态 */
.modal-container.is-dragging {
  transition: none !important;
  cursor: move;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
}

/* 动画效果 */
@keyframes modalBounce {
  0% {
    transform: scale(0.9) translateY(-20px);
  }
  50% {
    transform: scale(1.02) translateY(5px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

.modal-enter-active .modal-container {
  animation: modalBounce 0.5s ease-out;
}

@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-content {
    padding: 20px;
  }

  .topics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
