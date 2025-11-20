import apiClient from './config'
import type { HotSearchItem, Platform, ApiResponse } from '@/types'

/**
 * 获取热搜数据（支持平台和分类过滤）
 * 后端已优化为单一接口，支持参数过滤
 */
export const getHotSearch = (platform?: Platform, category?: string) => {
  const params: Record<string, string> = {}
  if (platform) params.platform = platform
  if (category) params.category = category
  return apiClient.get<any, ApiResponse<HotSearchItem[]>>('/api/hot-search', { params })
}

/**
 * 获取所有热搜数据
 */
export const getAllHotSearch = () => {
  return getHotSearch()
}

/**
 * 按平台获取热搜数据
 */
export const getHotSearchByPlatform = (platform: Platform) => {
  return getHotSearch(platform)
}

/**
 * 按分类获取热搜数据
 */
export const getHotSearchByCategory = (category: string, platform?: Platform) => {
  return getHotSearch(platform, category)
}

/**
 * 刷新热搜数据（使用缓存，快速）
 * 后端现在直接返回数据，不再只返回消息
 */
export const refreshHotSearch = () => {
  return apiClient.post<any, ApiResponse<HotSearchItem[]>>('/api/hot-search/refresh')
}

/**
 * 获取搜索建议
 */
export const getSearchSuggestions = (keyword?: string) => {
  const params = keyword ? { keyword } : {}
  return apiClient.get<any, ApiResponse<HotSearchItem[]>>('/api/search/suggestions', { params })
}

/**
 * 获取分类统计信息
 */
export const getClassificationStats = () => {
  return apiClient.get<
    any,
    ApiResponse<{
      totalCount: number
      classifiedCount: number
      pendingCount: number
      classificationPercentage: number
      isClassifying: boolean
    }>
  >('/api/hot-search/classification-stats')
}

/**
 * 热搜 API 默认导出（用于组件调用）
 */
export default {
  getHotSearches: async (params: { platform?: Platform; category?: string }) => {
    const response = await getHotSearch(params.platform, params.category)
    return response.data || []
  },
  refreshHotSearches: async () => {
    const response = await refreshHotSearch()
    return response.data || []
  },
  getAllHotSearch,
  getHotSearchByPlatform,
  getHotSearchByCategory,
  getSearchSuggestions,
  getClassificationStats,
}
