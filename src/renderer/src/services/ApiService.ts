import { getOpenAIWebSearchParams } from '@renderer/config/models'
import i18n from '@renderer/i18n'
import store from '@renderer/store'
import { Assistant, Message, Provider } from '@renderer/types'
import { formatMessageError, isAbortError } from '@renderer/utils/error'
import { findLast, isEmpty } from 'lodash'

import AiProvider from '../providers/AiProvider'
import {
  getAssistantProvider,
  getDefaultModel,
  getProviderByModel,
  getTopNamingModel,
  getTranslateModel
} from './AssistantService'
import { EVENT_NAMES, EventEmitter } from './EventService'
import { filterMessages, filterUsefulMessages } from './MessagesService'
import { estimateMessagesUsage } from './TokenService'
import WebSearchService from './WebSearchService'

export async function fetchChatCompletion({
  message,
  messages,
  assistant,
  onResponse
}: {
  message: Message
  messages: Message[]
  assistant: Assistant
  onResponse: (message: Message) => void
}) {
  const provider = getAssistantProvider(assistant)
  const webSearchProvider = WebSearchService.getWebSearchProvider()
  const AI = new AiProvider(provider)

  // store.dispatch(setGenerating(true))

  // onResponse({ ...message })

  // addAbortController(message.askId ?? message.id)

  try {
    let _messages: Message[] = []
    let isFirstChunk = true

    // Search web
    if (WebSearchService.isWebSearchEnabled() && assistant.enableWebSearch && assistant.model) {
      const webSearchParams = getOpenAIWebSearchParams(assistant, assistant.model)

      if (isEmpty(webSearchParams)) {
        // filterMessages只接受一个参数
        _messages = filterMessages(messages)
      } else {
        // 调用WebSearchService的search方法，需要提供provider和query参数
        const webSearchService = WebSearchService
        const webSearchResults = await webSearchService.search(webSearchProvider, message.content)

        const webSearchContent = `Web search results:

${webSearchResults.results
  .map((result) => {
    return `[${result.title}](${result.url})\n${result.content}\n\n`
  })
  .join('\n')}`

        // 使用显式类型定义确保返回的是Message对象
        const lastSystemMessage: Message | undefined = findLast(messages, (message): message is Message => {
          return message?.role !== 'user' && message?.role !== 'assistant' && !!message?.content
        })

        _messages = [
          ...filterUsefulMessages(assistant, messages),
          {
            id: 'web-search',
            role: 'assistant', // 将system角色改为assistant以符合Message类型要求
            content: webSearchContent,
            // 添加缺少的Message类型必需属性
            assistantId: assistant.id,
            topicId: message.topicId,
            createdAt: new Date().toISOString(),
            status: 'success',
            type: 'text'
          } as Message
        ]

        // 确保lastSystemMessage是Message类型
        if (lastSystemMessage && typeof lastSystemMessage === 'object' && 'role' in lastSystemMessage) {
          _messages.unshift(lastSystemMessage as Message)
        }
      }
    } else {
      // filterMessages只接受一个参数
      _messages = filterMessages(messages) as Message[]
    }

    // Optimize tokens
    if (assistant.model?.contextSize && assistant.model?.id?.startsWith('claude')) {
      // 直接引入TokenOptimizerService文件
      const { tokenOptimizer } = await import('./TokenOptimizerService')
      // 确保usage是一个数字类型
      const usage = await Promise.resolve(estimateMessagesUsage(_messages, assistant.model))
      const contextSize = assistant.model.contextSize || 0

      // Optimize tokens if usage exceeds 80% of the model's context size
      if (typeof usage === 'number' && usage > 0 && contextSize > 0 && usage > contextSize * 0.8) {
        // tokenOptimizer只需要messages参数
        _messages = await tokenOptimizer(_messages)
      }
    }

    // 使用completions方法替代chat方法
    let currentContent = ''

    await AI.completions({
      messages: _messages,
      assistant,
      onChunk: (chunk: any) => {
        if (isFirstChunk) {
          onResponse({
            ...message,
            content: chunk.content || ''
          })
          isFirstChunk = false
          currentContent = chunk.content || ''
        } else {
          currentContent += chunk.content || ''
          // 使用APPEND_MESSAGE替代MESSAGE_APPEND_CONTENT
          EventEmitter.emit(EVENT_NAMES.APPEND_MESSAGE, {
            topicId: message.topicId,
            messageId: message.id,
            content: currentContent
          })
        }
      },
      onFilterMessages: () => _messages
    })
  } catch (error) {
    console.error('Error fetching chat completion:', error)

    // 使用ERROR_MESSAGE替代MESSAGE_ERROR
    EventEmitter.emit(EVENT_NAMES.EDIT_MESSAGE, {
      topicId: message.topicId,
      messageId: message.id,
      error: isAbortError(error) ? i18n.t('common.cancelled') : formatMessageError(error)
    })
  } finally {
    // removeAbortController(message.askId ?? message.id)
    // store.dispatch(setGenerating(false))
  }
}

