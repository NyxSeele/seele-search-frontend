<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Navbar from '@/components/Navbar.vue'
import HotSearchCard from '@/components/HotSearchCard.vue'
import AggregateCard from '@/components/AggregateCard.vue'
import FullListModal from '@/components/FullListModal.vue'
import QNAPanel from '@/components/QNAPanel.vue'
import Footer from '@/components/Footer.vue'
import { Platform } from '@/types'
import type { HotSearchItem, AISummary } from '@/types'
import hotSearchApi from '@/api/hotSearch'
import aiApi from '@/api/ai'
import { sortByAggregateScore, sortWithPlatformBalance } from '@/utils/aggregateRanking'
import { pushSummaryToQnaPanel, startSummaryStream } from '@/utils/qnaSummary'
import { failQnaStream } from '@/utils/qnaStream'

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

// Kiana按钮相关状态
const kianaFabPosition = ref({ x: 0, y: 0 })
const isKianaDragging = ref(false)
const kianaDragStart = ref({ x: 0, y: 0 })
const kianaHasDragged = ref(false)
const showKianaTooltip = ref(true)
let kianaTooltipHideTimer: number | null = null
const honkaiModalVisible = ref(false)
const honkaiItems = ref<HotSearchItem[]>([])
const honkaiLoading = ref(false)
const honkaiError = ref('')
const platformRetryTimers: Partial<Record<Platform, ReturnType<typeof setTimeout> | null>> = {}
const platformDisplayNames: Record<Platform, string> = {
  [Platform.WEIBO]: '微博',
  [Platform.TOUTIAO]: '今日头条',
  [Platform.BILIBILI]: 'B站',
  [Platform.DOUYIN]: '抖音',
}

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

const handleKianaMouseDown = (e: MouseEvent) => {
  isKianaDragging.value = true
  kianaHasDragged.value = false
  kianaDragStart.value = { x: e.clientX - kianaFabPosition.value.x, y: e.clientY - kianaFabPosition.value.y }
  document.addEventListener('mousemove', handleKianaMouseMove)
  document.addEventListener('mouseup', handleKianaMouseUp)
}

const handleKianaMouseMove = (e: MouseEvent) => {
  if (!isKianaDragging.value) return
  const nextPosition = {
    x: e.clientX - kianaDragStart.value.x,
    y: e.clientY - kianaDragStart.value.y,
  }
  const deltaX = nextPosition.x - kianaFabPosition.value.x
  const deltaY = nextPosition.y - kianaFabPosition.value.y
  if (!kianaHasDragged.value) {
    const movedEnough = Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD
    if (movedEnough) {
      kianaHasDragged.value = true
    }
  }
  if (kianaHasDragged.value) {
    kianaFabPosition.value = nextPosition
  }
}

const handleKianaMouseUp = () => {
  isKianaDragging.value = false
  document.removeEventListener('mousemove', handleKianaMouseMove)
  document.removeEventListener('mouseup', handleKianaMouseUp)
}

const handleKianaClick = async () => {
  if (kianaHasDragged.value) {
    kianaHasDragged.value = false
    return
  }
  // 显示崩坏3公告卡片
  honkaiModalVisible.value = true
  hideKianaTooltipTemporarily()
  
  if (honkaiItems.value.length === 0) {
    await loadHonkaiData()
  }
}

const loadHonkaiData = async () => {
  honkaiLoading.value = true
  honkaiError.value = ''
  try {
    const response = await hotSearchApi.getHonkaiHotSearch()
    honkaiItems.value = response.data || []
  } catch (error) {
    console.error('加载崩坏3数据失败:', error)
    honkaiError.value = '加载失败，请稍后重试'
  } finally {
    honkaiLoading.value = false
  }
}

const closeHonkaiModal = () => {
  honkaiModalVisible.value = false
}

const handleKianaMouseEnter = () => {
  hideKianaTooltipTemporarily()
}

const hideKianaTooltipTemporarily = () => {
  showKianaTooltip.value = false
  if (kianaTooltipHideTimer) {
    clearTimeout(kianaTooltipHideTimer)
  }
  kianaTooltipHideTimer = window.setTimeout(() => {
    showKianaTooltip.value = true
  }, 10000)
}

