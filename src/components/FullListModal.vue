<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleClose">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">{{ platformConfig.name }} 完整榜单</h2>
            <button class="modal-close" @click="handleClose">✕</button>
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
                    <span 
                      v-if="item.platform" 
                      class="item-platform"
                      :style="{ 
                        borderColor: PLATFORM_CONFIG[item.platform]?.color || '#667eea',
                        color: PLATFORM_CONFIG[item.platform]?.color || '#667eea'
                      }"
                    >
                      {{ getPlatformName(item.platform) }}
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
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { HotSearchItem, Platform } from '@/types'
import { formatHeat, getHeatLevelClass } from '@/utils/formatHeat'
import { getCategoryName, getPlatformName } from '@/utils/categoryMapper'

const props = defineProps<{
  visible: boolean
  platform: Platform
  items: HotSearchItem[]
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const PLATFORM_CONFIG = {
  WEIBO: { name: '微博', color: '#E1306C' },
  TOUTIAO: { name: '今日头条', color: '#FF4757' },  // 橙红色，与微博粉红色区分
  BILIBILI: { name: 'Bilibili', color: '#64B5F6' },  // 浅蓝色
  DOUYIN: { name: '抖音', color: '#000' },
  AGGREGATE: { name: '全平台', color: '#667eea' },
}

const platformConfig = computed(() => PLATFORM_CONFIG[props.platform] || PLATFORM_CONFIG.AGGREGATE)

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
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  max-width: 700px;
  width: 100%;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: #f8f9fa;
}

.modal-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: 0.5px;
}

.modal-close {
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
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
  transform: rotate(90deg);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  min-height: 300px;
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
  padding: 12px 0;
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
  background: rgba(102, 126, 234, 0.05);
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
  transition: opacity 0.3s ease;
}

.hot-item:hover::before {
  opacity: 1;
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
