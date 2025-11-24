<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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

// Touch事件处理 - QNA
const handleQnaTouchStart = (e: TouchEvent) => {
  e.preventDefault()
  isDragging.value = true
  hasDragged.value = false
  const touch = e.touches[0]
  if (!touch) return
  dragStart.value = {
    x: touch.clientX - qnaFabPosition.value.x,
    y: touch.clientY - qnaFabPosition.value.y,
  }
  document.addEventListener('touchmove', handleQnaTouchMove)
  document.addEventListener('touchend', handleQnaTouchEnd)
}

const handleQnaTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  const touch = e.touches[0]
  if (!touch) return
  const nextPosition = {
    x: touch.clientX - dragStart.value.x,
    y: touch.clientY - dragStart.value.y,
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

const handleQnaTouchEnd = (e: TouchEvent) => {
  isDragging.value = false
  document.removeEventListener('touchmove', handleQnaTouchMove)
  document.removeEventListener('touchend', handleQnaTouchEnd)
  // 如果没有拖动，触发点击
  if (!hasDragged.value) {
    handleQnaClick()
  }
}

// Touch事件处理 - Kiana
const handleKianaTouchStart = (e: TouchEvent) => {
  e.preventDefault()
  isKianaDragging.value = true
  kianaHasDragged.value = false
  const touch = e.touches[0]
  if (!touch) return
  kianaDragStart.value = {
    x: touch.clientX - kianaFabPosition.value.x,
    y: touch.clientY - kianaFabPosition.value.y,
  }
  document.addEventListener('touchmove', handleKianaTouchMove)
  document.addEventListener('touchend', handleKianaTouchEnd)
}

const handleKianaTouchMove = (e: TouchEvent) => {
  if (!isKianaDragging.value) return
  const touch = e.touches[0]
  if (!touch) return
  const nextPosition = {
    x: touch.clientX - kianaDragStart.value.x,
    y: touch.clientY - kianaDragStart.value.y,
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

const handleKianaTouchEnd = (e: TouchEvent) => {
  isKianaDragging.value = false
  document.removeEventListener('touchmove', handleKianaTouchMove)
  document.removeEventListener('touchend', handleKianaTouchEnd)
  // 如果没有拖动，触发点击
  if (!kianaHasDragged.value) {
    handleKianaClick()
  }
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

// 3D圆柱旋转相关状态
// 简单的滑动展示
const currentSlideIndex = ref(0)
const slideTouchStartX = ref(0)
const slideTouchStartTranslateX = ref(0)
const translateX = ref(0)
const isSlideDragging = ref(false)
const CARD_COUNT = 5

// 滑动阈值降低，更容易触发滑动
const SWIPE_THRESHOLD = 30 // 降低从50到30，更容易触发
const MIN_SWIPE_DISTANCE = 50 // 最小滑动距离

const handleSlideTouchStart = (e: TouchEvent) => {
  if (window.innerWidth > 768) return
  const touch = e.touches[0]
  if (!touch) return
  slideTouchStartX.value = touch.clientX
  slideTouchStartTranslateX.value = translateX.value
  isSlideDragging.value = true
}

const handleSlideTouchMove = (e: TouchEvent) => {
  if (!isSlideDragging.value || window.innerWidth > 768) return
  e.preventDefault()
  const touch = e.touches[0]
  if (!touch) return
  const deltaX = touch.clientX - slideTouchStartX.value
  const screenWidth = window.innerWidth
  const maxTranslate = -(CARD_COUNT - 1) * screenWidth
  translateX.value = Math.max(maxTranslate, Math.min(0, slideTouchStartTranslateX.value + deltaX))
}

const handleSlideTouchEnd = () => {
  if (window.innerWidth > 768) return
  isSlideDragging.value = false
  // 吸附到最近的卡片 - 降低阈值，更容易切换
  const screenWidth = window.innerWidth
  const absDeltaX = Math.abs(translateX.value - slideTouchStartTranslateX.value)
  const deltaX = slideTouchStartTranslateX.value - translateX.value // 计算滑动方向：正数向左，负数向右
  
  // 如果滑动距离足够，切换到下一张/上一张
  if (absDeltaX > MIN_SWIPE_DISTANCE) {
    if (deltaX > 0) {
      // 向左滑动，显示下一张
      slideToIndex(Math.min(CARD_COUNT - 1, currentSlideIndex.value + 1))
    } else {
      // 向右滑动，显示上一张
      slideToIndex(Math.max(0, currentSlideIndex.value - 1))
    }
  } else {
    // 滑动距离不够，吸附到当前卡片
    const targetIndex = Math.round(-translateX.value / screenWidth)
    const clampedIndex = Math.max(0, Math.min(CARD_COUNT - 1, targetIndex))
    slideToIndex(clampedIndex)
  }
}

const slideToIndex = (index: number) => {
  currentSlideIndex.value = index
  const screenWidth = window.innerWidth
  translateX.value = -index * screenWidth
}

// 移动端数据限制：大卡片7条，小卡片8条
const isMobile = computed(() => window.innerWidth <= 768)
const mobileAggregateItems = computed(() => {
  return isMobile.value ? aggregateItems.value.slice(0, 7) : aggregateItems.value
})
const mobileWeiboItems = computed(() => {
  return isMobile.value ? weiboItems.value.slice(0, 8) : weiboItems.value
})
const mobileTOUTIAOItems = computed(() => {
  return isMobile.value ? TOUTIAOItems.value.slice(0, 8) : TOUTIAOItems.value
})
const mobileBilibiliItems = computed(() => {
  return isMobile.value ? bilibiliItems.value.slice(0, 8) : bilibiliItems.value
})
const mobileDouyinItems = computed(() => {
  return isMobile.value ? douyinItems.value.slice(0, 8) : douyinItems.value
})


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
      <!-- PC端布局 -->
      <div class="hot-search-container pc-layout">
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

      <!-- 移动端简单滑动布局 -->
      <div class="mobile-slide-container">
        <div 
          class="slide-wrapper" 
          :data-index="currentSlideIndex"
          :style="{ transform: `translateX(${translateX}px)` }"
          @touchstart="handleSlideTouchStart"
          @touchmove="handleSlideTouchMove"
          @touchend="handleSlideTouchEnd"
        >
          <!-- 卡片1 - 聚合 -->
          <div class="slide-card">
            <AggregateCard
              :items="mobileAggregateItems"
              :loading="aggregateLoading"
              :error="aggregateError"
              :show-view-all="true"
              @view-all="handleViewAllAggregate"
              @refresh="loadAggregateData"
              @ai-summary="handleGlobalAISummary"
            />
          </div>

          <!-- 卡片2 - 微博 -->
          <div class="slide-card">
            <HotSearchCard
              :platform="Platform.WEIBO"
              :items="mobileWeiboItems"
              :loading="weiboLoading"
              :error="weiboError"
              :show-view-all="true"
              @view-all="handleViewAll(Platform.WEIBO)"
              @refresh="loadPlatformData(Platform.WEIBO)"
              @ai-summary="() => handlePlatformAISummary(Platform.WEIBO)"
            />
          </div>

          <!-- 卡片3 - 今日头条 -->
          <div class="slide-card">
            <HotSearchCard
              :platform="Platform.TOUTIAO"
              :items="mobileTOUTIAOItems"
              :loading="TOUTIAOLoading"
              :error="TOUTIAOError"
              :show-view-all="true"
              @view-all="handleViewAll(Platform.TOUTIAO)"
              @refresh="loadPlatformData(Platform.TOUTIAO)"
              @ai-summary="() => handlePlatformAISummary(Platform.TOUTIAO)"
            />
          </div>

          <!-- 卡片4 - B站 -->
          <div class="slide-card">
            <HotSearchCard
              :platform="Platform.BILIBILI"
              :items="mobileBilibiliItems"
              :loading="bilibiliLoading"
              :error="bilibiliError"
              :show-view-all="true"
              @view-all="handleViewAll(Platform.BILIBILI)"
              @refresh="loadPlatformData(Platform.BILIBILI)"
              @ai-summary="() => handlePlatformAISummary(Platform.BILIBILI)"
            />
          </div>

          <!-- 卡片5 - 抖音 -->
          <div class="slide-card">
            <HotSearchCard
              :platform="Platform.DOUYIN"
              :items="mobileDouyinItems"
              :loading="douyinLoading"
              :error="douyinError"
              :show-view-all="true"
              @view-all="handleViewAll(Platform.DOUYIN)"
              @refresh="loadPlatformData(Platform.DOUYIN)"
              @ai-summary="() => handlePlatformAISummary(Platform.DOUYIN)"
            />
          </div>
        </div>


        <!-- 导航指示点 - 移动端隐藏 -->
        <div class="slide-indicators" style="display: none;"></div>
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
      @touchstart="handleQnaTouchStart"
      @mouseenter="handleQnaMouseEnter"
    >
      <button class="qna-fab" @click="handleQnaClick" title="AI智能问答">
        <img src="/static/icons/thinking.png" alt="AI" class="fab-icon-img" />
      </button>
      <div v-if="showQnaTooltip" class="qna-tooltip">
        {{ qnaPanelVisible ? '点我也可以关闭提问哦♪' : '有什么问题都可以点我哦♪' }}
      </div>
    </div>

    <!-- Kiana按钮（崩坏3公告） -->
    <div
      class="kiana-fab-container"
      :style="{ transform: `translate(${kianaFabPosition.x}px, ${kianaFabPosition.y}px)` }"
      @mousedown="handleKianaMouseDown"
      @touchstart="handleKianaTouchStart"
      @mouseenter="handleKianaMouseEnter"
    >
      <button class="kiana-fab" @click="handleKianaClick" title="崩坏3最新公告">
        <img src="/static/icons/kiana.png" alt="Kiana" class="fab-icon-img" />
      </button>
      <div v-if="showKianaTooltip" class="kiana-tooltip">
        点我查看崩坏3最新公告哦
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
  transition: transform 0.3s ease;
}

.center-dashboard-icon:hover {
  transform: translate(-50%, calc(-50% - 340px)) scale(1.1);
  animation: none;
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

@media (min-width: 769px) {
  /* PC端隐藏移动端布局 */
  .mobile-slide-container {
    display: none;
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
  /* PC布局隐藏 */
  .pc-layout {
    display: none;
  }

  /* 移动端简单滑动容器 - 完全响应式 */
  .mobile-slide-container {
    position: relative;
    width: 100vw;
    min-height: 60vh;
    margin-top: clamp(0.4rem, 3vw, 0.8rem);
    padding: 0 clamp(0.2rem, 2vw, 0.5rem) clamp(0.3rem, 3vw, 0.6rem);
    overflow: hidden;
    touch-action: pan-x; /* 只允许横向滑动，纵向由列表内部处理 */
  }

  .slide-wrapper {
    display: flex;
    width: 500%;
    transition: transform 0.3s ease-out;
    will-change: transform;
    touch-action: pan-x; /* 允许横向滑动 */
  }

  .slide-card {
    width: 20%;
    flex-shrink: 0;
    padding: 0 clamp(0.1rem, 1vw, 0.2rem);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease-out, opacity 0.3s ease-out;
    transform-origin: center;
    min-height: 50vh; /* 使用vh确保基础高度 */
  }

  /* 当前卡片正常大小 */
  .slide-card:nth-child(1) {
    transform: scale(1);
    opacity: 1;
  }

  /* 下一个卡片缩小预览 */
  .slide-card:nth-child(2) {
    transform: scale(0.85);
    opacity: 0.7;
  }

  /* 其他卡片更小 */
  .slide-card:nth-child(n+3) {
    transform: scale(0.7);
    opacity: 0.5;
  }

  /* 根据当前索引动态调整 */
  .slide-wrapper[data-index="0"] .slide-card:nth-child(1) { transform: scale(1); opacity: 1; }
  .slide-wrapper[data-index="0"] .slide-card:nth-child(2) { transform: scale(0.85); opacity: 0.7; }
  .slide-wrapper[data-index="0"] .slide-card:nth-child(n+3) { transform: scale(0.7); opacity: 0.5; }

  .slide-wrapper[data-index="1"] .slide-card:nth-child(1) { transform: scale(0.85); opacity: 0.7; }
  .slide-wrapper[data-index="1"] .slide-card:nth-child(2) { transform: scale(1); opacity: 1; }
  .slide-wrapper[data-index="1"] .slide-card:nth-child(3) { transform: scale(0.85); opacity: 0.7; }
  .slide-wrapper[data-index="1"] .slide-card:nth-child(n+4) { transform: scale(0.7); opacity: 0.5; }

  .slide-wrapper[data-index="2"] .slide-card:nth-child(1) { transform: scale(0.7); opacity: 0.5; }
  .slide-wrapper[data-index="2"] .slide-card:nth-child(2) { transform: scale(0.85); opacity: 0.7; }
  .slide-wrapper[data-index="2"] .slide-card:nth-child(3) { transform: scale(1); opacity: 1; }
  .slide-wrapper[data-index="2"] .slide-card:nth-child(4) { transform: scale(0.85); opacity: 0.7; }
  .slide-wrapper[data-index="2"] .slide-card:nth-child(5) { transform: scale(0.7); opacity: 0.5; }

  .slide-wrapper[data-index="3"] .slide-card:nth-child(1) { transform: scale(0.7); opacity: 0.5; }
  .slide-wrapper[data-index="3"] .slide-card:nth-child(2) { transform: scale(0.7); opacity: 0.5; }
  .slide-wrapper[data-index="3"] .slide-card:nth-child(3) { transform: scale(0.85); opacity: 0.7; }
  .slide-wrapper[data-index="3"] .slide-card:nth-child(4) { transform: scale(1); opacity: 1; }
  .slide-wrapper[data-index="3"] .slide-card:nth-child(5) { transform: scale(0.85); opacity: 0.7; }

  .slide-wrapper[data-index="4"] .slide-card:nth-child(1) { transform: scale(0.7); opacity: 0.5; }
  .slide-wrapper[data-index="4"] .slide-card:nth-child(2) { transform: scale(0.7); opacity: 0.5; }
  .slide-wrapper[data-index="4"] .slide-card:nth-child(3) { transform: scale(0.7); opacity: 0.5; }
  .slide-wrapper[data-index="4"] .slide-card:nth-child(4) { transform: scale(0.85); opacity: 0.7; }
  .slide-wrapper[data-index="4"] .slide-card:nth-child(5) { transform: scale(1); opacity: 1; }

  /* 卡片样式 - 完全响应式，使用相对单位 */
  .slide-card :deep(.card),
  .slide-card :deep(.aggregate-card) {
    width: 100% !important;
    height: auto !important;
    min-height: unset !important; /* 移除固定最小高度，让内容自适应 */
    max-height: 85vh !important; /* 限制最大高度，避免超出屏幕 */
    display: flex !important;
    flex-direction: column !important;
    padding-bottom: 0 !important; /* 移除底部内边距 */
  }

  /* 主卡片（聚合卡片）恢复背景 */
  .slide-card:first-child :deep(.aggregate-card) {
    background: url('/static/images/card.png') no-repeat center center !important;
    background-size: 100% 100% !important;
    border: none !important;
    box-shadow: 0 12px 48px rgba(102, 126, 234, 0.25) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  /* 其他卡片保持透明 */
  .slide-card:not(:first-child) :deep(.card) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  /* 卡片内容区域 - 完全响应式 */
  .slide-card :deep(.card-content) {
    flex: 1 1 auto !important;
    display: flex !important;
    flex-direction: column !important;
    padding: clamp(0.08rem, 1vw, 0.12rem) 0 !important;
    height: auto !important;
    min-height: 0 !important; /* 允许收缩 */
    max-height: none !important;
    background: transparent !important;
    overflow-y: auto !important; /* 允许垂直滚动 */
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch !important; /* iOS平滑滚动 */
    touch-action: pan-y !important; /* 允许垂直滑动 */
  }

  /* 卡片头部 */
  .slide-card :deep(.card-header) {
    flex: 0 0 auto !important;
    margin-bottom: clamp(0.04rem, 0.5vw, 0.08rem) !important;
  }

  /* 热搜列表 - 响应式高度 */
  .slide-card :deep(.hot-search-list),
  .slide-card :deep(.data-list),
  .slide-card :deep(.hot-list) {
    flex: 1 1 auto !important;
    min-height: 0 !important; /* 允许收缩 */
    max-height: none !important; /* 移除最大高度限制，由父容器控制 */
    overflow: visible !important; /* 不在这里设置overflow，由card-content控制 */
    display: flex !important;
    flex-direction: column !important;
    gap: clamp(0.02rem, 0.3vw, 0.04rem) !important;
    padding-bottom: 0 !important; /* 移除底部内边距 */
  }

  /* 列表项 - 响应式字体和间距 */
  .slide-card :deep(.hot-item),
  .slide-card :deep(.data-item) {
    flex: 0 0 auto !important;
    padding: clamp(0.04rem, 0.5vw, 0.06rem) 0 !important;
    min-height: unset !important;
    font-size: clamp(0.09rem, 2vw, 0.11rem) !important; /* 响应式字体 */
    margin-bottom: 0 !important;
  }

  /* 底部按钮 */
  .slide-card :deep(.card-footer),
  .slide-card :deep(.view-all-btn) {
    flex: 0 0 auto !important;
    margin-top: clamp(0.02rem, 0.3vw, 0.04rem) !important; /* 减少上边距，往上移动 */
    margin-bottom: 0 !important; /* 移除底部外边距 */
    padding-bottom: 0 !important; /* 移除底部内边距 */
  }

  /* 加载状态 */
  .slide-card :deep(.card-loading),
  .slide-card :deep(.card-error),
  .slide-card :deep(.card-empty) {
    flex: 0 0 auto !important;
    height: auto !important;
    min-height: unset !important;
    padding: clamp(0.12rem, 1.5vw, 0.2rem) !important;
  }

  /* 导航指示点 - 移动端隐藏 */
  .slide-indicators {
    display: none !important;
  }
}

/* 移动端小屏幕专属适配 - 完全响应式 */
@media (max-width: 414px) {
  .mobile-slide-container {
    margin-top: clamp(0.3rem, 2vw, 0.6rem);
    min-height: 55vh;
  }

  /* 小屏幕卡片基础高度 - 移除固定高度 */
  .slide-card :deep(.card),
  .slide-card :deep(.aggregate-card) {
    min-height: unset !important;
    max-height: 80vh !important;
  }

  /* 小屏幕列表最大高度调整 - 移除限制 */
  .slide-card :deep(.hot-search-list),
  .slide-card :deep(.data-list),
  .slide-card :deep(.hot-list) {
    max-height: none !important;
  }
}

@media (max-width: 768px) {
  .corner-card {
    width: 1.4rem;
    height: 1.7rem;
    position: absolute;
  }

  .center-card {
    width: 1.7rem;
    height: 2rem;
    position: absolute;
  }

  .center-dashboard-icon {
    width: 1.4rem;
    height: 0.38rem;
  }

  .page-title {
    font-size: 0.24rem;
  }

  .page-subtitle {
    font-size: 0.16rem;
  }

  .top-left {
    top: 0.12rem;
    left: 0.06rem;
  }

  .top-right {
    top: 0.12rem;
    right: 0.06rem;
  }

  .bottom-left {
    bottom: 0.12rem;
    left: 0.06rem;
  }

  .bottom-right {
    bottom: 0.12rem;
    right: 0.06rem;
  }

  .center-card {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .qna-fab-container,
  .kiana-fab-container {
    touch-action: none;
  }

  /* QNA和Kiana按钮样式 - 完全响应式，往下移动 */
  .qna-fab-container {
    position: fixed;
    bottom: clamp(40px, 6vh, 60px);
    right: clamp(20px, 3vw, 32px);
    z-index: 1000;
    cursor: move;
    user-select: none;
    min-width: clamp(60px, 9vw, 90px); /* 增大触摸判定区域 */
    min-height: clamp(60px, 9vw, 90px);
    padding: clamp(4px, 0.5vw, 8px);
  }

  .kiana-fab-container {
    position: fixed;
    bottom: clamp(40px, 6vh, 60px);
    left: clamp(20px, 3vw, 32px);
    z-index: 1000;
    cursor: move;
    user-select: none;
    min-width: clamp(60px, 9vw, 90px); /* 增大触摸判定区域 */
    min-height: clamp(60px, 9vw, 90px);
    padding: clamp(4px, 0.5vw, 8px);
  }

  .qna-fab,
  .kiana-fab {
    width: clamp(60px, 9vw, 90px);
    height: clamp(60px, 9vw, 90px);
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

  .qna-fab:hover,
  .kiana-fab:hover {
    transform: translateY(-4px) scale(1.1);
    box-shadow: none;
  }

  .qna-fab:active,
  .kiana-fab:active {
    transform: translateY(-2px) scale(1.02);
  }

  .qna-fab:hover + .qna-tooltip,
  .kiana-fab:hover + .kiana-tooltip {
    opacity: 0;
    visibility: hidden;
  }

  .qna-fab .fab-icon-img,
  .kiana-fab .fab-icon-img {
    width: clamp(54px, 8vw, 82px);
    height: clamp(54px, 8vw, 82px);
    animation: pulse 2s ease-in-out infinite;
    pointer-events: none;
  }

  .qna-tooltip {
    position: absolute;
    bottom: clamp(50px, 8vh, 80px);
    right: clamp(-20px, -3vw, -30px);
    background: url('/static/icons/bubble.png') no-repeat center center;
    background-size: contain;
    background-color: transparent;
    color: #ffb3d9;
    padding: clamp(12px, 2vw, 20px) clamp(18px, 3vw, 28px) clamp(10px, 1.5vw, 16px);
    border-radius: 0;
    font-size: clamp(10px, 2vw, 12px); /* 响应式字体 */
    font-weight: 600;
    white-space: nowrap;
    box-shadow: none;
    animation: tooltipBounce 3s ease-in-out infinite;
    pointer-events: none;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: clamp(40px, 6vh, 50px);
    min-width: clamp(120px, 18vw, 150px);
  }

  .kiana-tooltip {
    position: absolute;
    bottom: clamp(50px, 8vh, 80px);
    left: clamp(-20px, -3vw, -30px);
    background: url('/static/icons/bubble.png') no-repeat center center;
    background-size: contain;
    background-color: transparent;
    color: #ffb3d9;
    padding: clamp(12px, 2vw, 20px) clamp(18px, 3vw, 28px) clamp(10px, 1.5vw, 16px);
    border-radius: 0;
    font-size: clamp(10px, 2vw, 12px); /* 响应式字体 */
    font-weight: 600;
    white-space: nowrap;
    box-shadow: none;
    animation: tooltipBounce 3s ease-in-out infinite;
    pointer-events: none;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: clamp(40px, 6vh, 50px);
    min-width: clamp(120px, 18vw, 150px);
  }

  .qna-tooltip::after,
  .kiana-tooltip::after {
    display: none;
  }

  /* 卡片内文字适配 - 响应式字体 */
  .corner-card .card-footer,
  .center-card .card-footer {
    padding: clamp(0.06rem, 0.8vw, 0.08rem) clamp(0.08rem, 1.2vw, 0.12rem);
    font-size: clamp(0.09rem, 1.8vw, 0.11rem); /* 响应式字体 */
  }

  .corner-card .card-footer-icon,
  .center-card .card-footer-icon {
    width: clamp(0.16rem, 2.5vw, 0.2rem);
    height: clamp(0.16rem, 2.5vw, 0.2rem);
  }

  .corner-card .item-title,
  .center-card .item-title {
    font-size: clamp(0.09rem, 1.8vw, 0.11rem); /* 响应式字体 */
  }

  .corner-card .item-heat,
  .center-card .item-heat {
    font-size: clamp(0.07rem, 1.5vw, 0.09rem); /* 响应式字体 */
  }

  .corner-card .item-rank,
  .center-card .item-rank {
    width: clamp(0.26rem, 4vw, 0.32rem);
    height: clamp(0.26rem, 4vw, 0.32rem);
    font-size: clamp(0.11rem, 2vw, 0.13rem); /* 响应式字体 */
  }

  .corner-card .item-rank-container,
  .center-card .item-rank-container {
    width: clamp(0.3rem, 4.5vw, 0.36rem);
    height: clamp(0.3rem, 4.5vw, 0.36rem);
  }

  .corner-card .item-rank-icon.rank-1st,
  .center-card .item-rank-icon.rank-1st {
    width: clamp(0.26rem, 4vw, 0.32rem);
    height: clamp(0.26rem, 4vw, 0.32rem);
  }

  .corner-card .item-rank-icon.rank-2nd,
  .center-card .item-rank-icon.rank-2nd {
    width: clamp(0.24rem, 3.8vw, 0.3rem);
    height: clamp(0.24rem, 3.8vw, 0.3rem);
  }

  .corner-card .item-rank-icon.rank-3rd,
  .center-card .item-rank-icon.rank-3rd {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-65%, -50%);
    width: clamp(0.22rem, 3.5vw, 0.28rem);
    height: clamp(0.22rem, 3.5vw, 0.28rem);
  }
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
  bottom: 80px;
  right: -30px;
  background: url('/static/icons/bubble.png') no-repeat center center;
  background-size: contain;
  background-color: transparent;
  color: #ffb3d9;
  padding: 20px 28px 16px;
  border-radius: 0;
  font-size: 12px;
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

/* Kiana按钮容器 */
.kiana-fab-container {
  position: fixed;
  bottom: 120px;
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
  bottom: 80px;
  left: -30px;
  background: url('/static/icons/bubble.png') no-repeat center center;
  background-size: contain;
  background-color: transparent;
  color: #ffb3d9;
  padding: 20px 28px 16px;
  border-radius: 0;
  font-size: 12px;
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
