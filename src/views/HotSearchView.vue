<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Navbar from '@/components/Navbar.vue'
import HotSearchCard from '@/components/HotSearchCard.vue'
import AggregateCard from '@/components/AggregateCard.vue'
import FullListModal from '@/components/FullListModal.vue'
import AISummaryPopover from '@/components/AISummaryPopover.vue'
import QNAPanel from '@/components/QNAPanel.vue'
import Footer from '@/components/Footer.vue'
import { Platform } from '@/types'
import type { HotSearchItem, AISummary } from '@/types'
import hotSearchApi from '@/api/hotSearch'
import aiApi from '@/api/ai'
import { sortByAggregateScore, sortWithPlatformBalance } from '@/utils/aggregateRanking'

// 各平台数据
const weiboItems = ref<HotSearchItem[]>([])
const TOUTIAOItems = ref<HotSearchItem[]>([])
const bilibiliItems = ref<HotSearchItem[]>([])
const douyinItems = ref<HotSearchItem[]>([])
const aggregateItems = ref<HotSearchItem[]>([])

// 加载状态（初始为true，显示骨架屏）
const weiboLoading = ref(true)
const TOUTIAOLoading = ref(true)
const bilibiliLoading = ref(true)
const douyinLoading = ref(true)
const aggregateLoading = ref(true)

// 错误状态
const weiboError = ref('')
const TOUTIAOError = ref('')
const bilibiliError = ref('')
const douyinError = ref('')
const aggregateError = ref('')

// 弹窗
const modalVisible = ref(false)
type ModalPlatform = Platform | 'AGGREGATE' | 'CATEGORY'

const modalPlatform = ref<ModalPlatform>(Platform.WEIBO)
const modalItems = ref<HotSearchItem[]>([])
const modalLoading = ref(false)
const modalError = ref('')

// AI总结弹窗
const aiModalVisible = ref(false)
const aiModalTitle = ref('')
const aiSummary = ref<AISummary | null>(null)
const aiLoading = ref(false)
const aiError = ref('')
const aiTriggerElement = ref<HTMLElement | null>(null)

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
const platformRetryTimers: Partial<Record<Platform, ReturnType<typeof setTimeout> | null>> = {}

const clearPlatformRetry = (platform: Platform) => {
  if (platformRetryTimers[platform]) {
    clearTimeout(platformRetryTimers[platform]!)
    platformRetryTimers[platform] = null
  }
}

const schedulePlatformRetry = (platform: Platform, delay = 8000) => {
  if (platformRetryTimers[platform]) return
  platformRetryTimers[platform] = window.setTimeout(() => {
    platformRetryTimers[platform] = null
    console.log(`⏱️ 自动重试加载${platform}平台数据...`)
    loadPlatformData(platform, true)
  }, delay)
}

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
    y: e.clientY - dragStart.value.y,
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

// 加载单个平台数据（前10）
const loadPlatformData = async (platform: Platform, silent = false) => {
  console.log(`🔄 开始加载${platform}平台数据...`)
  const loadingRef =
    platform === Platform.WEIBO
      ? weiboLoading
      : platform === Platform.TOUTIAO
        ? TOUTIAOLoading
        : platform === Platform.BILIBILI
          ? bilibiliLoading
          : douyinLoading
  const itemsRef =
    platform === Platform.WEIBO
      ? weiboItems
      : platform === Platform.TOUTIAO
        ? TOUTIAOItems
        : platform === Platform.BILIBILI
          ? bilibiliItems
          : douyinItems
  const errorRef =
    platform === Platform.WEIBO
      ? weiboError
      : platform === Platform.TOUTIAO
        ? TOUTIAOError
        : platform === Platform.BILIBILI
          ? bilibiliError
          : douyinError

  if (!silent) {
    loadingRef.value = true
  }
  errorRef.value = ''
  try {
    const response = await hotSearchApi.getHotSearches({ platform })
    console.log(`📊 ${platform}平台原始数据:`, response.length, '条')

    // 打印前3条数据用于调试
    if (response.length > 0) {
      console.log(
        `📋 ${platform}前3条数据样本:`,
        response.slice(0, 3).map((item) => ({
          title: item.title,
          platform: item.platform,
          heat: item.heat,
          category: item.category,
        })),
      )
    }

    // 验证数据平台是否正确
    const wrongPlatform = response.find((item) => item.platform !== platform)
    if (wrongPlatform) {
      console.error(`⚠️ ${platform}数据中混入了其他平台:`, wrongPlatform)
    }

    // 过滤有效数据：必须是当前平台的数据，放宽heat条件
    const filtered = response.filter(
      (item) =>
        item.platform === platform &&
        item.heat >= 0 &&
        !item.title?.includes('【降级数据】') &&
        item.title &&
        item.title.trim().length > 0,
    )
    console.log(`✅ ${platform}过滤后有效数据:`, filtered.length, '条')

    // 根据title去重
    const unique = filtered.reduce((acc: HotSearchItem[], current) => {
      const isDuplicate = acc.some((item) => item.title === current.title)
      if (!isDuplicate) {
        acc.push(current)
      }
      return acc
    }, [])
    console.log(`✅ ${platform}去重后数据:`, unique.length, '条')

    // 按rank排序（升序），然后取前10条
    const sorted = unique.sort((a, b) => (a.rank || 999) - (b.rank || 999))
    itemsRef.value = sorted.slice(0, 10)
    console.log(`✅ ${platform}平台数据加载成功，显示${itemsRef.value.length}条，已按rank排序`)
    clearPlatformRetry(platform)
  } catch (error) {
    console.error(`❌ 加载${platform}失败:`, error)
    errorRef.value = '加载失败'
    schedulePlatformRetry(platform)
  } finally {
    loadingRef.value = false
  }
}

