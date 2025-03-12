import { getOpenAIWebSearchParams } from '@renderer/config/models'
import i18n from '@renderer/i18n'
import store from '@renderer/store'
import { setGenerating } from '@renderer/store/runtime'
import { Assistant, Message, Model, Provider, Suggestion } from '@renderer/types'
import { formatMessageError, isAbortError } from '@renderer/utils/error'
import { cloneDeep, findLast, isEmpty } from 'lodash'

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
        const lastMessage = findLast(messages, (m) => m.role === 'user')
        const hasKnowledgeBase = !isEmpty(lastMessage?.knowledgeBaseIds)
        if (lastMessage) {
          if (hasKnowledgeBase) {
            window.message.info({
              content: i18n.t('message.ignore.knowledge.base'),
              key: 'knowledge-base-no-match-info'
            })
          }
          onResponse({ ...message, status: 'searching' })
          const webSearch = await WebSearchService.search(webSearchProvider, lastMessage.content)
          message.metadata = {
            ...message.metadata,
            webSearch: webSearch
          }
          window.keyv.set(`web-search-${lastMessage?.id}`, webSearch)
        }
      }
    }

    const allMCPTools = await window.api.mcp.listTools()

    await AI.completions({
      messages: filterUsefulMessages(messages),
      assistant,
      onFilterMessages: (messages) => (_messages = messages),
      onChunk: ({ text, reasoning_content, usage, metrics, search, citations, mcpToolResponse }) => {
        message.content = message.content + text || ''
        message.usage = usage
        message.metrics = metrics

        if (reasoning_content) {
          message.reasoning_content = (message.reasoning_content || '') + reasoning_content
        }

        if (search) {
          message.metadata = { ...message.metadata, groundingMetadata: search }
        }

        if (mcpToolResponse) {
          message.metadata = { ...message.metadata, mcpTools: cloneDeep(mcpToolResponse) }
        }

        // Handle citations from Perplexity API
        if (isFirstChunk && citations) {
          message.metadata = {
            ...message.metadata,
            citations
          }
          isFirstChunk = false
        }

        onResponse({ ...message, status: 'pending' })
      },
      mcpTools: allMCPTools
    })

    message.status = 'success'

    if (!message.usage || !message?.usage?.completion_tokens) {
      message.usage = await estimateMessagesUsage({
        assistant,
        messages: [..._messages, message]
      })
      // Set metrics.completion_tokens
      if (message.metrics && message?.usage?.completion_tokens) {
        if (!message.metrics?.completion_tokens) {
          message = {
            ...message,
            metrics: {
              ...message.metrics,
              completion_tokens: message.usage.completion_tokens
            }
          }
        }
      }
    }
  } catch (error: any) {
    if (isAbortError(error)) return
    message.status = 'error'
    message.error = formatMessageError(error)
  }

  // Emit chat completion event
  EventEmitter.emit(EVENT_NAMES.RECEIVE_MESSAGE, message)
  onResponse(message)

  // Reset generating state
  store.dispatch(setGenerating(false))

  return message
}

interface FetchTranslateProps {
  message: Message
  assistant: Assistant
  onResponse?: (text: string) => void
}

export async function fetchTranslate({ message, assistant, onResponse }: FetchTranslateProps) {
  const model = getTranslateModel()

  if (!model) {
    throw new Error(i18n.t('error.provider_disabled'))
  }

  const provider = getProviderByModel(model)

  if (!hasApiKey(provider)) {
    throw new Error(i18n.t('error.no_api_key'))
  }

  const AI = new AiProvider(provider)

  try {
    return await AI.translate(message, assistant, onResponse)
  } catch (error: any) {
    return ''
  }
}

export async function fetchMessagesSummary({ messages, assistant }: { messages: Message[]; assistant: Assistant }) {
  const model = getTopNamingModel() || assistant.model || getDefaultModel()
  const provider = getProviderByModel(model)

  if (!hasApiKey(provider)) {
    return null
  }

  const AI = new AiProvider(provider)

  try {
    return await AI.summaries(filterMessages(messages), assistant)
  } catch (error: any) {
    return null
  }
}

export async function fetchGenerate({ prompt, content }: { prompt: string; content: string }): Promise<string> {
  const model = getDefaultModel()
  const provider = getProviderByModel(model)

  if (!hasApiKey(provider)) {
    return ''
  }

  const AI = new AiProvider(provider)

  try {
    return await AI.generateText({ prompt, content })
  } catch (error: any) {
    return ''
  }
}

export async function fetchSuggestions({
  messages,
  assistant
}: {
  messages: Message[]
  assistant: Assistant
}): Promise<Suggestion[]> {
  const model = assistant.model
  if (!model) {
    return []
  }

  if (model.owned_by !== 'graphrag') {
    return []
  }

  if (model.id.endsWith('global')) {
    return []
  }

  const provider = getAssistantProvider(assistant)
  const AI = new AiProvider(provider)

  try {
    return await AI.suggestions(filterMessages(messages), assistant)
  } catch (error: any) {
    return []
  }
}

// Helper function to validate provider's basic settings such as API key, host, and model list
export function checkApiProvider(provider: Provider): {
  valid: boolean
  error: Error | null
} {
  const key = 'api-check'
  const style = { marginTop: '3vh' }

  if (provider.id !== 'ollama' && provider.id !== 'lmstudio') {
    if (!provider.apiKey) {
      window.message.error({ content: i18n.t('message.error.enter.api.key'), key, style })
      return {
        valid: false,
        error: new Error(i18n.t('message.error.enter.api.key'))
      }
    }
  }

  if (!provider.apiHost) {
    window.message.error({ content: i18n.t('message.error.enter.api.host'), key, style })
    return {
      valid: false,
      error: new Error(i18n.t('message.error.enter.api.host'))
    }
  }

  if (isEmpty(provider.models)) {
    window.message.error({ content: i18n.t('message.error.enter.model'), key, style })
    return {
      valid: false,
      error: new Error(i18n.t('message.error.enter.model'))
    }
  }

  return {
    valid: true,
    error: null
  }
}

export async function checkApi(provider: Provider, model: Model) {
  const validation = checkApiProvider(provider)
  if (!validation.valid) {
    return {
      valid: validation.valid,
      error: validation.error
    }
  }

  const AI = new AiProvider(provider)

  const { valid, error } = await AI.check(model)

  return {
    valid,
    error
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

  // 优先使用本地生成方法，避免模型不存在的错误
  try {
    const { generateEmojiFromPrompt } = await import('@renderer/utils')
    return await generateEmojiFromPrompt(prompt)
  } catch (localError) {
    console.error('Error generating emoji locally:', localError)

    // 本地生成失败后，尝试使用 AI 生成 emoji
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
        const emojiFormatMatch = completion.match(/Emoji[\s:]+([p{Emoji}p{Emoji_Presentation}]+)/u)
        if (emojiFormatMatch && emojiFormatMatch[1]) {
          return emojiFormatMatch[1]
        }

        // 尝试查找第一个出现的 emoji
        const match = completion.match(/[p{Emoji}p{Emoji_Presentation}]/u)
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

      // 如果没有可用的AI提供商或AI提取失败，使用默认emoji
      return '🤖'
    } catch (aiError) {
      console.error('Error generating emoji with AI:', aiError)
      // 出错时返回一个默认 emoji
      return '🤖'
    }
  }
}
