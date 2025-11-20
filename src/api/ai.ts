import apiClient from './config'
import type {
  AISummary,
  QNARequest,
  QNAResponse,
  EvaluateRequest,
  EvaluateResponse,
  ApiResponse,
} from '@/types'

/**
 * 获取全局 AI 总结
 */
export const getGlobalSummary = () => {
  return apiClient.get<any, ApiResponse<AISummary>>('/api/ai/summary/global')
}

/**
 * 按平台获取 AI 总结
 */
export const getPlatformSummary = (platform: string) => {
  return apiClient.get<any, ApiResponse<AISummary>>(`/api/ai/summary/platform/${platform}`)
}

/**
 * 提问（QNA）
 */
export const askQuestion = (payload: QNARequest) => {
  return apiClient.post<any, ApiResponse<QNAResponse>>('/api/ai/qna', payload)
}

/**
 * 获取单条热搜的 AI 评价
 */
export const evaluateHotSearch = (payload: EvaluateRequest) => {
  return apiClient.post<any, ApiResponse<EvaluateResponse>>('/api/ai/evaluate', payload)
}

export default {
  getGlobalSummary,
  getPlatformSummary,
  askQuestion,
  evaluateHotSearch,
}
