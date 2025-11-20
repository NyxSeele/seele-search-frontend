/**
 * 分类映射工具 - 将英文分类转换为中文
 */

export const CATEGORY_MAP: Record<string, string> = {
  // 英文映射
  politics: '政治',
  economy: '经济',
  culture: '文化',
  tech: '科技',
  sports: '体育',
  entertainment: '娱乐',
  society: '社会',
  military: '军事',
  
  // 其他可能的值
  other: '其他',
  pending: '待分类',
  unknown: '未知',
}

/**
 * 获取分类的中文名称
 * @param category 英文分类名
 * @returns 中文分类名
 */
export function getCategoryName(category: string | undefined | null): string {
  // 严格按照8个固定分类，无分类时默认为"社会"
  if (!category) return '社会'
  
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(category)) {
    return category
  }
  
  // 转换为小写并查找映射
  const lowerCategory = category.toLowerCase()
  // 如果找不到映射，默认返回"社会"而不是"其他"
  return CATEGORY_MAP[lowerCategory] || '社会'
}

/**
 * 获取平台的中文名称
 * @param platform 平台英文名
 * @returns 平台中文名
 */
export function getPlatformName(platform: string): string {
  const platformMap: Record<string, string> = {
    WEIBO: '微博',
    TOUTIAO: '今日头条',
    BILIBILI: 'Bilibili',
    DOUYIN: '抖音',
  }
  return platformMap[platform.toUpperCase()] || platform
}