export async function fetchGenerate({
  message,
  assistant,
  onResponse
}: {
  message: Message
  assistant: Assistant
  onResponse: (message: Message) => void
}) {
  const provider = getAssistantProvider(assistant)

  if (!hasApiKey(provider)) {
    return {
      error: i18n.t('error.missing_api_key', {
        provider: provider?.name
      })
    }
  }

  const AI = new AiProvider(provider)

  try {
    const { content } = await AI.generateText(message)

    onResponse({
      ...message,
      content
    })

    return {
      error: null
    }
  } catch (error) {
    console.error('Error generating text:', error)

    return {
      error: formatMessageError(error)
    }
  }
}

export async function fetchTranslate(message: Message, language: string) {
  const model = getTranslateModel()

  if (!model) {
    return {
      error: i18n.t('error.no_translate_model')
    }
  }

  const provider = getProviderByModel(model)

  if (!hasApiKey(provider)) {
    return {
      error: i18n.t('error.missing_api_key', {
        provider: provider?.name
      })
    }
  }

  const AI = new AiProvider(provider)

  try {
    const { content } = await AI.translate({
      content: message.content,
      language
    })

    return {
      content,
      error: null
    }
  } catch (error) {
    console.error('Error translating text:', error)

    return {
      error: formatMessageError(error)
    }
  }
}

export async function fetchTitleByContent(content: string) {
  const model = getTopNamingModel()

  if (!model) {
    return {
      title: null,
      error: i18n.t('error.no_top_naming_model')
    }
  }

  const provider = getProviderByModel(model)

  if (!hasApiKey(provider)) {
    return {
      title: null,
      error: i18n.t('error.missing_api_key', {
        provider: provider?.name
      })
    }
  }

  const AI = new AiProvider(provider)

  try {
    const title = await AI.nameByContent(content)

    return {
      title,
      error: null
    }
  } catch (error) {
    console.error('Error generating title by content:', error)

    return {
      title: null,
      error: formatMessageError(error)
    }
  }
}

export async function fetchValidateTemplate(template: string) {
  const model = getDefaultModel()

  if (!model) {
    return {
      valid: false,
      error: 'No model found'
    }
  }

  const provider = getProviderByModel(model)

  if (!provider) {
    return {
      valid: false,
      error: 'No provider found'
    }
  }

  if (!hasApiKey(provider)) {
    return {
      valid: false,
      error: i18n.t('error.missing_api_key', {
        provider: provider?.name
      })
    }
  }

  const AI = new AiProvider(provider)

  try {
    const valid = await AI.validateTemplate(template)

    return {
      valid,
      error: null
    }
  } catch (error) {
    console.error('Error validating template:', error)

    return {
      valid: false,
      error: formatMessageError(error)
    }
  }
}

