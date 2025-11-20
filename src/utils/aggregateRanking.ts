import { Platform } from '../types/index'
import type { HotSearchItem } from '../types/index'

/**
 * 聚合排名算法配置
 * 用于跨平台热搜的智能排序
 */

// 各平台热度分布特征（基于实际数据统计）
const PLATFORM_HEAT_CONFIG = {
  [Platform.WEIBO]: {
    name: '微博',
    weight: 1.2,              // 平台影响力权重（微博用户基数大，权重稍高）
    avgHeat: 25000000,        // 平均热度：2500万
    highHeat: 50000000,       // 高热度阈值：5千万
    mediumHeat: 10000000,     // 中等热度阈值：1千万
  },
  [Platform.TOUTIAO]: {
    name: '今日头条',
    weight: 1.0,              // 基准权重
    avgHeat: 2500000,         // 平均热度：250万
    highHeat: 5000000,        // 高热度阈值：500万
    mediumHeat: 1000000,      // 中等热度阈值：100万
  },
  [Platform.BILIBILI]: {
    name: 'B站',
    weight: 1.15,             // B站年轻用户群体活跃度高
    avgHeat: 10000000,        // 平均热度：1千万
    highHeat: 20000000,       // 高热度阈值：2千万
    mediumHeat: 5000000,      // 中等热度阈值：500万
  },
  [Platform.DOUYIN]: {
    name: '抖音',
    weight: 1.25,             // 抖音流量最大，权重最高
    avgHeat: 15000000,        // 平均热度：1500万
    highHeat: 30000000,       // 高热度阈值：3千万
    mediumHeat: 8000000,      // 中等热度阈值：800万
  },
}

/**
 * 计算排名分数（rank越小，分数越高）
 * 使用倒数公式：score = 100 * (51 - rank) / 50
 * rank=1 得100分，rank=50 得2分
 */
function calculateRankScore(rank: number): number {
  if (rank <= 0 || rank > 50) return 0
  return 100 * (51 - rank) / 50
}

/**
 * 归一化热度分数（基于平台特征）
 * 使用sigmoid函数进行归一化，使得分数在0-100之间
 */
function calculateNormalizedHeatScore(heat: number, platform: Platform): number {
  const config = PLATFORM_HEAT_CONFIG[platform]
  if (!config || heat <= 0) return 0
  
  // 使用平均热度作为参考点进行归一化
  // heat / avgHeat = 1 时得到50分
  // heat越高，分数越接近100
  const ratio = heat / config.avgHeat
  
  // 使用sigmoid函数平滑映射到0-100
  // sigmoid(x) = 100 / (1 + e^(-k*(x-1)))
  // 当ratio=1时，得分约50；ratio=2时，得分约73；ratio=3时，得分约88
  const k = 1.5 // 控制曲线陡峭程度
  const score = 100 / (1 + Math.exp(-k * (ratio - 1)))
  
  return Math.min(100, Math.max(0, score))
}

/**
 * 计算平台权重分数
 */
function calculatePlatformWeightScore(platform: Platform): number {
  const config = PLATFORM_HEAT_CONFIG[platform]
  return config ? config.weight * 10 : 10 // 基础10分乘以权重系数
}

/**
 * 计算时效性分数（可选）
 * 基于capturedAt时间，越新的热搜得分越高
 */
function calculateFreshnessScore(capturedAt: string): number {
  if (!capturedAt) return 5 // 默认中等分数
  
  try {
    const now = new Date()
    const captureTime = new Date(capturedAt)
    const ageInMinutes = (now.getTime() - captureTime.getTime()) / (1000 * 60)
    
    // 1小时内：满分10分
    // 1-3小时：8分
    // 3-6小时：5分
    // 6小时以上：2分
    if (ageInMinutes <= 60) return 10
    if (ageInMinutes <= 180) return 8
    if (ageInMinutes <= 360) return 5
    return 2
  } catch (e) {
    return 5 // 时间解析失败返回默认分数
  }
}

/**
 * 计算头部热搜保底加分
 * 确保各平台的头部热搜能够进入前排
 */
function calculateTopRankBonus(rank: number): number {
  if (rank === 1) return 100  // 第1名必进前10
  if (rank === 2) return 80   // 第2名保底前排
  if (rank === 3) return 60   // 第3名保底前排
  return 0
}

