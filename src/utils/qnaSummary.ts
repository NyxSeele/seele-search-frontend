import type { AISummary } from '@/types'
import { createQnaStreamId, finishQnaStream, startQnaStream, streamTextToQna, failQnaStream } from '@/utils/qnaStream'

const dataStatusLabels: Record<string, string> = {
  weibo: '微博',
  toutiao: '今日头条',
  bilibili: 'B站',
  douyin: '抖音',
}

const normalizeBulletText = (text: string) => {
  return text.replace(/[•·]\s*/g, '\n- ')
}

export const buildSummaryAnswerForQna = (title: string, summary: AISummary) => {
  const lines: string[] = [`【${title}】`]

  const appendSectionTitle = (section: string) => {
    if (lines.length > 0) {
      lines.push('')
    }
    lines.push(section)
  }

  if (summary.summary) {
    appendSectionTitle('全局分析：')
    lines.push(normalizeBulletText(summary.summary.trim()))
  }

  if (summary.coreTopics && summary.coreTopics.length > 0) {
    appendSectionTitle('核心话题：')
    summary.coreTopics.forEach((topic, index) => {
      const desc = normalizeBulletText(topic.description)
      lines.push(`${index + 1}. ${topic.topic}：${desc}`)
    })
  }

  const insights = summary.crossPlatformInsights?.filter(Boolean) ?? []
  if (insights.length > 0) {
    appendSectionTitle('跨平台洞察：')
    insights.forEach((insight) => lines.push(`- ${normalizeBulletText(insight)}`))
  }

  const statusEntries = Object.entries(summary.dataStatus ?? {}).filter(([, status]) => !!status)
  if (statusEntries.length > 0) {
    appendSectionTitle('数据状态：')
    statusEntries.forEach(([key, status]) => {
      const label = dataStatusLabels[key] || key
      lines.push(`${label}：${normalizeBulletText(status as string)}`)
    })
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

interface PushSummaryOptions {
  streamId?: string
  meta?: Record<string, any>
  chunkSize?: number
  chunkDelay?: number
}

export const startSummaryStream = (title: string, meta?: Record<string, any>) => {
  const streamId = createQnaStreamId('summary')
  startQnaStream({
    streamId,
    question: `${title}（AI总结）`,
    meta: {
      source: 'SUMMARY',
      ...meta,
    },
  })
  return streamId
}

export const pushSummaryToQnaPanel = (title: string, summary: AISummary, options: PushSummaryOptions = {}) => {
  const streamId = options.streamId || startSummaryStream(title, options.meta)
  const answer = buildSummaryAnswerForQna(title, summary)

  streamTextToQna({
    streamId,
    text: answer,
    chunkSize: options.chunkSize,
    delay: options.chunkDelay,
  })
    .then(() => {
      finishQnaStream(streamId)
    })
    .catch((err) => {
      console.error('Streaming summary failed:', err)
      failQnaStream(streamId, 'AI总结发送失败，请稍后重试')
    })

  return streamId
}

