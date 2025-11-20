<template>
  <div class="aggregate-card">
    <div class="card-header">
      <div class="dashboard-icon"></div>
      <div class="card-actions">
        <button
          ref="aiBtn"
          class="action-btn ai-btn"
          :class="{
            'icon-thinking': currentIcon === 'thinking',
            'icon-log': currentIcon === 'log',
          }"
          :style="{ opacity: iconOpacity }"
          title="AI总结"
          @click.stop="handleAISummaryClick"
        >
          AI
        </button>
        <button class="action-btn refresh-btn" title="刷新" @click.stop="$emit('refresh')">
          <span class="refresh-icon">↻</span>
        </button>
        <button class="action-btn share-btn-icon" title="分享" @click.stop="handleShare"></button>
      </div>
    </div>

    <div class="card-content">
      <!-- Loading -->
      <div v-if="loading" class="card-loading">
        <img src="/static/icons/loading.gif" alt="加载中" class="loading-gif" />
        <p>加载中...</p>
      </div>

      <!-- Error - Show loading instead -->
      <div v-else-if="error" class="card-loading">
        <img src="/static/icons/loading.gif" alt="加载中" class="loading-gif" />
        <p>加载中...</p>
      </div>

      <!-- Empty - Show loading instead -->
      <div v-else-if="items.length === 0" class="card-loading">
        <img src="/static/icons/loading.gif" alt="加载中" class="loading-gif" />
        <p>加载中...</p>
      </div>

      <!-- List -->
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
                :src="getPlatformIcon(item.platform)"
                :alt="getPlatformLabel(item.platform)"
                class="item-platform-icon"
              />
              <span v-if="item.category" class="item-category">{{
                getCategoryName(item.category)
              }}</span>
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

    <div v-if="showViewAll && items.length > 0" class="card-footer" @click="$emit('view-all')">
      <img src="/static/icons/add.png" alt="查看全部" class="card-footer-icon" />
      <span>查看全部</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { HotSearchItem } from '@/types'
import { Platform } from '@/types'
import { formatHeat, getHeatLevelClass } from '@/utils/formatHeat'
import { getCategoryName } from '@/utils/categoryMapper'

defineProps<{
  items: HotSearchItem[]
  loading?: boolean
  error?: string
  showViewAll?: boolean
}>()

const emit = defineEmits<{
  'view-all': []
  refresh: []
  'ai-summary': [element: HTMLElement]
}>()

const aiBtn = ref<HTMLElement | null>(null)
const currentIcon = ref<'thinking' | 'log'>('thinking')
const iconOpacity = ref(1)
let iconTimer: ReturnType<typeof setInterval> | null = null

const handleAISummaryClick = () => {
  if (aiBtn.value) {
    emit('ai-summary', aiBtn.value)
  }
}

const switchIcon = () => {
  // 渐隐
  iconOpacity.value = 0
  setTimeout(() => {
    // 切换图标
    currentIcon.value = currentIcon.value === 'thinking' ? 'log' : 'thinking'
    // 渐显
    setTimeout(() => {
      iconOpacity.value = 1
    }, 50) // 短暂延迟确保图标切换完成
  }, 800) // 渐隐动画时间，与CSS transition时间一致
}

onMounted(() => {
  // 第一个图标显示5秒后开始切换
  setTimeout(() => {
    switchIcon()
    // 之后每6.6秒切换一次（5秒显示 + 0.8秒渐隐 + 0.8秒渐显）
    iconTimer = setInterval(switchIcon, 6600)
  }, 5000)
})

onBeforeUnmount(() => {
  if (iconTimer) {
    clearInterval(iconTimer)
  }
})

const getRankClass = (index: number) => {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}

const getPlatformLabel = (platform: Platform) => {
  const map: Record<Platform, string> = {
    [Platform.WEIBO]: '微博',
    [Platform.TOUTIAO]: '今日头条',
    [Platform.BILIBILI]: 'Bilibili',
    [Platform.DOUYIN]: '抖音',
  }
  return map[platform]
}

const getPlatformColor = (platform: Platform) => {
  const map: Record<Platform, string> = {
    [Platform.WEIBO]: '#E1306C',
    [Platform.TOUTIAO]: '#FF4757',
    [Platform.BILIBILI]: '#64B5F6', // 浅蓝色
    [Platform.DOUYIN]: '#000',
  }
  return map[platform]
}

const getPlatformIcon = (platform: Platform) => {
  const map: Record<Platform, string> = {
    [Platform.WEIBO]: '/static/icons/weibo.jpg',
    [Platform.TOUTIAO]: '/static/icons/toutiao.png',
    [Platform.BILIBILI]: '/static/icons/bilibili.png',
    [Platform.DOUYIN]: '/static/icons/doyin.png',
  }
  return map[platform]
}

const handleItemClick = (item: HotSearchItem) => {
  if (item.url) {
    window.open(item.url, '_blank')
  }
}