// 加载聚合数据（四个平台各随机10条）
const loadAggregateData = async (silent = false) => {
  if (!silent) {
    aggregateLoading.value = true
  }
  aggregateError.value = ''
  try {
    // 获取所有平台数据（不等待，避免一个失败导致全部失败）
    const [weiboData, TOUTIAOData, bilibiliData, douyinData] = await Promise.allSettled([
      hotSearchApi.getHotSearches({ platform: Platform.WEIBO }),
      hotSearchApi.getHotSearches({ platform: Platform.TOUTIAO }),
      hotSearchApi.getHotSearches({ platform: Platform.BILIBILI }),
      hotSearchApi.getHotSearches({ platform: Platform.DOUYIN }),
    ])

    // 提取成功的数据
    const allItems = [
      ...(weiboData.status === 'fulfilled' ? weiboData.value : []),
      ...(TOUTIAOData.status === 'fulfilled' ? TOUTIAOData.value : []),
      ...(bilibiliData.status === 'fulfilled' ? bilibiliData.value : []),
      ...(douyinData.status === 'fulfilled' ? douyinData.value : []),
    ]

    console.log(`📊 聚合原始数据:`, allItems.length, '条')

    // 过滤有效数据：放宽heat条件
    const filtered = allItems.filter(
      (item) =>
        item.heat >= 0 &&
        !item.title?.includes('【降级数据】') &&
        item.title &&
        item.title.trim().length > 0,
    )

    // 根据title去重
    const unique = filtered.reduce((acc: HotSearchItem[], current) => {
      const isDuplicate = acc.some((item) => item.title === current.title)
      if (!isDuplicate) {
        acc.push(current)
      }
      return acc
    }, [])
    console.log(`✅ 聚合去重后数据:`, unique.length, '条')

    // 使用平台穿插算法排序，确保四个平台均衡展示
    const sorted = sortWithPlatformBalance(unique)
    aggregateItems.value = sorted.slice(0, 40)

    console.log(`✅ 聚合数据加载成功，显示${aggregateItems.value.length}条，已按平台穿插排序`)
  } catch (error) {
    console.error('加载聚合数据失败:', error)
    aggregateError.value = '加载失败'
  } finally {
    aggregateLoading.value = false
  }
}

// 查看全部（50条）
const handleViewAll = async (platform: Platform) => {
  modalPlatform.value = platform
  modalVisible.value = true
  modalLoading.value = true
  modalError.value = ''

  try {
    const response = await hotSearchApi.getHotSearches({ platform })
    console.log(`📊 ${platform}平台原始数据:`, response.length, '条')

    // 过滤有效数据：必须是当前平台、非降级数据
    const filtered = response.filter(
      (item) =>
        item.platform === platform &&
        item.heat >= 0 &&
        !item.title?.includes('【降级数据】') &&
        item.title &&
        item.title.trim().length > 0,
    )
    console.log(`✅ ${platform}过滤后有效数据:`, filtered.length, '条')

    // 根据title去重
    const unique = filtered.reduce((acc: HotSearchItem[], current) => {
      const isDuplicate = acc.some((item) => item.title === current.title)
      if (!isDuplicate) {
        acc.push(current)
      }
      return acc
    }, [])
    console.log(`✅ ${platform}去重后数据:`, unique.length, '条')

    // 按rank排序（升序）后取前50条
    const sorted = unique.sort((a, b) => (a.rank || 999) - (b.rank || 999))
    modalItems.value = sorted.slice(0, 50)
    console.log(`✅ ${platform}完整榜单加载成功，显示${modalItems.value.length}条，已按rank排序`)
  } catch (error) {
    console.error(`加载${platform}完整数据失败:`, error)
    modalError.value = '加载失败'
  } finally {
    modalLoading.value = false
  }
}

