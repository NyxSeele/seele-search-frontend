<script setup lang="ts">
import { ref } from 'vue'
import { useAIStore } from '@/stores/ai'
import { Platform } from '@/types'
import { ElMessage } from 'element-plus'

const aiStore = useAIStore()
const question = ref('')
const selectedPlatform = ref<Platform | null>(null)

// 格式化时间 - 直接显示字符串，不要解析
// 后端已经返回格式化的字符串：2025-11-16 15:30:45
const formatTime = (dateString?: string) => {
  if (!dateString) return '-'
  // 直接返回后端的字符串格式，不要尝试解析
  return dateString
}

// 获取分类置信度标识
const getCategoryConfidenceIcon = (confidence?: number) => {
  if (!confidence) return ''
  if (confidence > 0.9) return '✓'
  if (confidence > 0.5) return '~'
  return ''
}

// 获取平台标签颜色
const getPlatformColor = (platform: Platform) => {
  const map: Record<Platform, string> = {
    [Platform.WEIBO]: '#E6162D',
    [Platform.TOUTIAO]: '#2319DC',
    [Platform.BILIBILI]: '#64B5F6',  // 浅蓝色
    [Platform.DOUYIN]: '#000000',
  }
  return map[platform]
}

// 获取平台标签文本
const getPlatformLabel = (platform: Platform) => {
  const map: Record<Platform, string> = {
    [Platform.WEIBO]: '微博',
    [Platform.TOUTIAO]: '今日头条',
    [Platform.BILIBILI]: 'Bilibili',
    [Platform.DOUYIN]: '抖音',
  }
  return map[platform]
}

// 打开链接
const handleOpenUrl = (url?: string) => {
  if (!url) {
    ElMessage.warning('该热搜没有链接')
    return
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    ElMessage.warning('链接格式不正确')
    return
  }
  window.open(url, '_blank')
  ElMessage.success('已打开链接')
}

const platforms = [
  { label: '全部', value: null },
  { label: '微博', value: Platform.WEIBO },
  { label: '今日头条', value: Platform.TOUTIAO },
  { label: 'Bilibili', value: Platform.BILIBILI },
  { label: '抖音', value: Platform.DOUYIN },
]

const handleAsk = async () => {
  if (!question.value.trim()) {
    ElMessage.warning('请输入问题')
    return
  }

  await aiStore.askQuestion(question.value, selectedPlatform.value || undefined)
  if (!aiStore.error) {
    ElMessage.success('提问成功')
  }
}

const handleClear = () => {
  question.value = ''
  aiStore.reset()
}
</script>