const handleShare = async () => {
  const shareText = '我在查看全平台聚合热搜，快来看看吧！'

  if (navigator.share) {
    try {
      await navigator.share({
        title: '全平台热搜聚合',
        text: shareText,
        url: window.location.href,
      })
    } catch (err) {
      console.log('Share failed:', err)
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('链接已复制到剪贴板')
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }
}
</script>

<style scoped>
.aggregate-card {
  background: url('/static/images/card.png') no-repeat center center;
  background-size: 100% 100%;
  border: none;
  border-radius: 28px;
  box-shadow: 0 12px 48px rgba(102, 126, 234, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.aggregate-card:hover {
  box-shadow: 0 16px 64px rgba(102, 126, 234, 0.35);
  transform: translateY(-6px);
  filter: brightness(1.02);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
}

.dashboard-icon {
  width: 100px;
  height: 40px;
  background: url('/static/icons/main.png') no-repeat left center;
  background-size: contain;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  color: #555;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  line-height: 1;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #2c3e50;
  transform: scale(1.1);
}

.action-btn.ai-btn {
  background-color: transparent;
  color: transparent;
  font-size: 0;
  width: 44px;
  height: 44px;
  transition:
    opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.2s ease;
}

.action-btn.ai-btn.icon-thinking {
  background: url('/static/icons/thinking.png') no-repeat center center;
  background-size: 34px 34px;
}

.action-btn.ai-btn.icon-log {
  background: url('/static/icons/log.png') no-repeat center center;
  background-size: 34px 34px;
}

.action-btn.ai-btn:hover {
  background-color: transparent;
  background-size: 36px 36px;
  background-position: center center;
  background-repeat: no-repeat;
  transform: scale(1.1);
}

.refresh-btn {
  background: url('/static/icons/gold banner2.png') no-repeat center center !important;
  background-size: 100% 100% !important;
  background-color: transparent !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  transition: all 0.2s ease;
  cursor: pointer;
  color: #ffffff !important;
}

.refresh-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px) scale(1.1);
  background: url('/static/icons/gold banner2.png') no-repeat center center !important;
  background-size: 100% 100% !important;
}

.refresh-btn:active {
  transform: translateY(0);
}

.refresh-icon {
  font-size: 18px;
  color: #ffffff;
  font-weight: bold;
  line-height: 1;
  pointer-events: none;
}

.share-btn-icon {
  background: transparent !important;
  background-image: url('/static/icons/share.png') !important;
  background-repeat: no-repeat !important;
  background-position: center center !important;
  background-size: 30px 30px !important;
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  border: none !important;
  box-shadow: none !important;
}

.share-btn-icon:hover {
  background-color: transparent !important;
  background-image: url('/static/icons/share.png') !important;
}

.card-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  background: transparent;
}

/* 隐藏滚动条但保持滚动功能 */
.card-content::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.card-content::-webkit-scrollbar-track {
  display: none;
}

.card-content::-webkit-scrollbar-thumb {
  display: none;
}

/* Firefox */
.card-content {
  scrollbar-width: none;
}

/* IE and Edge */
.card-content {
  -ms-overflow-style: none;
}

.card-loading,
.card-error,
.card-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.loading-gif {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  object-fit: contain;
}

.loading-spinner {
  width: 56px;
  height: 56px;
  border: 5px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.8);
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

.hot-list {
  padding: 2px 0;
}

.hot-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 20px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
}

.hot-item:last-child {
  border-bottom: none;
}

.hot-item:hover {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.12) 0%, rgba(255, 255, 255, 0.4) 100%);
  transform: translateX(8px);
}

.hot-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #ff77b76d 0%, #c4507b97 100%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.hot-item:hover::before {
  opacity: 1;
}

.item-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, rgba(100, 100, 100, 0.2) 0%, rgba(80, 80, 80, 0.15) 100%);
  color: #555;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 900;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.item-rank.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(255, 215, 0, 0.5);
  transform: scale(1.1);
}

.item-rank.rank-2 {
  background: linear-gradient(135deg, #e8e8e8 0%, #b8b8b8 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(192, 192, 192, 0.5);
  transform: scale(1.05);
}

.item-rank.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(205, 127, 50, 0.5);
  transform: scale(1.02);
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
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-weight: 600;
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
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 4px;
}

.item-category {
  color: #666;
  background: rgba(255, 255, 255, 0.6);
  padding: 2px 8px;
  border-radius: 10px;
}

.item-heat {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.item-heat.heat-high {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.item-heat.heat-medium {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.item-heat.heat-low {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.item-heat.heat-none {
  color: #999;
  background: rgba(153, 153, 153, 0.1);
}

.card-footer {
  padding: 6px 12px;
  background: transparent;
  border-top: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: #1f2933;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.3s ease;
  margin: 6px auto;
  border-radius: 18px;
  box-shadow: none;
  animation: strongPulse 2.5s ease-in-out infinite;
}

.card-footer:hover {
  background: transparent;
  color: #0f172a;
  transform: translateY(-2px);
  box-shadow: none;
  animation: none;
}

@keyframes strongPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.94);
  }
}

.card-footer-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
</style>
