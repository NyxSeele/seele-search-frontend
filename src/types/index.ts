/**
 * 热搜平台类型
 */
export enum Platform {
  WEIBO = 'WEIBO',
  TOUTIAO = 'TOUTIAO', // 原今日头条改为今日头条
  BILIBILI = 'BILIBILI',
  DOUYIN = 'DOUYIN',
}

/**
 * 热搜项目
 */
export interface HotSearchItem {
  id: number
  title: string
  platform: Platform
  heat: number
  rank: number
  url: string
  category: string
  // 分类置信度（0.0-1.0），来自后端 enriched API
  categoryConfidence?: number
  actualSource: string
  degradedReason: string | null
  capturedAt: string
  createdAt: string
  updatedAt: string
}

/**
 * 核心话题
 */
export interface CoreTopic {
  topic: string
  description: string
  platforms: Platform[]
  heatLevel: 'HIGH' | 'MEDIUM' | 'LOW'
}

/**
 * 平台分析 - 单个平台
 */
export interface PlatformAnalysisItem {
  characteristic: string
  summary: string
  topItems: Array<{
    rank: number
    title: string
    heatValue: number
    trend: string
  }>
}

/**
 * AI 总结
 */
export interface AISummary {
  summary: string
  coreTopics: CoreTopic[]
  platformAnalysis: {
    weibo?: PlatformAnalysisItem
    toutiao?: PlatformAnalysisItem
    bilibili?: PlatformAnalysisItem
    douyin?: PlatformAnalysisItem
  }
  crossPlatformInsights: string[]
  dataStatus: {
    weibo: string
    toutiao: string
    bilibili: string
    douyin: string
  }
}

/**
 * QNA 请求
 */
export interface QNARequest {
  question: string
  platformFilter?: Platform
}

/**
 * QNA 响应中的相关热搜项
 */
export interface RelatedHotSearch {
  title: string
  platform: Platform
  heat?: number
  rank?: number
  category?: string
  url?: string
  categoryConfidence?: number
}

/**
 * QNA 响应
 */
export interface QNAResponse {
  answer: string
  sources?: string[]
  relatedHotSearches?: RelatedHotSearch[]
}

/**
 * 评价请求
 */
export interface EvaluateRequest {
  title: string
  platform: Platform
}

/**
 * 评价响应
 */
export interface EvaluateResponse {
  evaluation: string
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
}

/**
 * 缓存统计
 */
export interface CacheStats {
  [key: string]: any
}

/**
 * API 响应包装
 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
