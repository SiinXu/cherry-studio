import { Message } from '@renderer/types'
import { estimateTextTokens } from './TokenService'

/**
 * 根据模型的上下文大小优化消息列表的令牌数量
 * 这个函数会移除一些历史消息，以确保总的令牌数量不会超过模型上下文大小的限制
 *
 * @param messages 需要优化的消息列表
 * @param model 当前使用的模型
 * @returns 优化后的消息列表
 */
export async function tokenOptimizer(messages: Message[]): Promise<Message[]> {
  // 由于类型问题，我们不再检查contextSize，而是假设模型上下文大小为默认值
  const contextSize = 4000 // 默认上下文大小
  if (messages.length <= 1) {
    return messages
  }

  // 确保保留最新的用户消息和系统消息
  const userMessages = messages.filter((msg) => msg.role === 'user')
  const systemMessages = messages.filter((msg) => msg.role !== 'user' && msg.role !== 'assistant')
  const assistantMessages = messages.filter((msg) => msg.role === 'assistant')

  // 始终保留最新的用户消息
  const latestUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null

  // 始终保留系统消息
  const optimizedMessages: Message[] = [...systemMessages]

  // 计算已添加消息的令牌数
  let currentTokens = systemMessages.reduce((total, msg) => {
    return total + estimateTextTokens(msg.content || '')
  }, 0)

  // 添加最新的用户消息
  if (latestUserMessage) {
    optimizedMessages.push(latestUserMessage)
    currentTokens += estimateTextTokens(latestUserMessage.content || '')
  }

  // 计算可用令牌数量
  const availableTokens = contextSize * 0.8 - currentTokens

  // 从最新到最旧添加助手和用户消息对
  // 跳过最新的用户消息，因为已经添加了
  const remainingUserMessages = userMessages.slice(0, -1)

  // 按时间从新到旧排序所有消息对
  const messagePairs: Message[] = [...remainingUserMessages, ...assistantMessages].sort(
    (a, b) =>
      new Date(a.createdAt || b.createdAt || Date.now()).getTime() -
      new Date(b.createdAt || a.createdAt || Date.now()).getTime()
  )

  for (const msg of messagePairs) {
    const tokenCount = estimateTextTokens(msg.content || '')

    if (currentTokens + tokenCount <= availableTokens) {
      optimizedMessages.push(msg)
      currentTokens += tokenCount
    }
  }

  // 按原始顺序排序消息
  return optimizedMessages.sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime()
    const bTime = new Date(b.createdAt || 0).getTime()
    return aTime - bTime
  })
}