// 查看聚合卡片全部
async function handleViewAllAggregate() {
  modalPlatform.value = 'AGGREGATE'
  modalVisible.value = true
  modalLoading.value = true
  modalError.value = ''

  try {
    // 获取所有平台数据 - 使用Promise.allSettled避免单个平台失败影响整体
    const [weiboData, TOUTIAOData, bilibiliData, douyinData] = await Promise.allSettled([
      hotSearchApi.getHotSearches({ platform: Platform.WEIBO }),
      hotSearchApi.getHotSearches({ platform: Platform.TOUTIAO }),
      hotSearchApi.getHotSearches({ platform: Platform.BILIBILI }),
      hotSearchApi.getHotSearches({ platform: Platform.DOUYIN }),
    ])

    // 提取成功的数据
    const allItems = [
      ...(weiboData.status === 'fulfilled' ? weiboData.value : []),
      ...(TOUTIAOData.status === 'fulfilled' ? TOUTIAOData.value : []),
      ...(bilibiliData.status === 'fulfilled' ? bilibiliData.value : []),
      ...(douyinData.status === 'fulfilled' ? douyinData.value : []),
    ]

    console.log(`📊 全平台原始数据:`, allItems.length, '条')

    // 过滤有效数据：非降级数据
    const filtered = allItems.filter(
      (item) =>
        item.heat >= 0 &&
        !item.title?.includes('【降级数据】') &&
        item.title &&
        item.title.trim().length > 0,
    )
    console.log(`✅ 全平台过滤后有效数据:`, filtered.length, '条')

    // 根据title去重
    const unique = filtered.reduce((acc: HotSearchItem[], current) => {
      const isDuplicate = acc.some((item) => item.title === current.title)
      if (!isDuplicate) {
        acc.push(current)
      }
      return acc
    }, [])
    console.log(`✅ 全平台去重后数据:`, unique.length, '条')

    // 使用智能综合评分算法排序（查看全部弹窗）
    const sorted = sortByAggregateScore(unique, false) // 弹窗不启用调试日志
    modalItems.value = sorted.slice(0, 50)
    console.log(`✅ 全平台榜单加载成功，显示${modalItems.value.length}条，已按综合评分排序`)
  } catch (error) {
    console.error('加载聚合数据失败:', error)
    modalError.value = '加载失败'
  } finally {
    modalLoading.value = false
  }
}

const closeModal = () => {
  modalVisible.value = false
  modalItems.value = []
}

// AI总结 - 全局
const handleGlobalAISummary = async (element?: HTMLElement) => {
  aiTriggerElement.value = element ?? aiTriggerElement.value ?? document.body
  aiModalTitle.value = '全平台热搜AI总结'
  aiModalVisible.value = true
  aiLoading.value = true
  aiError.value = ''
  aiSummary.value = null

  try {
    const response = await aiApi.getGlobalSummary()
    aiSummary.value = response.data
  } catch (error) {
    console.error('获取全局AI总结失败:', error)
    aiError.value = '获取AI总结失败，请稍后重试'
  } finally {
    aiLoading.value = false
  }
}

// AI总结 - 按平台
const handlePlatformAISummary = async (platform: Platform, element: HTMLElement) => {
  const platformNames: Record<Platform, string> = {
    [Platform.WEIBO]: '微博',
    [Platform.TOUTIAO]: '今日头条',
    [Platform.BILIBILI]: 'B站',
    [Platform.DOUYIN]: '抖音',
  }

  aiTriggerElement.value = element
  aiModalTitle.value = `${platformNames[platform]}热搜AI总结`
  aiModalVisible.value = true
  aiLoading.value = true
  aiError.value = ''
  aiSummary.value = null

  try {
    const response = await aiApi.getPlatformSummary(platform)
    aiSummary.value = response.data
  } catch (error) {
    console.error(`获取${platformNames[platform]}AI总结失败:`, error)
    aiError.value = '获取AI总结失败，请稍后重试'
  } finally {
    aiLoading.value = false
  }
}

