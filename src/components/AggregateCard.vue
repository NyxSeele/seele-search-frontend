<template>
  <div class="aggregate-card">
    <div class="card-header">
      <h3 class="card-title">全平台聚合</h3>
      <div class="card-actions">
        <button
          ref="aiBtn"
          class="action-btn ai-btn"
          title="AI总结"
          @click.stop="handleAISummaryClick"
        >
          🤖
        </button>
        <button class="action-btn" title="刷新" @click.stop="$emit('refresh')">↻</button>
        <button class="action-btn" title="分享" @click.stop="handleShare">↑</button>
      </div>
    </div>

    <div class="card-content">
      <!-- List or loading state -->
      <div v-if="items.length > 0" class="hot-list">
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
              <span class="item-platform" :style="{ color: getPlatformColor(item.platform) }">
                {{ getPlatformLabel(item.platform) }}
              </span>
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

    <div v-if="showViewAll && items.length > 0" class="card-footer" @click="$emit('view-all')">
      <span>查看全部</span>
      <span class="arrow">→</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HotSearchItem, Platform } from '@/types'
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

const handleAISummaryClick = () => {
  if (aiBtn.value) {
    emit('ai-summary', aiBtn.value)
  }
}

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
    [Platform.BILIBILI]: '#64B5F6',  // 浅蓝色
    [Platform.DOUYIN]: '#000',
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
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 28px;
  box-shadow: 0 12px 48px rgba(102, 126, 234, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.aggregate-card:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 64px rgba(102, 126, 234, 0.35);
  transform: translateY(-6px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%);
  backdrop-filter: blur(15px);
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
}

.card-title {
  font-size: 17px;
  font-weight: 900;
  margin: 0;
  flex: 1;
  color: #1a1a1a;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
  letter-spacing: 0.5px;
}

.card-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.action-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  color: #555;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
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
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  color: #fff;
  font-size: 13px;
}

.action-btn.ai-btn:hover {
  background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%);
  color: #fff;
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
  padding: 8px 0;
}

.hot-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 20px;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  font-size: 14px;
  color: #1a1a1a;
  line-height: 1.5;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.item-meta {
  display: flex;
  gap: 4px;
  font-size: 11px;
  align-items: center;
  flex-wrap: wrap;
}

.item-platform {
  font-weight: 700;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  border: 1.5px solid currentColor;
}

.item-category {
  color: #666;
  background: rgba(255, 255, 255, 0.6);
  padding: 2px 8px;
  border-radius: 10px;
}

.item-heat {
  font-size: 11px;
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
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.card-footer:hover {
  background: rgba(255, 255, 255, 0.5);
  color: #1a252f;
}

.arrow {
  transition: transform 0.3s ease;
}

.card-footer:hover .arrow {
  transform: translateX(4px);
}
</style>
