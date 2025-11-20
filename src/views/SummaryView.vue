<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAIStore } from '@/stores/ai'
import QNAPanel from '@/components/QNAPanel.vue'
import { pushSummaryToQnaPanel } from '@/utils/qnaSummary'

const aiStore = useAIStore()

onMounted(() => {
  aiStore.fetchGlobalSummary()
})

const handleRefresh = async () => {
  await aiStore.fetchGlobalSummary()
}

const getHeatLevelColor = (level: string) => {
  const map: Record<string, string> = {
    HIGH: '#F56C6C',
    MEDIUM: '#E6A23C',
    LOW: '#67C23A',
  }
  return map[level] || '#909399'
}

const getHeatLevelLabel = (level: string) => {
  const map: Record<string, string> = {
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
  }
  return map[level] || level
}

// QNA面板
const qnaPanelVisible = ref(false)
const lastSummarySignature = ref('')

// QNA按钮拖动
const qnaFabPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const hasDragged = ref(false)
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
  if (isDragging.value) {
    hasDragged.value = true
    qnaFabPosition.value = {
      x: e.clientX - dragStart.value.x,
      y: e.clientY - dragStart.value.y,
    }
  }
}

const handleQnaMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleQnaMouseMove)
  document.removeEventListener('mouseup', handleQnaMouseUp)
}

