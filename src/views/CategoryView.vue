<template>
  <div class="category-page">
    <AnimatedBackground />
    <Navbar />

    <main class="page-content">
      <div class="page-header">
        <h1 class="page-title">{{ categoryInfo.name }}热搜</h1>
        <p class="page-subtitle">{{ categoryInfo.description }}</p>
      </div>

      <!-- 排行榜 + AI总结按钮 -->
      <div class="ranking-wrapper">
        <div class="ranking-header">
          <div class="refresh-info">
            <span class="last-update">📊 {{ lastUpdateText }}</span>
          </div>
          <div class="action-buttons">
            <button class="refresh-btn" @click="handleManualRefresh" :disabled="loading" title="手动刷新">
              <span class="btn-icon" :class="{ spinning: loading }">🔄</span>
              <span class="btn-text">刷新</span>
            </button>
            <button ref="aiBtn" class="ai-summary-btn" @click="toggleAISummary" :disabled="aiLoading">
              <span class="btn-icon">🤖</span>
              <span class="btn-text">AI总结</span>
            </button>
          </div>
        </div>
        <div class="ranking-section">
          <RankingList :items="items" :loading="loading" :error="error" />
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
    </main>

    <!-- AI提问悬浮按钮 -->
    <div class="qna-fab-container">
      <button class="qna-fab" @click="qnaPanelVisible = true" title="AI智能问答">
        <span class="fab-icon">🤖</span>
      </button>
      <div class="qna-tooltip">有什么问题都可以点我哦</div>
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
import Footer from '@/components/Footer.vue'
import { CATEGORIES } from '@/constants/categories'
import { HotSearchItem, AISummary } from '@/types'
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

// QNA面板
const qnaPanelVisible = ref(false)

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

const loadData = async () => {
  loading.value = true
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
      lastUpdateText.value = `${diffSeconds}秒前更新`
    } else {
      const diffMinutes = Math.floor(diffSeconds / 60)
      lastUpdateText.value = `${diffMinutes}分钟前更新`
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
      // 重新加载数据
      loadData()
      // 重启自动刷新
      stopAutoRefresh()
      startAutoRefresh()
    }
  },
)

// 自动刷新定时器
let refreshTimer: NodeJS.Timeout | null = null
let textUpdateTimer: NodeJS.Timeout | null = null

const startAutoRefresh = () => {
  // 每30秒自动刷新数据（无感刷新）
  refreshTimer = setInterval(() => {
    console.log('🔄 后台自动刷新分类数据...')
    loadData()
  }, 30000) // 30秒
  
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
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px 100px;
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 32px;
  background: transparent;
  border-radius: 8px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #2c3e50;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
}

.page-subtitle {
  font-size: 15px;
  color: #2c3e50;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.8;
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
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn,
.ai-summary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  color: #fff;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  transition: all 0.3s ease;
}

.refresh-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.ai-summary-btn {
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
}

.refresh-btn:hover:not(:disabled),
.ai-summary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
}

.refresh-btn:disabled,
.ai-summary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  font-size: 18px;
  animation: pulse 2s ease-in-out infinite;
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
}

.ranking-section {
  min-height: 400px;
}

/* AI提问悬浮按钮容器 */
.qna-fab-container {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1000;
}

.qna-fab {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  border: none;
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.qna-fab:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 32px rgba(14, 165, 233, 0.6);
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
  background: rgba(37, 99, 235, 0.95);
  color: #fff;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  animation: tooltipBounce 3s ease-in-out infinite;
  pointer-events: none;
  z-index: 999;
}

.qna-tooltip::after {
  content: '';
  position: absolute;
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

.fab-icon {
  font-size: 32px;
  animation: pulse 2s ease-in-out infinite;
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