const closeAIModal = () => {
  aiModalVisible.value = false
  aiSummary.value = null
  aiError.value = ''
}

const retryAISummary = () => {
  if (aiModalTitle.value === '全平台热搜AI总结') {
    handleGlobalAISummary(aiTriggerElement.value ?? document.body)
  }
}

// 自动刷新定时器
let aggregateRefreshTimer: ReturnType<typeof setInterval> | null = null
let platformRefreshTimer: ReturnType<typeof setInterval> | null = null

const startAutoRefresh = () => {
  console.log('🔄 启动自动刷新...')

  // 聚合卡片每60秒刷新一次（无感刷新）
  aggregateRefreshTimer = setInterval(() => {
    console.log('🔄 自动刷新聚合数据...')
    loadAggregateData(true) // silent模式
  }, 60000) // 60秒

  // 四个小卡片每60秒刷新一次（无感刷新）
  platformRefreshTimer = setInterval(() => {
    console.log('🔄 自动刷新四个平台数据...')
    loadPlatformData(Platform.WEIBO, true) // silent模式
    loadPlatformData(Platform.TOUTIAO, true) // silent模式
    loadPlatformData(Platform.BILIBILI, true) // silent模式
    loadPlatformData(Platform.DOUYIN, true) // silent模式
  }, 60000) // 60秒
}

const stopAutoRefresh = () => {
  if (aggregateRefreshTimer) {
    clearInterval(aggregateRefreshTimer)
    aggregateRefreshTimer = null
  }
  if (platformRefreshTimer) {
    clearInterval(platformRefreshTimer)
    platformRefreshTimer = null
  }
  Object.values(Platform).forEach((platformKey) => {
    clearPlatformRetry(platformKey as Platform)
  })
  console.log('🛑 停止自动刷新')
}

onMounted(async () => {
  // 初始加载所有数据（并行加载，提高速度）
  console.log('🚀 页面加载，开始获取数据...')

  // 并行加载所有数据，减少等待时间
  await Promise.all([
    loadPlatformData(Platform.WEIBO),
    loadPlatformData(Platform.TOUTIAO),
    loadPlatformData(Platform.BILIBILI),
    loadPlatformData(Platform.DOUYIN),
    loadAggregateData(),
  ])

  // 启动自动刷新
  startAutoRefresh()
})