const handleQnaClick = () => {
  // 只有在没有拖动的情况下才切换面板
  if (!hasDragged.value) {
    qnaPanelVisible.value = !qnaPanelVisible.value
    hideTooltipTemporarily()
  }
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

const focusQnaPanel = () => {
  qnaPanelVisible.value = true
  hideTooltipTemporarily()
  window.dispatchEvent(new CustomEvent('qna:force-scroll'))
}

watch(
  () => aiStore.summary,
  (summary) => {
    if (!summary) return
    const signature = JSON.stringify(summary)
    if (signature === lastSummarySignature.value) return
    lastSummarySignature.value = signature
    pushSummaryToQnaPanel('趋势总结', summary)
    focusQnaPanel()
  },
  { deep: true },
)
</script>

<template>
  <div class="summary-page">
    <div class="summary-container">
      <div class="header">
        <h1>趋势总结</h1>
        <el-button type="primary" @click="handleRefresh" :loading="aiStore.loading">
          刷新
        </el-button>
      </div>

      <el-alert
        v-if="aiStore.error"
        :title="aiStore.error"
        type="error"
        closable
        style="margin-bottom: 16px"
      />

      <el-skeleton :loading="aiStore.loading" animated>
        <template v-if="aiStore.summary">
          <!-- 全局总结 -->
          <el-card class="summary-card">
            <template #header>
              <div class="card-header">
                <span>全局趋势分析</span>
              </div>
            </template>
            <p class="summary-text">{{ aiStore.summary.summary }}</p>
          </el-card>

          <!-- 核心话题 -->
          <el-card class="summary-card">
            <template #header>
              <div class="card-header">
                <span>核心话题</span>
              </div>
            </template>
            <div class="topics-grid">
              <div
                v-for="(topic, index) in aiStore.summary.coreTopics"
                :key="index"
                class="topic-item"
              >
                <div class="topic-header">
                  <h3>{{ topic.topic }}</h3>
                  <el-tag
                    :style="{ backgroundColor: getHeatLevelColor(topic.heatLevel) }"
                    style="color: #fff"
                  >
                    {{ getHeatLevelLabel(topic.heatLevel) }}
                  </el-tag>
                </div>
                <p class="topic-description">{{ topic.description }}</p>
                <div class="topic-platforms">
                  <el-tag v-for="platform in topic.platforms" :key="platform" type="info">
                    {{ platform }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 平台分析 -->
          <el-card class="summary-card">
            <template #header>
              <div class="card-header">
                <span>平台分析</span>
              </div>
            </template>
            <el-tabs>
              <el-tab-pane v-if="aiStore.summary.platformAnalysis.weibo" label="微博">
                <div class="platform-analysis">
                  <p>
                    <strong>特征：</strong
                    >{{ aiStore.summary.platformAnalysis.weibo.characteristic }}
                  </p>
                  <p><strong>总结：</strong>{{ aiStore.summary.platformAnalysis.weibo.summary }}</p>
                  <div class="top-items">
                    <div
                      v-for="item in aiStore.summary.platformAnalysis.weibo.topItems"
                      :key="item.rank"
                      class="top-item"
                    >
                      <span class="rank">{{ item.rank }}</span>
                      <span class="title">{{ item.title }}</span>
                      <span class="heat">{{ item.heatValue }}</span>
                      <el-tag type="success">{{ item.trend }}</el-tag>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane v-if="aiStore.summary.platformAnalysis.toutiao" label="今日头条">
                <div class="platform-analysis">
                  <p>
                    <strong>特征：</strong
                    >{{ aiStore.summary.platformAnalysis.toutiao.characteristic }}
                  </p>
                  <p>
                    <strong>总结：</strong>{{ aiStore.summary.platformAnalysis.toutiao.summary }}
                  </p>
                  <div class="top-items">
                    <div
                      v-for="item in aiStore.summary.platformAnalysis.toutiao.topItems"
                      :key="item.rank"
                      class="top-item"
                    >
                      <span class="rank">{{ item.rank }}</span>
                      <span class="title">{{ item.title }}</span>
                      <span class="heat">{{ item.heatValue }}</span>
                      <el-tag type="success">{{ item.trend }}</el-tag>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane v-if="aiStore.summary.platformAnalysis.bilibili" label="B站">
                <div class="platform-analysis">
                  <p>
                    <strong>特征：</strong
                    >{{ aiStore.summary.platformAnalysis.bilibili.characteristic }}
                  </p>
                  <p>
                    <strong>总结：</strong>{{ aiStore.summary.platformAnalysis.bilibili.summary }}
                  </p>
                  <div class="top-items">
                    <div
                      v-for="item in aiStore.summary.platformAnalysis.bilibili.topItems"
                      :key="item.rank"
                      class="top-item"
                    >
                      <span class="rank">{{ item.rank }}</span>
                      <span class="title">{{ item.title }}</span>
                      <span class="heat">{{ item.heatValue }}</span>
                      <el-tag type="success">{{ item.trend }}</el-tag>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>

          <!-- 跨平台洞察 -->
          <el-card class="summary-card">
            <template #header>
              <div class="card-header">
                <span>跨平台洞察</span>
              </div>
            </template>
            <ul class="insights-list">
              <li v-for="(insight, index) in aiStore.summary.crossPlatformInsights" :key="index">
                {{ insight }}
              </li>
            </ul>
          </el-card>
        </template>
      </el-skeleton>
    </div>

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
      <div v-if="showQnaTooltip" class="qna-tooltip">有什么问题都可以点我哦</div>
    </div>

    <!-- QNA面板 -->
    <QNAPanel :visible="qnaPanelVisible" @close="qnaPanelVisible = false" />
  </div>
</template>

<style scoped lang="css">
.summary-page {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: url('/static/images/background2.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
}

.summary-container {
  padding: 20px;
  position: relative;
  z-index: 2;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.header :deep(.el-button) {
  background: url('/static/icons/gold banner2.png') no-repeat center center !important;
  background-size: 100% 100% !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  padding: 10px 28px !important;
  min-height: 42px !important;
  font-size: 15px !important;
}

.summary-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-text {
  line-height: 1.8;
  color: #333;
  margin: 0;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.topic-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  background-color: #f5f7fa;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.topic-header h3 {
  margin: 0;
  font-size: 16px;
}

.topic-description {
  color: #606266;
  margin: 8px 0;
  line-height: 1.6;
}

.topic-platforms {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.platform-analysis {
  padding: 16px 0;
}

.platform-analysis p {
  margin: 12px 0;
  line-height: 1.6;
}

.top-items {
  margin-top: 16px;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.top-item:last-child {
  border-bottom: none;
}

.rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: #f56c6c;
  color: #fff;
  border-radius: 50%;
  font-weight: bold;
  font-size: 12px;
  flex-shrink: 0;
}

.title {
  flex: 1;
  color: #303133;
}

.heat {
  color: #909399;
  min-width: 80px;
  text-align: right;
}

.insights-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.insights-list li {
  padding: 12px;
  margin-bottom: 8px;
  background-color: #f5f7fa;
  border-left: 3px solid #409eff;
  border-radius: 2px;
}

/* AI提问悬浮按钮容器 */
.qna-fab-container {
  position: fixed;
  bottom: 32px;
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
  opacity: 1;
  visibility: visible;
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

.qna-fab:hover + .qna-tooltip {
  opacity: 0;
  visibility: hidden;
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

