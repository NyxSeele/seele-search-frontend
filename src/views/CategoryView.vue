<template>
  <div class="category-page">
    <div class="animated-overlay"></div>
    <Navbar />

    <main class="page-content">
      <div class="page-header">
        <h1 class="page-title">{{ categoryInfo.name }}热搜</h1>
      </div>

      <!-- Category Icon -->
      <div class="category-icon-wrapper">
        <img :src="`/static/icons/${getCategoryIconName(categoryInfo.id)}.png`" :alt="categoryInfo.name" class="category-icon" />
      </div>

      <!-- 排行榜 + AI总结按钮 -->
      <div class="ranking-wrapper">
        <div class="ranking-header">
          <div class="refresh-info">
            <span class="last-update">更新于：{{ lastUpdateText }}前</span>
          </div>
          <div class="action-buttons">
            <button class="refresh-btn" @click="handleManualRefresh" :disabled="loading" title="手动刷新">
              <img v-if="loading" src="/static/icons/loading.gif" alt="加载中" class="loading-icon" />
              <span v-else class="refresh-icon">↻</span>
              <span v-if="!loading" class="refresh-text">刷新</span>
            </button>
            <button ref="aiBtn" class="ai-summary-btn" @click="toggleAISummary" :disabled="aiLoading">
              <span class="btn-icon"></span>
              <span class="btn-text">AI总结</span>
            </button>
          </div>
        </div>
        <div class="ranking-section">
          <RankingList
            :items="items"
            :loading="loading"
            :error="error"
            :max-visible="5"
            @view-all="openFullRanking"
          />
        </div>
      </div>

      <!-- AI总结弹窗 -->
      <AISummaryPopover
        :visible="showAISummary"
        :title="`${categoryInfo.name}热搜AI总结`"
        :summary="aiSummary"
        :loading="aiLoading"
        :error="aiError"
        :trigger-element="aiBtn"
        @close="showAISummary = false"
        @retry="loadAISummary"
      />
      <FullListModal
        :visible="fullListVisible"
        platform="CATEGORY"
        :title="`${categoryInfo.name}热搜榜`"
        :items="items"
        :loading="loading"
        :error="error"
        :show-platform-icon="true"
        @close="closeFullRanking"
      />
    </main>

    <!-- AI提问悬浮按钮 -->
    <div 
      class="qna-fab-container" 
      :style="{ transform: `translate(${qnaFabPosition.x}px, ${qnaFabPosition.y}px)` }"
      @mousedown="handleQnaMouseDown"
      @mouseenter="handleQnaMouseEnter"
    >
      <button class="qna-fab" @click="handleQnaClick" title="AI智能问答">
        <img src="/static/icons/thinking.png" alt="AI" class="fab-icon-img" />
      </button>
      <div v-if="showQnaTooltip" class="qna-tooltip">{{ qnaPanelVisible ? '点我也可以关闭提问哦' : '有什么问题都可以点我哦' }}</div>
    </div>

    <!-- QNA面板 -->
    <QNAPanel :visible="qnaPanelVisible" @close="qnaPanelVisible = false" />

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import RankingList from '@/components/RankingList.vue'
import QNAPanel from '@/components/QNAPanel.vue'
import AISummaryPopover from '@/components/AISummaryPopover.vue'
import FullListModal from '@/components/FullListModal.vue'
import Footer from '@/components/Footer.vue'
import { CATEGORIES } from '@/constants/categories'
import type { HotSearchItem, AISummary } from '@/types'
import hotSearchApi from '@/api/hotSearch'
import aiApi from '@/api/ai'
import { sortByAggregateScore } from '@/utils/aggregateRanking'

const route = useRoute()
const items = ref<HotSearchItem[]>([])
const loading = ref(false)
const error = ref('')

// 刷新相关状态
const lastUpdateTime = ref<Date | null>(null)
const lastUpdateText = ref('未更新')

// AI总结相关
const aiSummary = ref<AISummary | null>(null)
const aiLoading = ref(false)
const aiError = ref('')
const showAISummary = ref(false)
const aiBtn = ref<HTMLElement | null>(null)
const fullListVisible = ref(false)

