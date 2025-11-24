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
              <img src="/static/icons/loading.gif" alt="加载中" class="loading-gif" />
              <p>加载中...</p>
            </div>

            <div v-else-if="error" class="modal-loading">
              <img src="/static/icons/loading.gif" alt="加载中" class="loading-gif" />
              <p>加载中...</p>
            </div>

            <div v-else-if="items.length === 0" class="modal-loading">
              <img src="/static/icons/loading.gif" alt="加载中" class="loading-gif" />
              <p>加载中...</p>
            </div>

            <div v-else class="hot-list">
              <div
                v-for="(item, index) in items"
                :key="item.id"
                class="hot-item"
                @click="handleItemClick(item)"
              >
                <span v-if="index >= 3" class="item-rank">{{ index + 1 }}</span>
                <div v-else class="item-rank-container">
                  <img
                    v-if="index === 0"
                    src="/static/icons/1st.png"
                    alt="第1名"
                    class="item-rank-icon rank-1st"
                  />
                  <img
                    v-else-if="index === 1"
                    src="/static/icons/2dn.png"
                    alt="第2名"
                    class="item-rank-icon rank-2nd"
                  />
                  <img
                    v-else-if="index === 2"
                    src="/static/icons/3rd.png"
                    alt="第3名"
                    class="item-rank-icon rank-3rd"
                  />
                </div>
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
  width: 60px;
  height: 60px;
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

.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #666;
}

.loading-gif {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
  object-fit: contain;
}

/* PC端加载样式保持不变 */
@media (min-width: 769px) {
  .modal-loading {
    height: 400px;
  }
  
  .loading-gif {
    width: 100px;
    height: 100px;
    margin-bottom: 20px;
  }
  
  .modal-loading p {
    font-size: 16px;
  }
}

/* 移动端加载样式 - 只占卡片区域 */
@media (max-width: 768px) {
  .modal-loading {
    height: 2rem;
    min-height: 2rem;
  }
  
  .loading-gif {
    width: 0.5rem;
    height: 0.5rem;
    margin-bottom: 0.1rem;
  }
  
  .modal-loading p {
    font-size: 0.14rem;
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
  min-width: 50px;
  height: 50px;
  color: #000;
  font-size: 18px;
  font-weight: 900;
  flex-shrink: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.item-rank-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
}

.item-rank-icon {
  object-fit: contain;
  flex-shrink: 0;
}

.item-rank-icon.rank-1st {
  width: 65px;
  height: 65px;
  margin-left: -5px;
}

.item-rank-icon.rank-2nd {
  width: 60px;
  height: 60px;
  margin-left: -2px;
}

.item-rank-icon.rank-3rd {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-65%, -50%);
  width: 48px;
  height: 48px;
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
  .modal-overlay {
    padding: 0.1rem;
  }

  .modal-container {
    max-width: 75%;
    max-height: 70vh;
    border-radius: 0.2rem;
    width: 75%;
    height: auto;
    margin: 0 auto;
  }

  .modal-header-bar {
    padding: 0.12rem 0.16rem 0;
  }

  .modal-title {
    font-size: 0.16rem;
  }

  .modal-header-text {
    font-size: 0.1rem;
  }

  .hot-item {
    padding: 0.1rem 0.14rem;
    gap: 0.08rem;
  }

  .item-rank {
    min-width: 0.4rem;
    height: 0.4rem;
    font-size: 0.14rem;
  }

  .item-rank-container {
    width: 0.45rem;
    height: 0.45rem;
  }

  .item-rank-icon.rank-1st {
    width: 0.4rem;
    height: 0.4rem;
    margin-left: -0.02rem;
  }

  .item-rank-icon.rank-2nd {
    width: 0.38rem;
    height: 0.38rem;
    margin-left: -0.02rem;
  }

  .item-rank-icon.rank-3rd {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-65%, -50%);
    width: 0.35rem;
    height: 0.35rem;
  }

  .item-platform-icon {
    width: 0.18rem;
    height: 0.18rem;
  }

  .item-title {
    font-size: 0.13rem;
  }

  .item-heat {
    font-size: 0.11rem;
  }

  .item-category {
    font-size: 0.1rem;
  }

  .modal-rank-icon {
    width: 0.5rem;
    height: 0.5rem;
  }
}
</style>
