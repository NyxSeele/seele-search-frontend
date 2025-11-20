/**
 * 格式化热度值为可读格式
 * @param heat 热度值
 * @returns 格式化后的字符串，如 "1234.6万"、"1.6亿"
 */
export function formatHeat(heat: number): string {
  if (heat === 0 || heat === null || heat === undefined) {
    return '暂无数据'
  }

  // 亿级别 (>= 1亿)
  if (heat >= 100000000) {
    return (heat / 100000000).toFixed(1) + '亿'
  }

  // 万级别 (>= 1万)
  if (heat >= 10000) {
    return (heat / 10000).toFixed(1) + '万'
  }

  // 小于1万，直接显示数字
  return heat.toString()
}

/**
 * 获取热度值的颜色等级
 * @param heat 热度值
 * @param platform 平台类型 (用于不同平台的热度判断标准)
 * @returns 颜色类名
 */
export function getHeatLevelClass(heat: number, platform?: string): string {
  if (heat === 0) return 'heat-none'

  // 根据平台设置不同的热度阈值
  let highThreshold = 50000000 // 默认5千万为高热度
  let mediumThreshold = 10000000 // 默认1千万为中等热度

  if (platform === 'WEIBO') {
    highThreshold = 50000000 // 微博：5千万为高热度
    mediumThreshold = 10000000 // 1千万为中等热度
  } else if (platform === 'TOUTIAO') {
    highThreshold = 5000000 // 今日头条：500万为高热度
    mediumThreshold = 1000000 // 100万为中等热度
  } else if (platform === 'BILIBILI') {
    highThreshold = 20000000 // B站：2千万为高热度
    mediumThreshold = 5000000 // 500万为中等热度
  } else if (platform === 'DOUYIN') {
    highThreshold = 30000000 // 抖音：3千万为高热度
    mediumThreshold = 8000000 // 800万为中等热度
  }

  if (heat >= highThreshold) return 'heat-high'
  if (heat >= mediumThreshold) return 'heat-medium'
  return 'heat-low'
}