// QNA面板
const qnaPanelVisible = ref(false)

// QNA按钮拖动
const qnaFabPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const hasDragged = ref(false)
const DRAG_THRESHOLD = 6
const showQnaTooltip = ref(true)
let tooltipHideTimer: number | null = null

const handleQnaMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  hasDragged.value = false
  dragStart.value = { x: e.clientX - qnaFabPosition.value.x, y: e.clientY - qnaFabPosition.value.y }
  document.addEventListener('mousemove', handleQnaMouseMove)
  document.addEventListener('mouseup', handleQnaMouseUp)
}

const handleQnaMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  const nextPosition = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
  const deltaX = nextPosition.x - qnaFabPosition.value.x
  const deltaY = nextPosition.y - qnaFabPosition.value.y
  if (!hasDragged.value) {
    const movedEnough = Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD
    if (movedEnough) {
      hasDragged.value = true
    }
  }
  if (hasDragged.value) {
    qnaFabPosition.value = nextPosition
  }
}

const handleQnaMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleQnaMouseMove)
  document.removeEventListener('mouseup', handleQnaMouseUp)
}

const handleQnaClick = () => {
  // 只有在没有拖动的情况下才切换面板
  if (hasDragged.value) {
    hasDragged.value = false
    return
  }
  qnaPanelVisible.value = !qnaPanelVisible.value
  hideTooltipTemporarily()
}

const handleQnaMouseEnter = () => {
  hideTooltipTemporarily()
}

const hideTooltipTemporarily = () => {
  showQnaTooltip.value = false
  if (tooltipHideTimer) {
    clearTimeout(tooltipHideTimer)
  }
  tooltipHideTimer = window.setTimeout(() => {
    showQnaTooltip.value = true
  }, 10000)
}

const categoryInfo = computed(() => {
  const categoryId = route.meta.category as string
  const found = CATEGORIES.find((cat) => cat.id === categoryId)
  return (
    found || {
      id: '',
      name: '未知',
      icon: '❓',
      color: '#999',
      bgColor: '#f5f5f5',
      description: '未知分类',
    }
  )
})

// 映射category id到图片文件名
const getCategoryIconName = (categoryId: string): string => {
  const iconMap: Record<string, string> = {
    'entertainment': 'reaction',
    'tech': 'technology',
    'economy': 'economics',
    'politics': 'politics',
    'culture': 'culture',
    'sports': 'sports',
    'society': 'society',
    'military': 'military',
  }
  return iconMap[categoryId] || categoryId
}