const streamSummaryToQna = async (
  fetcher: () => Promise<AISummary | null>,
  title: string,
  meta?: Record<string, any>,
) => {
  qnaPanelVisible.value = true
  hideTooltipTemporarily()
  window.dispatchEvent(new CustomEvent('qna:force-scroll'))

  const streamId = startSummaryStream(title, meta)

  try {
    const summary = await fetcher()
    if (summary) {
      pushSummaryToQnaPanel(title, summary, { streamId })
    } else {
      failQnaStream(streamId, '暂无有效总结')
    }
  } catch (error) {
    console.error(`获取${title}失败:`, error)
    failQnaStream(streamId, '获取AI总结失败，请稍后重试')
  }
}

const handleGlobalAISummary = () => {
  streamSummaryToQna(
    async () => {
      const response = await aiApi.getGlobalSummary()
      return response.data
    },
    '全平台热搜AI总结',
    { scope: 'GLOBAL' },
  )
}

const handlePlatformAISummary = (platform: Platform) => {
  streamSummaryToQna(
    async () => {
      const response = await aiApi.getPlatformSummary(platform)
      return response.data
    },
    `${platformDisplayNames[platform]}热搜AI总结`,
    { platform },
  )
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
  document.removeEventListener('mousemove', handleKianaMouseMove)
  document.removeEventListener('mouseup', handleKianaMouseUp)
  if (kianaTooltipHideTimer) {
    clearTimeout(kianaTooltipHideTimer)
  }
})
</script>

<template>
  <div class="hot-search-page">
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
            @ai-summary="() => handlePlatformAISummary(Platform.WEIBO)"
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
            @ai-summary="() => handlePlatformAISummary(Platform.BILIBILI)"
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
            @ai-summary="() => handlePlatformAISummary(Platform.TOUTIAO)"
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
            @ai-summary="() => handlePlatformAISummary(Platform.DOUYIN)"
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

    <!-- Kiana按钮（崩坏3公告） -->
    <div
      class="kiana-fab-container"
      :style="{ transform: `translate(${kianaFabPosition.x}px, ${kianaFabPosition.y}px)` }"
      @mousedown="handleKianaMouseDown"
      @mouseenter="handleKianaMouseEnter"
    >
      <button class="kiana-fab" @click="handleKianaClick" title="崩坏3最新公告">
        <img src="/static/icons/kiana.png" alt="Kiana" class="fab-icon-img" />
      </button>
      <div v-if="showKianaTooltip" class="kiana-tooltip">
        点我查看崩坏3最新公告
      </div>
    </div>

    <!-- QNA面板 -->
    <QNAPanel :visible="qnaPanelVisible" @close="qnaPanelVisible = false" />

    <!-- 崩坏3公告卡片 -->
    <FullListModal
      :visible="honkaiModalVisible"
      platform="AGGREGATE"
      :items="honkaiItems"
      :loading="honkaiLoading"
      :error="honkaiError"
      title="崩坏3最新公告"
      :show-platform-icon="false"
      @close="closeHonkaiModal"
    />

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
  padding: 20px 28px 16px;
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

/* Kiana按钮容器 */
.kiana-fab-container {
  position: fixed;
  bottom: 100px;
  left: 32px;
  z-index: 1000;
  cursor: move;
  user-select: none;
}

/* Kiana按钮样式（与QNA完全一致） */
.kiana-fab {
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

.kiana-fab:hover {
  transform: translateY(-4px) scale(1.1);
  box-shadow: none;
}

.kiana-fab:active {
  transform: translateY(-2px) scale(1.02);
}

.kiana-fab:hover + .kiana-tooltip {
  opacity: 0;
  visibility: hidden;
}

/* Kiana提示气泡 */
.kiana-tooltip {
  position: absolute;
  bottom: 76px;
  left: 0;
  background: url('/static/icons/bubble.png') no-repeat center center;
  background-size: contain;
  background-color: transparent;
  color: #ffb3d9;
  padding: 20px 28px 16px;
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

.kiana-tooltip::after {
  display: none;
}
</style>