onBeforeUnmount(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="hot-search-page">
    <div class="animated-overlay"></div>
    <Navbar />

    <main class="page-content">
      <div class="hot-search-container">
        <!-- 左上 - 微博 -->
        <div class="corner-card top-left">
          <HotSearchCard
            :platform="Platform.WEIBO"
            :items="weiboItems"
            :loading="weiboLoading"
            :error="weiboError"
            :show-view-all="true"
            @view-all="handleViewAll(Platform.WEIBO)"
            @refresh="loadPlatformData(Platform.WEIBO)"
            @ai-summary="(el) => handlePlatformAISummary(Platform.WEIBO, el)"
          />
        </div>

        <!-- 左下 - B站 -->
        <div class="corner-card bottom-left">
          <HotSearchCard
            :platform="Platform.BILIBILI"
            :items="bilibiliItems"
            :loading="bilibiliLoading"
            :error="bilibiliError"
            :show-view-all="true"
            @view-all="handleViewAll(Platform.BILIBILI)"
            @refresh="loadPlatformData(Platform.BILIBILI)"
            @ai-summary="(el) => handlePlatformAISummary(Platform.BILIBILI, el)"
          />
        </div>

        <!-- 中间 - 聚合 -->
        <div class="center-dashboard-icon"></div>
        <div class="corner-card center-card">
          <AggregateCard
            :items="aggregateItems"
            :loading="aggregateLoading"
            :error="aggregateError"
            :show-view-all="true"
            @view-all="handleViewAllAggregate"
            @refresh="loadAggregateData"
            @ai-summary="handleGlobalAISummary"
          />
        </div>

        <!-- 右上 - 今日头条 -->
        <div class="corner-card top-right">
          <HotSearchCard
            :platform="Platform.TOUTIAO"
            :items="TOUTIAOItems"
            :loading="TOUTIAOLoading"
            :error="TOUTIAOError"
            :show-view-all="true"
            @view-all="handleViewAll(Platform.TOUTIAO)"
            @refresh="loadPlatformData(Platform.TOUTIAO)"
            @ai-summary="(el) => handlePlatformAISummary(Platform.TOUTIAO, el)"
          />
        </div>

        <!-- 右下 - 抖音 -->
        <div class="corner-card bottom-right">
          <HotSearchCard
            :platform="Platform.DOUYIN"
            :items="douyinItems"
            :loading="douyinLoading"
            :error="douyinError"
            :show-view-all="true"
            @view-all="handleViewAll(Platform.DOUYIN)"
            @refresh="loadPlatformData(Platform.DOUYIN)"
            @ai-summary="(el) => handlePlatformAISummary(Platform.DOUYIN, el)"
          />
        </div>
      </div>
    </main>

    <!-- 查看全部弹窗 -->
    <FullListModal
      :visible="modalVisible"
      :platform="modalPlatform"
      :items="modalItems"
      :loading="modalLoading"
      :error="modalError"
      :show-platform-icon="modalPlatform === 'AGGREGATE' || modalPlatform === 'CATEGORY'"
      @close="closeModal"
    />

    <!-- AI总结弹窗 -->
    <AISummaryPopover
      :visible="aiModalVisible"
      :title="aiModalTitle"
      :summary="aiSummary"
      :loading="aiLoading"
      :error="aiError"
      :trigger-element="aiTriggerElement"
      @close="closeAIModal"
      @retry="retryAISummary"
    />

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
      <div v-if="showQnaTooltip" class="qna-tooltip">
        {{ qnaPanelVisible ? '点我也可以关闭提问哦' : '有什么问题都可以点我哦' }}
      </div>
    </div>

    <!-- QNA面板 -->
    <QNAPanel :visible="qnaPanelVisible" @close="qnaPanelVisible = false" />

    <!-- Footer -->
    <Footer />
  </div>
</template>

<style scoped>
.hot-search-page {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: url('/static/images/background.webp') no-repeat center center;
  background-size: 100% 100%;
  background-attachment: fixed;
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
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.12);
  }
}

.page-content {
  position: relative;
  height: calc(100vh - 60px);
  overflow: hidden;
  padding: 0;
  z-index: 2;
}

.hot-search-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.center-header {
  display: none;
}

/* 四个角落的卡片 - 长方形布局 */
.corner-card {
  position: absolute;
  width: 280px;
  height: 320px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.corner-card:hover {
  transform: scale(1.02);
  z-index: 10;
}

/* 左上 - 微博卡片位置（往内靠）*/
.top-left {
  top: 10px;
  left: 100px;
}

/* 右上 - 今日头条卡片位置（往内靠）*/
.top-right {
  top: 10px;
  right: 100px;
}

/* 左下 - B站卡片位置（往内靠，距离底部有一定距离）*/
.bottom-left {
  bottom: 95px;
  left: 100px;
}

/* 右下 - 抖音卡片位置（往内靠，距离底部有一定距离）*/
.bottom-right {
  bottom: 95px;
  right: 100px;
}

/* 中间聚合卡片 - 往上移动 */
.center-card {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 520px;
  height: 595px;
  z-index: 6;
}

.center-card:hover {
  transform: translate(-50%, -50%) scale(1.02);
}

.center-dashboard-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% - 340px));
  width: 350px;
  height: 100px;
  background: url('/static/icons/dashboard.png') no-repeat center center;
  background-size: contain;
  z-index: 5;
  animation: strongPulse 2.5s ease-in-out infinite;
}

@keyframes strongPulse {
  0%,
  100% {
    transform: translate(-50%, calc(-50% - 340px)) scale(1);
  }
  50% {
    transform: translate(-50%, calc(-50% - 340px)) scale(0.95);
  }
}

@media (max-width: 1200px) {
  .corner-card {
    width: 280px;
    height: 340px;
  }

  .center-card {
    width: 360px;
    height: 460px;
  }

  .top-left,
  .top-right,
  .bottom-left,
  .bottom-right {
    margin: 15px;
  }
}

@media (max-width: 768px) {
  .corner-card {
    width: 42%;
    height: 300px;
  }

  .center-card {
    width: 60%;
    height: 400px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .top-left,
  .top-right,
  .bottom-left,
  .bottom-right {
    margin: 10px;
  }
}

/* AI提问悬浮按钮容器 */
.qna-fab-container {
  position: fixed;
  bottom: 100px;
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
</style>