const loadData = async (silent = false) => {
  if (!silent) {
    loading.value = true
  }
  error.value = ''
  try {
    // 使用英文category ID而不是中文categoryName
    const categoryId = route.meta.category as string
    const response = await hotSearchApi.getHotSearches({ category: categoryId })

    // 前端去重：根据title和url去重（后端也应该实现去重）
    const uniqueItems = response.reduce((acc: HotSearchItem[], current) => {
      const isDuplicate = acc.some(
        (item) => item.title === current.title || (item.url && item.url === current.url),
      )
      if (!isDuplicate) {
        acc.push(current)
      }
      return acc
    }, [])

    // 过滤有效数据并使用聚合算法排序
    const filtered = uniqueItems.filter(
      (item) => item.heat >= 0 && !item.title?.includes('【降级数据】') && item.title && item.title.trim().length > 0
    )
    // 使用聚合算法排序，考虑rank、热度、平台权重等综合因素
    items.value = sortByAggregateScore(filtered)
    
    // 更新时间
    lastUpdateTime.value = new Date()
    updateRefreshText()
    
    console.log(
      `✅ 加载${categoryId}分类数据成功，原始${response.length}条，去重后${uniqueItems.length}条，过滤后${filtered.length}条，已按热度排序`,
    )
  } catch (err) {
    console.error('加载分类数据失败:', err)
    error.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const handleManualRefresh = async () => {
  console.log('🔄 手动刷新分类数据...')
  await loadData()
  // 重置自动刷新计时器
  stopAutoRefresh()
  startAutoRefresh()
}

const updateRefreshText = () => {
  if (lastUpdateTime.value) {
    const now = new Date()
    const diffSeconds = Math.floor((now.getTime() - lastUpdateTime.value.getTime()) / 1000)
    if (diffSeconds < 60) {
      lastUpdateText.value = `${diffSeconds}秒`
    } else {
      const diffMinutes = Math.floor(diffSeconds / 60)
      lastUpdateText.value = `${diffMinutes}分钟`
    }
  }
}

const loadAISummary = async () => {
  aiLoading.value = true
  aiError.value = ''
  aiSummary.value = null

  try {
    const categoryName = route.meta.categoryName as string
    // 使用分类总结API
    const response = await aiApi.getGlobalSummary()
    aiSummary.value = response.data
  } catch (err) {
    console.error('加载AI总结失败:', err)
    aiError.value = '获取AI总结失败，请稍后重试'
  } finally {
    aiLoading.value = false
  }
}

const toggleAISummary = () => {
  showAISummary.value = !showAISummary.value
  // 如果面板打开且还没有数据，加载AI总结
  if (showAISummary.value && !aiSummary.value && !aiLoading.value) {
    loadAISummary()
  }
}

const openFullRanking = () => {
  if (!loading.value && items.value.length > 0) {
    fullListVisible.value = true
  }
}

const closeFullRanking = () => {
  fullListVisible.value = false
}

onMounted(() => {
  loadData()
  startAutoRefresh()
})

// 监听路由变化，切换分类时重新加载数据
watch(
  () => route.meta.categoryName,
  (newCategory, oldCategory) => {
    if (newCategory && newCategory !== oldCategory) {
      // 清空之前的AI总结
      showAISummary.value = false
      aiSummary.value = null
      aiError.value = ''
      fullListVisible.value = false
      // 重新加载数据
      loadData()
      // 重启自动刷新
      stopAutoRefresh()
      startAutoRefresh()
    }
  },
)

// 自动刷新定时器
let refreshTimer: ReturnType<typeof setInterval> | null = null
let textUpdateTimer: ReturnType<typeof setInterval> | null = null

const startAutoRefresh = () => {
  // 每60秒自动刷新数据（无感刷新）
  refreshTimer = setInterval(() => {
    console.log('🔄 后台自动刷新分类数据...')
    loadData(true) // silent模式，不显示loading
  }, 60000) // 60秒
  
  // 每秒更新文本显示
  textUpdateTimer = setInterval(() => {
    updateRefreshText()
  }, 1000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  if (textUpdateTimer) {
    clearInterval(textUpdateTimer)
    textUpdateTimer = null
  }
}

onBeforeUnmount(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.category-page {
  height: 100vh;
  position: relative;
  overflow-x: hidden;
  overflow-y: hidden;
  background: url('/static/images/background2.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  padding-bottom: 60px;
}

.animated-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
}

/* 左上角阳光效果 */
.animated-overlay::before {
  content: '';
  position: absolute;
  top: -100px;
  left: -100px;
  width: 800px;
  height: 800px;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.35) 15%,
    rgba(255, 255, 255, 0.25) 30%,
    rgba(255, 255, 255, 0.15) 45%,
    rgba(255, 255, 255, 0.08) 60%,
    transparent 80%
  );
  filter: blur(45px);
  animation: sunGlow 8s ease-in-out infinite;
}

/* 流动光效 */
.animated-overlay::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 40%, transparent 70%);
  animation: sunGlow 8s ease-in-out infinite;
  pointer-events: none;
  filter: blur(35px);
}

@keyframes sunGlow {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.12);
  }
}


.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px 100px;
  flex: 1;
  height: 100%;
  overflow-y: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header {
  display: none;
}

/* Category Icon */
.category-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: -45px;
  width: 100%;
}

.category-icon {
  width: 130px;
  height: 130px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.category-icon:hover {
  transform: scale(1.1);
}

/* 排行榜包装器 */
.ranking-wrapper {
  width: 100%;
  max-width: 1400px;
}

.ranking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 0 8px;
  gap: 16px;
  flex-wrap: wrap;
}

