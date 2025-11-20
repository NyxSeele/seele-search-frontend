<template>
  <Teleport to="body">
    <Transition name="popover">
      <div v-if="visible" class="popover-wrapper" @click="handleClose">
        <div 
          class="popover-container" 
          :style="popoverStyle" 
          @click.stop
          @mousedown="handleMouseDown"
        >
          <button class="popover-close" @click="handleClose">✕</button>

          <div class="popover-content">
            <!-- Loading -->
            <div v-if="loading" class="loading-state">
              <img src="/static/icons/loading.gif" alt="加载中" class="loading-gif" />
              <p>加载中...</p>
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
                <h4 class="section-title">全局分析</h4>
                <p class="summary-text">{{ summary.summary }}</p>
              </div>

              <!-- 核心话题 -->
              <div
                v-if="summary.coreTopics && summary.coreTopics.length > 0"
                class="summary-section"
              >
                <h4 class="section-title">核心话题</h4>
                <div class="topics-list">
                  <div
                    v-for="(topic, index) in summary.coreTopics.slice(0, 3)"
                    :key="index"
                    class="topic-item"
                  >
                    <div class="topic-header">
                      <span class="topic-name">{{ topic.topic }}</span>
                    </div>
                    <p class="topic-desc">{{ topic.description }}</p>
                  </div>
                </div>
              </div>

              <!-- 跨平台洞察 -->
              <div
                v-if="summary.crossPlatformInsights && summary.crossPlatformInsights.length > 0"
                class="summary-section"
              >
                <h4 class="section-title">跨平台洞察</h4>
                <ul class="insights-list">
                  <li
                    v-for="(insight, index) in summary.crossPlatformInsights.slice(0, 3)"
                    :key="index"
                  >
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
import { computed, ref, watch, nextTick } from 'vue'
import type { AISummary } from '@/types'

const props = defineProps<{
  visible: boolean
  title: string
  summary: AISummary | null
  loading?: boolean
  error?: string
  triggerElement?: HTMLElement | null
}>()

const emit = defineEmits<{
  close: []
  retry: []
}>()

const popoverStyle = ref({})
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const position = ref({ x: 0, y: 0 })

const handleClose = () => {
  emit('close')
}

const handleMouseDown = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('.popover-close, .popover-content')) {
    return
  }
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
  updatePopoverStyle()
}

const handleMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

const updatePopoverStyle = () => {
  const viewportHeight = window.innerHeight
  const popoverWidth = Math.min(600, window.innerWidth - 40)
  const popoverHeight = Math.min(Math.max(400, viewportHeight * 0.7), viewportHeight - 100)
  
  popoverStyle.value = {
    width: `${popoverWidth}px`,
    maxHeight: `${popoverHeight}px`,
    transform: `translate(${position.value.x}px, ${position.value.y}px)`,
    cursor: isDragging.value ? 'grabbing' : 'grab'
  }
}

// Calculate popover position - center it on screen for better UX
watch(
  () => props.visible,
  async (newVal) => {
    if (newVal) {
      await nextTick()
      position.value = { x: 0, y: 0 }
      updatePopoverStyle()
    }
  },
)
</script>

<style scoped>
.popover-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.popover-container {
  background: url('/static/images/card.png') no-repeat center center;
  background-size: 100% 100%;
  border: none;
  border-radius: 24px;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  max-height: 85vh;
  position: relative;
  transition: transform 0.1s ease-out;
  user-select: none;
}

.popover-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.popover-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
  transform: rotate(90deg);
}

.popover-content {
  overflow-y: auto;
  padding: 24px;
  flex: 1;
  min-height: 200px;
  background: transparent;
}

.popover-content::-webkit-scrollbar {
  width: 8px;
}

.popover-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.popover-content::-webkit-scrollbar-thumb {
  background: #0ea5e9;
  border-radius: 4px;
}

.popover-content::-webkit-scrollbar-thumb:hover {
  background: #0284c7;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #666;
}

.loading-gif {
  width: 60px;
  height: 60px;
  margin-bottom: 12px;
  object-fit: contain;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e8e8e8;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
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
  margin-top: 12px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  color: #fff;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
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
  gap: 20px;
}

.summary-section {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(148, 112, 80, 0.25);
  backdrop-filter: blur(6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #4b3829;
  margin: 0 0 12px 0;
}

.summary-text {
  font-size: 14px;
  line-height: 1.7;
  color: #4b3829;
  margin: 0;
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topic-item {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba(148, 112, 80, 0.2);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
}

.topic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.topic-name {
  font-size: 14px;
  font-weight: 700;
  color: #4b3829;
}

.topic-desc {
  font-size: 13px;
  line-height: 1.6;
  color: #564331;
  margin: 0;
}

.insights-list {
  margin: 0;
  padding-left: 20px;
}

.insights-list li {
  font-size: 14px;
  line-height: 1.7;
  color: #4b3829;
  margin-bottom: 8px;
}

.insights-list li:last-child {
  margin-bottom: 0;
}

/* Popover Transitions */
.popover-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.popover-leave-active {
  transition: all 0.25s ease;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
}

.popover-enter-from .popover-container {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}

.popover-leave-to .popover-container {
  transform: scale(0.95);
  opacity: 0;
}

@media (max-width: 768px) {
  .popover-wrapper {
    padding: 10px;
  }

  .popover-container {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 16px;
  }

  .popover-content {
    padding: 16px;
  }
}
</style>