<template>
  <div class="qna-page">
    <div class="animated-overlay"></div>
    <div class="qna-container">
    <div class="header">
      <h1>智能问答</h1>
    </div>

    <!-- 问题输入 -->
    <el-card class="question-card">
      <template #header>
        <div class="card-header">
          <span>提出你的问题</span>
        </div>
      </template>

      <div class="form-group">
        <label>问题</label>
        <el-input
          v-model="question"
          type="textarea"
          :rows="4"
          placeholder="例如：最近有什么热点话题？"
          maxlength="500"
          show-word-limit
        />
      </div>

      <div class="form-group">
        <label>平台筛选（可选）</label>
        <el-radio-group v-model="selectedPlatform">
          <el-radio-button
            v-for="platform in platforms"
            :key="platform.value"
            :label="platform.value"
          >
            {{ platform.label }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="button-group">
        <el-button type="primary" @click="handleAsk" :loading="aiStore.loading"> 提问 </el-button>
        <el-button @click="handleClear">清空</el-button>
      </div>
    </el-card>

    <!-- 错误提示 -->
    <el-alert
      v-if="aiStore.error"
      :title="aiStore.error"
      type="error"
      closable
      style="margin-bottom: 16px"
    />

    <!-- 答案显示 -->
    <el-card v-if="aiStore.qnaResponse" class="answer-card">
      <template #header>
        <div class="card-header">
          <span>AI 回答</span>
        </div>
      </template>

      <div class="answer-content">
        <p>{{ aiStore.qnaResponse.answer }}</p>
      </div>

      <div
        v-if="aiStore.qnaResponse.sources && aiStore.qnaResponse.sources.length > 0"
        class="sources"
      >
        <h4>参考来源：</h4>
        <ul>
          <li v-for="(source, index) in aiStore.qnaResponse.sources" :key="index">
            {{ source }}
          </li>
        </ul>
      </div>

      <!-- 相关热搜列表 -->
      <div
        v-if="
          aiStore.qnaResponse.relatedHotSearches &&
          aiStore.qnaResponse.relatedHotSearches.length > 0
        "
        class="related-hotsearch"
      >
        <h4>相关热搜：</h4>
        <el-table :data="aiStore.qnaResponse.relatedHotSearches" stripe style="width: 100%">
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="platform" label="平台" width="80" align="center">
            <template #default="{ row }">
              <el-tag :style="{ backgroundColor: getPlatformColor(row.platform), color: '#fff' }">
                {{ getPlatformLabel(row.platform) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="rank" label="排名" width="60" align="center" />
          <el-table-column label="分类" width="100" align="center">
            <template #default="{ row }">
              <div
                v-if="row.category && row.category !== '待评估'"
                style="display: flex; align-items: center; justify-content: center; gap: 4px"
              >
                <span style="color: #666; font-size: 12px">{{ row.category }}</span>
                <span
                  v-if="getCategoryConfidenceIcon(row.categoryConfidence)"
                  :style="{
                    color:
                      row.categoryConfidence && row.categoryConfidence > 0.9
                        ? '#67c23a'
                        : '#e6a23c',
                    fontSize: '12px',
                  }"
                >
                  {{ getCategoryConfidenceIcon(row.categoryConfidence) }}
                </span>
              </div>
              <!-- 处理"待评估"分类 -->
              <span v-else-if="row.category === '待评估'" style="color: #e6a23c; font-size: 12px">
                评估中...
              </span>
              <span v-else style="color: #ccc; font-size: 12px">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                @click="handleOpenUrl(row.url)"
                v-if="row.url"
              >
                查看
              </el-button>
              <span v-else style="color: #999; font-size: 12px">无链接</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-empty
      v-if="!aiStore.qnaResponse && !aiStore.loading"
      description="提出问题后，AI 将为你生成答案"
      style="margin-top: 40px"
    />
    </div>
  </div>
</template>

<style scoped lang="css">
.qna-page {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: url('/static/images/background2.jpg') no-repeat center center;
  background-size: cover;
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
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.12);
  }
}

@keyframes flowingLight {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(50%);
  }
}

.qna-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-card {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #303133;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.button-group :deep(.el-button--primary) {
  background: url('/static/icons/banner2.png') no-repeat center center !important;
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

.button-group :deep(.el-button:not(.el-button--primary)) {
  background: url('/static/icons/gold banner.png') no-repeat center center !important;
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

.answer-card {
  margin-bottom: 20px;
}

.answer-content {
  line-height: 1.8;
  color: #333;
  font-size: 14px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.answer-content p {
  margin: 0;
}

.sources {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #dcdfe6;
}

.sources h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.sources ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sources li {
  padding: 8px 0;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}

.sources li:last-child {
  border-bottom: none;
}

.related-hotsearch {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #dcdfe6;
}

.related-hotsearch h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

/* 平台选择按钮高亮动效 */
.form-group :deep(.el-radio-button__inner) {
  transition: all 0.3s ease;
}

.form-group :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border-color: #667eea !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transform: scale(1.05);
}

.form-group :deep(.el-radio-button__inner) {
  border-color: #dcdfe6;
  color: #606266;
}

.form-group :deep(.el-radio-button__inner:hover) {
  color: #667eea;
}
</style>