.refresh-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.last-update,
.next-refresh {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 10px 24px;
  background: url('/static/icons/gold banner.png') no-repeat center center;
  background-size: 100% 100%;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  min-height: 42px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn,
.ai-summary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 28px;
  border: none !important;
  outline: none !important;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  background-repeat: no-repeat;
  background-position: center center;
  background-color: transparent !important;
  color: #ffffff;
  min-height: 44px;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: all 0.3s ease;
}

.refresh-btn {
  background-image: url('/static/icons/gold banner2.png');
  background-size: 80% 80%;
  min-width: 90px;
  width: auto;
  height: 32px;
  padding: 0 16px !important;
  border-radius: 16px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px;
}

.refresh-btn .refresh-icon {
  font-size: 17px;
  color: #ffffff;
  font-weight: bold;
  line-height: 1;
}

.refresh-btn .refresh-text {
  font-size: 13px;
  color: #ffffff;
  font-weight: 700;
  line-height: 1;
}

.ai-summary-btn {
  background-image: url('/static/icons/banner2.png');
  position: relative;
  font-size: 15px;
  padding: 10px 24px;
  min-width: 110px;
  background-size: 100% 100%;
}

.refresh-btn:hover:not(:disabled),
.ai-summary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.refresh-btn:disabled,
.ai-summary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn:focus,
.ai-summary-btn:focus,
.refresh-btn:active,
.ai-summary-btn:active {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
}

.refresh-btn .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.btn-icon {
  width: 24px;
  height: 24px;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s ease-in-out infinite;
  line-height: 1;
}

.refresh-btn .loading-icon {
  width: 24px;
  height: 24px;
}

.ai-summary-btn .btn-icon {
  width: 24px;
  height: 24px;
  background: url('/static/icons/log.png') no-repeat center center;
  background-size: contain;
  font-size: 0;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.btn-text {
  letter-spacing: 0.5px;
  font-size: 15px;
  line-height: 1;
}

.ranking-section {
  min-height: 400px;
}

/* AI提问悬浮按钮容器 */
.qna-fab-container {
  position: fixed;
  bottom: 120px;
  right: 32px;
  z-index: 1000;
  cursor: move;
  user-select: none;
}

.qna-fab {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: transparent;
  border: none;
  box-shadow: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.qna-fab:hover {
  transform: translateY(-4px) scale(1.1);
  box-shadow: none;
}

.qna-fab:active {
  transform: translateY(-2px) scale(1.02);
}

.qna-fab:hover + .qna-tooltip {
  opacity: 0;
  visibility: hidden;
}

/* 提示气泡 */
.qna-tooltip {
  position: absolute;
  bottom: 76px;
  right: 0;
  background: url('/static/icons/bubble.png') no-repeat center center;
  background-size: contain;
  background-color: transparent;
  color: #ffb3d9;
  padding: 16px 28px;
  border-radius: 0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: none;
  animation: tooltipBounce 3s ease-in-out infinite;
  pointer-events: none;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  min-width: 150px;
}

.qna-tooltip::after {
  display: none;
  top: 100%;
  right: 20px;
  border: 6px solid transparent;
  border-top-color: rgba(37, 99, 235, 0.95);
}

@keyframes tooltipBounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-5px);
    opacity: 0.9;
  }
}

.fab-icon-img {
  width: 82px;
  height: 82px;
  animation: pulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@media (max-width: 768px) {
  .page-content {
    padding: 24px 16px 80px;
  }

  .page-header {
    padding: 24px 20px;
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .ranking-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 20px;
  }

  .refresh-info {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .last-update,
  .next-refresh {
    font-size: 11px;
    padding: 4px 10px;
  }

  .action-buttons {
    justify-content: center;
  }

  .refresh-btn,
  .ai-summary-btn {
    padding: 10px 20px;
    font-size: 13px;
  }

  .btn-icon {
    font-size: 16px;
  }

  .qna-fab {
    width: 56px;
    height: 56px;
    bottom: 24px;
    right: 24px;
  }

  .fab-icon {
    font-size: 28px;
  }
}
</style>
