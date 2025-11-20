<script setup lang="ts">
import { onMounted } from 'vue'
import { useAIStore } from '@/stores/ai'
import { ElMessage } from 'element-plus'

const aiStore = useAIStore()

onMounted(() => {
  aiStore.fetchGlobalSummary()
})

const handleRefresh = async () => {
  await aiStore.fetchGlobalSummary()
  ElMessage.success('已刷新总结')
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
</script>

<template>
  <div class="summary-container">
    <div class="header">
      <h1>趋势总结</h1>
      <el-button type="primary" @click="handleRefresh" :loading="aiStore.loading"> 刷新 </el-button>
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
                  <strong>特征：</strong>{{ aiStore.summary.platformAnalysis.weibo.characteristic }}
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
            <el-tab-pane v-if="aiStore.summary.platformAnalysis.TOUTIAO" label="今日头条">
              <div class="platform-analysis">
                <p>
                  <strong>特征：</strong
                  >{{ aiStore.summary.platformAnalysis.TOUTIAO.characteristic }}
                </p>
                <p><strong>总结：</strong>{{ aiStore.summary.platformAnalysis.TOUTIAO.summary }}</p>
                <div class="top-items">
                  <div
                    v-for="item in aiStore.summary.platformAnalysis.TOUTIAO.topItems"
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
</template>

<style scoped lang="css">
.summary-container {
  padding: 20px;
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
</style>
