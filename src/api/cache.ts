import apiClient from './config'
import type { CacheStats, ApiResponse } from '@/types'

/**
 * 获取缓存统计信息
 */
export const getCacheStats = () => {
  return apiClient.get<any, ApiResponse<CacheStats>>('/api/cache/stats')
}

/**
 * 清空所有缓存
 */
export const clearAllCache = () => {
  return apiClient.post<any, ApiResponse<{ message: string }>>('/api/cache/clear-all')
}

/**
 * 清空指定缓存
 */
export const clearCache = (cacheName: string) => {
  return apiClient.post<any, ApiResponse<{ message: string }>>(`/api/cache/clear/${cacheName}`)
}
