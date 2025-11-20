<template>
  <div class="home-page">
    <AnimatedBackground />
    <Navbar />

    <main class="home-content">
      <div class="search-section">
        <h1 class="welcome-title">
          <span class="title-gradient">探索热搜</span>
          <span class="title-subtitle">发现世界正在发生什么</span>
        </h1>

        <div class="action-buttons">
          <router-link to="/hot-search" class="view-hot-search-btn"> 查看热搜 </router-link>
        </div>

        <div class="search-container">
          <div class="search-box-wrapper">
            <svg class="search-icon-left" width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path
                d="M7 12.5C10.0376 12.5 12.5 10.0376 12.5 7C12.5 3.96243 10.0376 1.5 7 1.5C3.96243 1.5 1.5 3.96243 1.5 7C1.5 10.0376 3.96243 12.5 7 12.5Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M14.5 14.5L10.875 10.875"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="搜索任何内容..."
              @focus="showSuggestions = true"
              @input="handleSearchInput"
              @keyup.enter="handleSearch"
            />
            <button v-if="searchQuery" class="clear-button" @click="clearSearch" title="清除">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
            <button class="mic-button" title="语音输入">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 11C9.65685 11 11 9.65685 11 8V3C11 1.34315 9.65685 0 8 0C6.34315 0 5 1.34315 5 3V8C5 9.65685 6.34315 11 8 11Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M3 8C3 10.7614 5.23858 13 8 13C10.7614 13 13 10.7614 13 8"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <path
                  d="M8 13V16"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
            <button class="search-button" @click="handleSearch" title="搜索">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path
                  d="M7 12.5C10.0376 12.5 12.5 10.0376 12.5 7C12.5 3.96243 10.0376 1.5 7 1.5C3.96243 1.5 1.5 3.96243 1.5 7C1.5 10.0376 3.96243 12.5 7 12.5Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M14.5 14.5L10.875 10.875"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <!-- 搜索建议下拉框 - Edge风格 -->
          <div
            v-if="showSuggestions && searchQuery && searchSuggestions.length > 0"
            class="suggestions-dropdown"
          >
            <!-- 搜索建议 -->
            <div
              v-for="(suggestion, index) in searchSuggestions"
              :key="index"
              class="suggestion-item"
              @click="handleSearchSuggestion(suggestion)"
            >
              <svg class="search-icon-svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M7 12.5C10.0376 12.5 12.5 10.0376 12.5 7C12.5 3.96243 10.0376 1.5 7 1.5C3.96243 1.5 1.5 3.96243 1.5 7C1.5 10.0376 3.96243 12.5 7 12.5Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M14.5 14.5L10.875 10.875"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div class="suggestion-content">
                <div class="suggestion-title">{{ suggestion }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import QNAPanel from '@/components/QNAPanel.vue'
import Footer from '@/components/Footer.vue'
import hotSearchApi from '@/api/hotSearch'
import { HotSearchItem, Platform } from '@/types'

const router = useRouter()
const searchQuery = ref('')
const showSuggestions = ref(false)
const loadingSuggestions = ref(false)
const searchSuggestions = ref<string[]>([])
const qnaPanelVisible = ref(false)

const getPlatformLabel = (platform: Platform) => {
  const map: Record<Platform, string> = {
    [Platform.WEIBO]: '微博',
    [Platform.TOUTIAO]: '今日头条',
    [Platform.BILIBILI]: 'B站',
    [Platform.DOUYIN]: '抖音',
  }
  return map[platform]
}

// 防抖处理
let searchTimer: NodeJS.Timeout | null = null

const handleSearchInput = async () => {
  if (!searchQuery.value.trim()) {
    searchSuggestions.value = []
    showSuggestions.value = false
    return
  }

  showSuggestions.value = true

  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  // 防抖，50ms后才请求，提升响应速度
  searchTimer = setTimeout(async () => {
    loadingSuggestions.value = true
    try {
      const query = searchQuery.value.trim()
      // 使用今日头条搜索建议API（JSONP方式，更稳定）
      const callbackName = 'TOUTIAOSuggestion'

      // 定义全局回调函数
      ;(window as any)[callbackName] = (data: any) => {
        try {
          if (data && data.s && Array.isArray(data.s)) {
            searchSuggestions.value = data.s.slice(0, 7)
          } else {
            searchSuggestions.value = []
          }
        } catch (e) {
          console.error('解析建议失败:', e)
          searchSuggestions.value = []
        }
        loadingSuggestions.value = false
      }

      const script = document.createElement('script')
      script.src = `https://suggestion.TOUTIAO.com/su?wd=${encodeURIComponent(query)}&cb=${callbackName}`

      // 错误处理
      script.onerror = () => {
        searchSuggestions.value = []
        loadingSuggestions.value = false
      }

      document.head.appendChild(script)

      // 超时处理和清理
      setTimeout(() => {
        loadingSuggestions.value = false
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
      }, 2000)
    } catch (error) {
      console.error('获取搜索建议失败:', error)
      searchSuggestions.value = []
      loadingSuggestions.value = false
    }
  }, 50)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchSuggestions.value = []
}

const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  showSuggestions.value = false
  // 跳转到Bing搜索
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery.value)}`
  window.open(searchUrl, '_blank')
}

const handleSearchSuggestion = (suggestion: string) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  // 跳转到Bing搜索
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(suggestion)}`
  window.open(searchUrl, '_blank')
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.search-container')) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.home-content {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 80px 20px 40px;
}