/**
 * 计算综合评分
 * 综合分数 = rank分数 * 0.4 + 归一化热度分数 * 0.4 + 平台权重分数 * 0.15 + 时效性分数 * 0.05 + 头部保底加分
 */
export function calculateAggregateScore(item: HotSearchItem): number {
  const rankScore = calculateRankScore(item.rank || 50)
  const heatScore = calculateNormalizedHeatScore(item.heat || 0, item.platform)
  const platformScore = calculatePlatformWeightScore(item.platform)
  const freshnessScore = calculateFreshnessScore(item.capturedAt)
  const topRankBonus = calculateTopRankBonus(item.rank || 50)
  
  // 加权计算综合分数（基础分 + 头部保底加分）
  const baseScore = 
    rankScore * 0.4 +           // 排名占40%
    heatScore * 0.4 +           // 热度占40%
    platformScore * 0.15 +      // 平台权重占15%
    freshnessScore * 0.05       // 时效性占5%
  
  return baseScore + topRankBonus
}

/**
 * 按综合评分排序热搜列表
 * @param items 热搜列表
 * @param enableDebug 是否启用调试日志
 * @returns 排序后的热搜列表
 */
export function sortByAggregateScore(items: HotSearchItem[], enableDebug = false): HotSearchItem[] {
  // 为每个item计算综合分数
  const itemsWithScore = items.map(item => ({
    ...item,
    aggregateScore: calculateAggregateScore(item)
  }))
  
  // 按综合分数降序排序
  const sorted = itemsWithScore.sort((a, b) => b.aggregateScore - a.aggregateScore)
  
  // 调试日志
  if (enableDebug && sorted.length > 0) {
    console.log('📊 聚合排名算法调试信息:')
    console.log('前10名热搜综合评分:')
    sorted.slice(0, 10).forEach((item, index) => {
      const config = PLATFORM_HEAT_CONFIG[item.platform]
      console.log(
        `${index + 1}. [${config?.name || item.platform}] ${item.title}\n` +
        `   原始rank=${item.rank}, heat=${(item.heat / 10000).toFixed(1)}万\n` +
        `   综合得分=${item.aggregateScore.toFixed(2)}`
      )
    })
  }
  
  return sorted
}

/**
 * 确保四个平台穿插的聚合排序
 * 保证前40条中每个平台都有均衡的展示
 * @param items 热搜列表
 * @returns 排序后的热搜列表
 */
export function sortWithPlatformBalance(items: HotSearchItem[]): HotSearchItem[] {
  // 先按综合分数排序
  const sorted = sortByAggregateScore(items)
  
  // 按平台分组
  const platformGroups = sorted.reduce((groups, item) => {
    if (!groups[item.platform]) {
      groups[item.platform] = []
    }
    groups[item.platform].push(item)
    return groups
  }, {} as Record<Platform, HotSearchItem[]>)
  
  // 获取所有平台
  const platforms = Object.keys(platformGroups) as Platform[]
  
  // 穿插算法：轮流从每个平台取一条
  const result: HotSearchItem[] = []
  const platformIndexes: Record<Platform, number> = {} as Record<Platform, number>
  platforms.forEach(p => platformIndexes[p] = 0)
  
  // 前40条使用穿插逻辑
  let currentPlatformIndex = 0
  while (result.length < 40 && result.length < sorted.length) {
    const platform = platforms[currentPlatformIndex % platforms.length]
    const group = platformGroups[platform]
    const index = platformIndexes[platform]
    
    if (index < group.length) {
      result.push(group[index])
      platformIndexes[platform]++
    }
    
    currentPlatformIndex++
    
    // 防止死循环：如果所有平台都没有数据了就退出
    if (platforms.every(p => platformIndexes[p] >= platformGroups[p].length)) {
      break
    }
  }
  
  // 剩余的按原始分数排序添加
  const usedIds = new Set(result.map(item => item.id))
  const remaining = sorted.filter(item => !usedIds.has(item.id))
  result.push(...remaining)
  
  return result
}

/**
 * 获取平台热度配置（供外部使用）
 */
export function getPlatformHeatConfig(platform: Platform) {
  return PLATFORM_HEAT_CONFIG[platform]
}
