import { reactive } from 'vue'
import type { AISummary, Platform, QNAResponse } from '@/types'
import aiApi from '@/api/ai'

const store = reactive({
  summary: null as AISummary | null,
  qnaResponse: null as QNAResponse | null,
  loading: false,
  error: '',
  async fetchGlobalSummary() {
    store.loading = true
    store.error = ''
    try {
      const response = await aiApi.getGlobalSummary()
      store.summary = response.data
    } catch (err) {
      console.error('获取全局总结失败:', err)
      store.summary = null
      store.error = '获取总结失败，请稍后重试'
    } finally {
      store.loading = false
    }
  },
  async askQuestion(question: string, platform?: Platform) {
    if (!question.trim()) return
    store.loading = true
    store.error = ''
    try {
      const response = await aiApi.askQuestion({
        question,
        platformFilter: platform,
      })
      store.qnaResponse = response.data
    } catch (err) {
      console.error('AI提问失败:', err)
      store.error = 'AI回答失败，请稍后重试'
      store.qnaResponse = null
    } finally {
      store.loading = false
    }
  },
  reset() {
    store.qnaResponse = null
    store.error = ''
  },
})

export const useAIStore = () => store

