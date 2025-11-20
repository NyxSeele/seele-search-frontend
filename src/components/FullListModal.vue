<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleClose">
        <div class="modal-container" @click.stop>
          <div class="modal-header-bar">
            <div class="modal-title-block">
              <img src="/static/icons/rank.png" alt="Rank" class="modal-rank-icon" />
              <div class="modal-title">{{ modalTitle }}</div>
              <div class="modal-header-text">更新于：{{ updateTimeText }}</div>
            </div>
            <button class="modal-close-btn" @click="handleClose" aria-label="关闭">
              ✕
            </button>
          </div>
          <div class="modal-content">
            <div v-if="loading" class="modal-loading">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>

            <div v-else-if="error" class="modal-error">
              <p>{{ error }}</p>
            </div>

            <div v-else-if="items.length === 0" class="modal-empty">
              <p>暂无数据</p>
            </div>

            <div v-else class="hot-list">
              <div
                v-for="(item, index) in items"
                :key="item.id"
                class="hot-item"
                @click="handleItemClick(item)"
              >
                <span class="item-rank" :class="getRankClass(index)">{{ index + 1 }}</span>
                <div class="item-content">
                  <div class="item-title">{{ item.title }}</div>
                  <div class="item-meta">
                    <img
                      v-if="item.platform && shouldShowPlatformIcon"
                      :src="getPlatformIcon(item.platform)"
                      :alt="getPlatformName(item.platform)"
                      class="item-platform-icon"
                    />
                    <span v-if="item.category" class="item-category">{{ getCategoryName(item.category) }}</span>
                    <span
                      v-if="item.heat > 0"
                      class="item-heat"
                      :class="getHeatLevelClass(item.heat, item.platform)"
                    >
                      {{ formatHeat(item.heat) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { Platform } from '@/types'
import type { HotSearchItem } from '@/types'
import { formatHeat, getHeatLevelClass } from '@/utils/formatHeat'
import { getCategoryName, getPlatformName } from '@/utils/categoryMapper'

type ModalPlatform = Platform | 'AGGREGATE' | 'CATEGORY'

const props = defineProps<{
  visible: boolean
  platform: ModalPlatform
  items: HotSearchItem[]
  loading?: boolean
  error?: string
  title?: string
  showPlatformIcon?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const PLATFORM_CONFIG: Record<ModalPlatform, { name: string; color: string }> = {
  WEIBO: { name: '微博', color: '#E1306C' },
  TOUTIAO: { name: '今日头条', color: '#FF4757' },  // 橙红色，与微博粉红色区分
  BILIBILI: { name: 'Bilibili', color: '#64B5F6' },  // 浅蓝色
  DOUYIN: { name: '抖音', color: '#000' },
  AGGREGATE: { name: '全平台', color: '#667eea' },
  CATEGORY: { name: '分类', color: '#7c3aed' },
}

const platformConfig = computed(() => PLATFORM_CONFIG[props.platform] || PLATFORM_CONFIG.AGGREGATE)
const modalTitle = computed(() => props.title || `${platformConfig.value.name}热搜榜`)
const shouldShowPlatformIcon = computed(() => {
  if (typeof props.showPlatformIcon === 'boolean') {
    return props.showPlatformIcon
  }
  return props.platform === 'AGGREGATE' || props.platform === 'CATEGORY'
})

const getPlatformIcon = (platform: Platform) => {
  const map: Record<Platform, string> = {
    [Platform.WEIBO]: '/static/icons/weibo.jpg',
    [Platform.TOUTIAO]: '/static/icons/toutiao.png',
    [Platform.BILIBILI]: '/static/icons/bilibili.png',
    [Platform.DOUYIN]: '/static/icons/doyin.png',
  }
  return map[platform]
}

const getRankClass = (index: number) => {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}

const handleItemClick = (item: HotSearchItem) => {
  if (item.url) {
    window.open(item.url, '_blank')
  }
}

const handleClose = () => {
  emit('close')
}

// 更新时间显示
const updateTimeText = ref('刚刚')
let updateTimer: ReturnType<typeof setInterval> | null = null
let secondsElapsed = 0

const updateTimeDisplay = () => {
  secondsElapsed++
  if (secondsElapsed < 60) {
    updateTimeText.value = `${secondsElapsed}秒前`
  } else if (secondsElapsed < 3600) {
    const minutes = Math.floor(secondsElapsed / 60)
    updateTimeText.value = `${minutes}分钟前`
  } else {
    const hours = Math.floor(secondsElapsed / 3600)
    updateTimeText.value = `${hours}小时前`
  }
}

onMounted(() => {
  secondsElapsed = 0
  updateTimeText.value = '刚刚'
  updateTimer = setInterval(updateTimeDisplay, 1000)
})

onBeforeUnmount(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.modal-container {
  background: url('/static/images/card.png') no-repeat center center;
  background-size: 100% 100%;
  border: none;
  border-radius: 28px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.modal-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  gap: 16px;
  position: relative;
}

.modal-title-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  flex: 1;
  position: relative;
}

.modal-rank-icon {
  position: absolute;
  left: -5px;
  top: 70%;
  transform: translateY(-50%);
  width: 90px;
  height: 90px;
  object-fit: contain;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2933;
  text-align: center;
}

.modal-close-btn {
  position: static;
  width: 38px;
  height: 38px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  font-size: 22px;
  color: #555;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #fff;
  color: #1f2933;
  transform: rotate(90deg) scale(1.05);
}

.modal-header-text {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  background: transparent;
  padding: 0;
  border-radius: 0;
  backdrop-filter: none;
  width: fit-content;
  text-align: center;
  margin: 0 auto;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 300px;
  margin-top: 24px;
  padding-bottom: 20px;
}

/* 隐藏滚动条但保持滚动功能 */
.modal-content::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.modal-content::-webkit-scrollbar-track {
  display: none;
}

.modal-content::-webkit-scrollbar-thumb {
  display: none;
}

/* Firefox */
.modal-content {
  scrollbar-width: none;
}

/* IE and Edge */
.modal-content {
  -ms-overflow-style: none;
}

.modal-loading,
.modal-error,
.modal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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

.hot-list {
  padding: 12px 0 20px 0;
}

.hot-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
}

.hot-item:last-child {
  border-bottom: none;
}

.hot-item:hover {
  background: radial-gradient(ellipse at 0% 50%, rgba(255, 248, 220, 0.5) 0%, rgba(255, 253, 208, 0.25) 20%, rgba(255, 255, 240, 0.12) 40%, transparent 60%);
  transform: translateX(8px);
}

.item-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 35px;
  height: 35px;
  background: rgba(0, 0, 0, 0.05);
  color: #555;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 900;
  flex-shrink: 0;
  border: 2px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.item-rank.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.5);
  border: 2px solid #ffd700;
  transform: scale(1.1);
}

.item-rank.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(192, 192, 192, 0.5);
  border: 2px solid #c0c0c0;
  transform: scale(1.08);
}

.item-rank.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(205, 127, 50, 0.5);
  border: 2px solid #cd7f32;
  transform: scale(1.05);
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 15px;
  color: #1a1a1a;
  line-height: 1.5;
  margin-bottom: 6px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.item-meta {
  display: flex;
  gap: 4px;
  font-size: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.item-platform-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  display: block;
}

.item-platform {
  color: #fff;
  background: transparent;
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 11px;
  border: 2px solid;
}

.item-category {
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.item-heat {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: 1px solid;
}

.item-heat.heat-high {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

.item-heat.heat-medium {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.2);
}

.item-heat.heat-low {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
}

.item-heat.heat-none {
  color: #999;
  background: rgba(153, 153, 153, 0.08);
  border-color: rgba(153, 153, 153, 0.15);
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
}

@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 20px;
  }

  .modal-title {
    font-size: 18px;
  }

  .hot-item {
    padding: 12px 20px;
  }
}
</style>