.search-section {
  text-align: center;
  width: 100%;
  max-width: 750px;
}

.welcome-title {
  margin: 0 0 48px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.title-gradient {
  font-size: 56px;
  font-weight: 800;
  color: #2c3e50;
  letter-spacing: -2px;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
}

.title-subtitle {
  font-size: 18px;
  color: #2c3e50;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.search-container {
  position: relative;
}

.search-box-wrapper {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 32px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  transition: all 0.2s ease;
  padding: 0 20px;
  gap: 12px;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-box-wrapper:hover {
  background: #fff;
  border-color: #d0d0d0;
}

.search-box-wrapper:focus-within {
  border-color: #0ea5e9;
  box-shadow: 0 2px 12px rgba(14, 165, 233, 0.3);
}

.search-icon-left {
  color: #5f6368;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.search-input {
  flex: 1;
  padding: 0;
  border: none;
  outline: none;
  font-size: 16px;
  color: #202124;
  background: transparent;
  min-width: 0;
  line-height: 60px;
}

.search-input::placeholder {
  color: #5f6368;
}

.clear-button,
.mic-button,
.search-button {
  padding: 8px;
  border: none;
  background: transparent;
  color: #5f6368;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.15s ease;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
}

.clear-button:hover,
.mic-button:hover,
.search-button:hover {
  background: rgba(0, 0, 0, 0.06);
}

.clear-button:active,
.mic-button:active,
.search-button:active {
  background: rgba(0, 0, 0, 0.1);
}

.mic-button {
  color: #0078d4;
}

.search-button {
  color: #0078d4;
}

.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow: hidden;
  z-index: 100;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestions-loading,
.suggestions-empty {
  padding: 24px;
  text-align: center;
  color: #999;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e8e8e8;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-right: 8px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;
  border-left: 3px solid transparent;
}

.suggestion-item:hover {
  background: #f5f7fa;
  border-left-color: #667eea;
}

.search-icon-svg {
  flex-shrink: 0;
  color: #666;
  opacity: 0.7;
}

.suggestion-item:hover .search-icon-svg {
  color: #667eea;
  opacity: 1;
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
  font-weight: 400;
}

.suggestion-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.suggestion-platform {
  color: #1890ff;
}

.suggestion-category {
  color: #999;
}

.view-hot-search-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 32px;
  background: #fff;
  color: #0078d4;
  border-radius: 24px;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 120, 212, 0.2);
}

.view-hot-search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 120, 212, 0.2);
  background: #f8f9fa;
}

.view-hot-search-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .title-gradient {
    font-size: 40px;
  }

  .title-subtitle {
    font-size: 16px;
  }

  .search-input {
    padding: 14px 20px;
    font-size: 14px;
  }

  .view-hot-search-btn {
    padding: 14px 32px;
    font-size: 15px;
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
