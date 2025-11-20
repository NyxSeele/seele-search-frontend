<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Navbar from '@/components/Navbar.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import HotSearchCard from '@/components/HotSearchCard.vue'
import AggregateCard from '@/components/AggregateCard.vue'
import FullListModal from '@/components/FullListModal.vue'
import AISummaryPopover from '@/components/AISummaryPopover.vue'
import QNAPanel from '@/components/QNAPanel.vue'
import Footer from '@/components/Footer.vue'
import { Platform, HotSearchItem, AISummary } from '@/types'
import hotSearchApi from '@/api/hotSearch'
import aiApi from '@/api/ai'
import { sortByAggregateScore, sortWithPlatformBalance } from '@/utils/aggregateRanking'

// 各平台数据
const weiboItems = ref<HotSearchItem[]>([])
const TOUTIAOItems = ref<HotSearchItem[]>([])
const bilibiliItems = ref<HotSearchItem[]>([])
const douyinItems = ref<HotSearchItem[]>([])
const aggregateItems = ref<HotSearchItem[]>([])

// 加载状态
const weiboLoading = ref(false)
const TOUTIAOLoading = ref(false)
const bilibiliLoading = ref(false)
const douyinLoading = ref(false)
const aggregateLoading = ref(false)

// 错误状态
const weiboError = ref('')
const TOUTIAOError = ref('')
const bilibiliError = ref('')
const douyinError = ref('')
const aggregateError = ref('')

// 弹窗
const modalVisible = ref(false)
const modalPlatform = ref<Platform>(Platform.WEIBO)
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

// 加载单个平台数据（前10）
const loadPlatformData = async (platform: Platform) => {
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

  loadingRef.value = true
  errorRef.value = ''
  try {
    const response = await hotSearchApi.getHotSearches({ platform })
    console.log(`📊 ${platform}平台原始数据:`, response.length, '条')
    
    // 打印前3条数据用于调试
    if (response.length > 0) {
      console.log(`📋 ${platform}前3条数据样本:`, response.slice(0, 3).map(item => ({
        title: item.title,
        platform: item.platform,
        heat: item.heat,
        category: item.category
      })))
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
        item.title.trim().length > 0
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
  } catch (error) {
    console.error(`❌ 加载${platform}失败:`, error)
    errorRef.value = '加载失败'
  } finally {
    loadingRef.value = false
  }
}

// 加载聚合数据（四个平台各随机10条）
const loadAggregateData = async () => {
  aggregateLoading.value = true
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
      (item) => item.heat >= 0 && !item.title?.includes('【降级数据】') && item.title && item.title.trim().length > 0,
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
        item.platform === platform && item.heat >= 0 && !item.title?.includes('【降级数据】') && item.title && item.title.trim().length > 0,
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
  modalPlatform.value = 'AGGREGATE' as Platform // 设置为聚合类型
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
      (item) => item.heat >= 0 && !item.title?.includes('【降级数据】') && item.title && item.title.trim().length > 0,
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
const handleGlobalAISummary = async (element: HTMLElement) => {
  aiTriggerElement.value = element
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
    handleGlobalAISummary()
  }
}

// 自动刷新定时器
let aggregateRefreshTimer: NodeJS.Timeout | null = null
let platformRefreshTimer: NodeJS.Timeout | null = null

const startAutoRefresh = () => {
  console.log('🔄 启动自动刷新...')

  // 聚合卡片每30秒刷新一次
  aggregateRefreshTimer = setInterval(() => {
    console.log('🔄 自动刷新聚合数据...')
    loadAggregateData()
  }, 30000) // 30秒

  // 四个小卡片每30秒刷新一次
  platformRefreshTimer = setInterval(() => {
    console.log('🔄 自动刷新四个平台数据...')
    loadPlatformData(Platform.WEIBO)
    loadPlatformData(Platform.TOUTIAO)
    loadPlatformData(Platform.BILIBILI)
    loadPlatformData(Platform.DOUYIN)
  }, 30000) // 30秒
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
  console.log('🛑 停止自动刷新')
}

onMounted(() => {
  // 初始加载所有数据
  console.log('🚀 页面加载，开始获取数据...')
  loadPlatformData(Platform.WEIBO)
  loadPlatformData(Platform.TOUTIAO)
  loadPlatformData(Platform.BILIBILI)
  loadPlatformData(Platform.DOUYIN)
  loadAggregateData()

  // 启动自动刷新
  startAutoRefresh()
})

onBeforeUnmount(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="hot-search-page">
    <AnimatedBackground />
    <Navbar />

    <main class="page-content">
      <div class="hot-search-container">
        <!-- 中间标题区 -->
        <div class="center-header">
          <h1 class="page-title">热搜聚合</h1>
          <p class="page-subtitle">实时追踪全平台热点话题</p>
        </div>

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

<style scoped>
.hot-search-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.page-content {
  position: relative;
  height: calc(100vh - 60px);
  overflow: hidden;
  padding: 0;
}

.hot-search-container {
  position: relative;
  height: 100%;
  width: 100%;
}

/* 中间标题区 - 调整位置，往上移动 */
.center-header {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 5;
  background: transparent;
  padding: 16px 32px;
  margin-bottom: 40px;
}

.page-title {
  font-size: 36px;
  font-weight: 900;
  margin: 0 0 8px 0;
  color: #2c3e50;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
}

.page-subtitle {
  font-size: 18px;
  color: #2c3e50;
  margin: 0;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
}

/* 四个角落的卡片 - 缩小尺寸 */
.corner-card {
  position: absolute;
  width: 280px;
  height: 350px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.corner-card:hover {
  transform: scale(1.02);
  z-index: 10;
}

/* 左上 - 微博卡片位置（往内靠）*/
.top-left {
  top: 20px;
  left: 80px;
}

/* 右上 - 今日头条卡片位置（往内靠）*/
.top-right {
  top: 20px;
  right: 80px;
}

/* 左下 - B站卡片位置（往内靠）*/
.bottom-left {
  bottom: 20px;
  left: 80px;
}

/* 右下 - 抖音卡片位置（往内靠）*/
.bottom-right {
  bottom: 20px;
  right: 80px;
}

/* 中间聚合卡片 - 调整位置和大小 */
.center-card {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -40%);
  width: 450px;
  height: 600px;
  z-index: 6;
}

.center-card:hover {
  transform: translate(-50%, -40%) scale(1.02);
}

@media (max-width: 1200px) {
  .corner-card {
    width: 280px;
    height: 350px;
  }

  .center-card {
    width: 320px;
    height: 420px;
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
</style>
