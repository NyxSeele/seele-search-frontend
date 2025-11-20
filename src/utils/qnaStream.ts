import type { RelatedHotSearch } from '@/types'

export interface QnaStreamStartDetail {
  streamId: string
  question: string
  meta?: Record<string, any>
}

export interface QnaStreamChunkDetail {
  streamId: string
  chunk: string
}

export interface QnaStreamEndDetail {
  streamId: string
  relatedHotSearches?: RelatedHotSearch[]
  meta?: Record<string, any>
}

export interface QnaStreamErrorDetail {
  streamId: string
  message?: string
}

const dispatchStreamEvent = <T>(eventName: string, detail: T) => {
  window.dispatchEvent(new CustomEvent<T>(eventName, { detail }))
}

export const createQnaStreamId = (prefix = 'stream') => {
  const random = Math.random().toString(16).slice(2, 8)
  return `${prefix}-${Date.now()}-${random}`
}

export const startQnaStream = (detail: QnaStreamStartDetail) => {
  dispatchStreamEvent<QnaStreamStartDetail>('qna:stream-start', detail)
}

export const appendQnaStreamChunk = (streamId: string, chunk: string) => {
  dispatchStreamEvent<QnaStreamChunkDetail>('qna:stream-chunk', { streamId, chunk })
}

export const finishQnaStream = (streamId: string, payload?: Omit<QnaStreamEndDetail, 'streamId'>) => {
  dispatchStreamEvent<QnaStreamEndDetail>('qna:stream-end', {
    streamId,
    ...payload,
  })
}

export const failQnaStream = (streamId: string, message: string) => {
  dispatchStreamEvent<QnaStreamErrorDetail>('qna:stream-error', {
    streamId,
    message,
  })
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface StreamTextOptions {
  streamId: string
  text: string
  chunkSize?: number
  delay?: number
}

export const streamTextToQna = async ({ streamId, text, chunkSize = 18, delay = 30 }: StreamTextOptions) => {
  const normalized = text ?? ''
  if (!normalized) return

  for (let i = 0; i < normalized.length; i += chunkSize) {
    const chunk = normalized.slice(i, i + chunkSize)
    appendQnaStreamChunk(streamId, chunk)
    await sleep(delay)
  }
}