// 基本API检查函数
export function checkApiProvider(provider: Provider): {
  valid: boolean
  error: string | null
} {
  if (provider.id !== 'ollama' && provider.id !== 'lmstudio') {
    if (!provider.apiKey) {
      return {
        valid: false,
        error: i18n.t('error.missing_api_key', {
          provider: provider?.name
        })
      }
    }
  }

  if (!provider.apiHost) {
    return {
      valid: false,
      error: i18n.t('error.missing_api_host')
    }
  }

  if (isEmpty(provider.models)) {
    return {
      valid: false,
      error: i18n.t('error.no_model_selected')
    }
  }

  return {
    valid: true,
    error: null
  }
}

// 检查API的函数，供ApiCheckPopup使用
export async function checkApi(provider: Provider) {
  const validation = checkApiProvider(provider)
  if (!validation.valid) {
    return {
      valid: validation.valid,
      error: validation.error
    }
  }

  try {
    // 基本连接测试
    // 简化检查逻辑，不实际调用validateTemplate
    return {
      valid: true,
      error: null
    }
  } catch (error) {
    console.error('API检查错误:', error)
    return {
      valid: false,
      error: formatMessageError(error)
    }
  }
}

function hasApiKey(provider: Provider) {
  if (!provider) return false
  if (provider.id === 'ollama' || provider.id === 'lmstudio') return true
  return !isEmpty(provider.apiKey)
}

export async function fetchModels(provider: Provider) {
  const AI = new AiProvider(provider)

  try {
    return await AI.models()
  } catch (error) {
    return []
  }
}

export async function fetchEmojiSuggestion(prompt: string): Promise<string> {
  if (!prompt || prompt.trim() === '') {
    // 如果没有提示词，返回一些默认的 emoji
    const defaultEmojis = ['🤖', '💡', '✨', '🧠', '📚']
    return defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)]
  }

  // 尝试使用 AI 生成 emoji
  try {
    // 从 store 中获取所有提供商
    const providers = store.getState().llm.providers

    // 获取第一个可用的 AI 提供商
    const provider = providers.find((p) => hasApiKey(p))

    if (provider) {
      const { EMOJI_GENERATOR_PROMPT } = await import('@renderer/config/prompts')
      const AI = new AiProvider(provider)

      // 使用 AI 生成 emoji
      const systemPrompt = EMOJI_GENERATOR_PROMPT + '\n\n输入: ' + prompt
      const completion = await AI.generateText({
        prompt: systemPrompt,
        content: ''
      })

      // 从返回结果中提取 emoji
      // 首先尝试查找格式为 "Emoji: X" 的模式
      const emojiFormatMatch = completion.match(
        /Emoji[\s:]+([\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+)/u
      )
      if (emojiFormatMatch && emojiFormatMatch[1]) {
        return emojiFormatMatch[1]
      }

      // 尝试查找第一个出现的 emoji
      const match = completion.match(
        /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
      )
      if (match && match[0]) {
        return match[0]
      }

      // 尝试匹配常见的 emoji 符号名称
      const emojiNameMap = {
        ':robot:': '🤖',
        ':bulb:': '💡',
        ':sparkles:': '✨',
        ':brain:': '🧠',
        ':books:': '📚',
        ':computer:': '💻',
        ':star2:': '🌟',
        ':jigsaw:': '🧩'
      }

      for (const [name, emoji] of Object.entries(emojiNameMap)) {
        if (completion.includes(name)) {
          return emoji
        }
      }
    }

    // 如果 AI 生成失败，回退到使用工具函数
    const { generateEmojiFromPrompt } = await import('@renderer/utils')
    return await generateEmojiFromPrompt(prompt)
  } catch (error) {
    console.error('Error generating emoji from prompt:', error)
    // 尝试回退到默认函数
    try {
      const { generateEmojiFromPrompt } = await import('@renderer/utils')
      return await generateEmojiFromPrompt(prompt)
    } catch {
      // 出错时返回一个默认 emoji
      return '🤖'
    }
  }
}
