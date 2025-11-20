<template>
  <div class="ranking-list">
    <!-- Loading -->
    <div v-if="loading" class="list-loading">
      <img src="/static/icons/loading.gif" alt="加载中" class="loading-gif" />
      <p>加载中...</p>
    </div>

    <!-- Error - Show loading instead -->
    <div v-else-if="error" class="list-loading">
      <img src="/static/icons/loading.gif" alt="加载中" class="loading-gif" />
      <p>加载中...</p>
    </div>

    <!-- Empty - Show loading instead -->
    <div v-else-if="items.length === 0" class="list-loading">
      <img src="/static/icons/loading.gif" alt="加载中" class="loading-gif" />
      <p>加载中...</p>
    </div>

    <!-- List -->
    <div v-else class="ranking-table">
      <div class="table-header">
        <div class="header-rank">排名</div>
        <div class="header-title">热点</div>
        <div class="header-heat">热度</div>
        <div class="header-platform">平台</div>
      </div>
      <div class="table-body">
        <div
          v-for="(item, index) in visibleItems"
          :key="item.id"
          class="table-row"
          @click="handleItemClick(item)"
        >
          <div class="col-rank">
            <span class="rank-number" :class="getRankClass(index)">{{ index + 1 }}</span>
          </div>
          <div class="col-title">
            <span class="title-text">{{ item.title }}</span>
          </div>
          <div class="col-heat">
            <span class="heat-value" :class="getHeatLevelClass(item.heat, item.platform)">
              {{ formatHeat(item.heat) }}
            </span>
          </div>
          <div class="col-platform">
            <div class="platform-icon-wrapper">
              <img
                :src="getPlatformIcon(item.platform)"
                :alt="getPlatformLabel(item.platform)"
                class="platform-icon"
              />
            </div>
          </div>
        </div>
        <button
          v-if="showViewAllButton"
          class="inline-view-all"
          type="button"
          @click.stop="handleViewAllClick"
        >
          <img src="/static/icons/add.png" alt="查看全部" class="view-all-icon" />
          <span>查看全部</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Platform } from '@/types'
import type { HotSearchItem } from '@/types'
import { formatHeat, getHeatLevelClass } from '@/utils/formatHeat'

const props = defineProps<{
  items: HotSearchItem[]
  loading?: boolean
  error?: string
  maxVisible?: number
}>()

const emit = defineEmits<{
  'view-all': []
}>()

const getLimit = () => props.maxVisible ?? 6

const visibleItems = computed(() => props.items.slice(0, getLimit()))
const showViewAllButton = computed(() => !props.loading && props.items.length > getLimit())

const handleViewAllClick = () => {
  emit('view-all')
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
</script>

<style scoped>
.ranking-list {
  width: 100%;
}

.list-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #666;
}

.loading-gif {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  object-fit: contain;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f0f0f0;
  border-top-color: #667eea;
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

.ranking-table {
  width: 100%;
  background: url('/static/images/card.png') no-repeat center center;
  background-size: 100% 100%;
  border: none;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.table-header {
  display: grid;
  grid-template-columns: 80px 1fr 140px 140px;
  padding: 20px 28px;
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 16px;
  font-weight: 700;
  color: #555;
}

.header-rank {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.header-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
}

.header-heat {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 8px 0 18px;
}

.header-platform {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px 0 0;
}

.table-body {
  background: transparent;
  position: relative;
  padding-bottom: 16px;
}

.inline-view-all {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translate(-50%, 0);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 700;
  color: #1f2933;
  cursor: pointer;
  animation: inlinePulse 2.5s ease-in-out infinite;
  transition: all 0.3s ease;
}

.inline-view-all:hover {
  transform: translate(-50%, -2px);
  color: #0f172a;
  animation: none;
}

.view-all-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

@keyframes inlinePulse {
  0%,
  100% {
    transform: translate(-50%, 0) scale(1);
  }
  50% {
    transform: translate(-50%, 0) scale(0.94);
  }
}

.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 140px 140px;
  padding: 20px 28px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: radial-gradient(ellipse at 0% 50%, rgba(255, 248, 220, 0.6) 0%, rgba(255, 253, 208, 0.3) 20%, rgba(255, 255, 240, 0.15) 40%, transparent 60%);
  transform: translateX(4px);
}

.col-rank {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  font-size: 18px;
  font-weight: 900;
  color: #888;
}

.rank-number.rank-1 {
  color: #ff4757;
  font-size: 24px;
}

.rank-number.rank-2 {
  color: #ff7f50;
  font-size: 22px;
}

.rank-number.rank-3 {
  color: #ffa502;
  font-size: 21px;
}

.col-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  padding: 0 12px;
}

.title-text {
  font-size: 16px;
  color: #2c3e50;
  line-height: 1.6;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.col-heat {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 8px;
}

.heat-value {
  font-size: 14px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.heat-value.heat-high {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.heat-value.heat-medium {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.heat-value.heat-low {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.heat-value.heat-none {
  color: #999;
  background: rgba(153, 153, 153, 0.1);
}

.col-platform {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.platform-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.7));
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.platform-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
}

.table-row:hover .platform-icon-wrapper {
  transform: scale(1.08);
}

@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 45px 1fr 85px 70px;
    padding: 12px 12px;
  }

  .table-header {
    font-size: 13px;
  }

  .rank-number {
    min-width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .rank-number.rank-1 {
    font-size: 16px;
  }

  .rank-number.rank-2 {
    font-size: 15px;
  }

  .title-text {
    font-size: 14px;
  }
}
</style>
