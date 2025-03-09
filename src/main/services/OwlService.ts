import log from 'electron-log'

// 质量评估结果接口
export interface QualityEvaluationResult {
  score: number
  criteria: Array<{
    name: string
    score: number
    description: string
  }>
  summary: string
  suggestions: string[]
}

// 模型API响应接口
export interface ModelApiResponse {
  content: string
  toolCalls?: Array<{
    name: string
    arguments: Record<string, any>
  }>
}

import axios from 'axios'

export class OwlService {
  // 外部资源API状态
  private isExternalResourcesApiValid = false
  private isInitialized = false
  private apiKey = ''
  // 存储外部资源API密钥，用于后续功能扩展
  private _externalResourcesApiKey = ''
  private modelProvider: 'openai' | 'anthropic' | 'google' | 'local' = 'openai'

  // 会话管理
  private sessions: Map<
    string,
    {
      id: string
      enabledToolkits: string[]
      messages: Array<{ role: string; content: string }>
      created: number
      updated: number
    }
  > = new Map()
  // API端点
  private openaiApiEndpoint = 'https://api.openai.com/v1/chat/completions'
  private anthropicApiEndpoint = 'https://api.anthropic.com/v1/messages'
  private googleApiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

  constructor() {
    log.info('OwlService 初始化')
    this.registerIpcHandlers()
  }

  /**
   * 注册所有相关的IPC处理程序
   * 这个方法确保在OwlService实例创建时就注册IPC处理程序
   */
  private registerIpcHandlers() {
    try {
      const { ipcMain } = require('electron')

      log.info('注册Owl相关的IPC处理程序...')

      // 注册初始化处理程序
      ipcMain.handle('owl:initialize', async (_, options) => {
        return await this.initialize(options)
      })

      // 注册创建会话处理程序
      ipcMain.handle('owl:create-session', async (_, enabledToolkits) => {
        log.info(`创建 OWL 会话，启用的工具集: ${JSON.stringify(enabledToolkits || [])}`)
        return await this.createSession(enabledToolkits)
      })

      // 注册添加消息处理程序
      ipcMain.handle('owl:add-message', async (_, sessionId, message) => {
        return await this.addMessage(sessionId, message)
      })

      // 注册清除会话处理程序
      ipcMain.handle('owl:clear-session', async (_, sessionId) => {
        log.info(`清除OWL会话: ${sessionId}`)
        // 可以在这里添加实际的会话清理逻辑
        return true
      })

      // 注册模型调用处理程序
      ipcMain.handle('owl:call-model', async (_, messages, toolDefinitions) => {
        return await this.callModelApi(messages, toolDefinitions)
      })

      // 注册质量评估处理程序
      ipcMain.handle('owl:evaluate-quality', async (_, content, type) => {
        return await this.evaluateQuality(content, type)
      })

      // 注册HTTP请求处理程序
      ipcMain.handle('owl:http-request', async (_, options) => {
        log.info(`执行HTTP请求: ${options.method || 'GET'} ${options.url}`)
        try {
          const response = await axios(options)
          return {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
          }
        } catch (error: any) {
          log.error('HTTP请求失败:', error)
          // 构建安全的错误响应对象
          const errorResponse = {
            error: true,
            status: error.response?.status,
            statusText: error.response?.statusText || error.message,
            message: error.message || '未知错误'
          }
          return errorResponse
        }
      })

      log.info('Owl相关的IPC处理程序注册成功')
    } catch (error) {
      log.error('Owl相关的IPC处理程序注册失败:', error)
    }
  }

  /**
   * 创建一个新的OWL会话
   * @param enabledToolkits 启用的工具集
   * @returns 新会话的ID
   */
  async createSession(enabledToolkits: string[] | string = ['web_browser']): Promise<string> {
    // 确保 enabledToolkits 是数组
    const toolkitsArray = Array.isArray(enabledToolkits) ? enabledToolkits : [enabledToolkits]

    // 生成唯一会话ID
    const sessionId = `owl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    log.info(`创建新OWL会话: ${sessionId}, 启用的工具集: ${toolkitsArray.join(', ')}`)

    // 创建新会话并添加到会话存储中
    const session = {
      id: sessionId,
      enabledToolkits: toolkitsArray,
      messages: [],
      created: Date.now(),
      updated: Date.now()
    }

    this.sessions.set(sessionId, session)

    return sessionId
  }

  /**
   * 将消息添加到指定会话
   * @param sessionId 会话ID
   * @param message 消息对象
   * @returns 成功返回true，失败返回false
   */
  async addMessage(sessionId: string, message: { role: string; content: string }): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      log.error(`尝试向不存在的会话添加消息: ${sessionId}`)
      return false
    }

    // 添加消息并更新会话
    session.messages.push(message)
    session.updated = Date.now()

    log.info(`向会话 ${sessionId} 添加消息: ${message.role} - ${message.content.substring(0, 50)}...`)
    return true
  }

  /**
   * 获取指定会话
   * @param sessionId 会话 ID
   * @returns 会话对象或undefined
   */
  getSession(sessionId: string) {
    return this.sessions.get(sessionId)
  }

  /**
   * 初始化OWL服务
   * @param options 初始化选项
   */
  async initialize(options: {
    languageModelApiKey: string
    externalResourcesApiKey: string
    modelProvider: 'openai' | 'anthropic' | 'google' | 'local'
  }): Promise<boolean> {
    // 验证主要API密钥和外部资源API密钥
    try {
      this.apiKey = options.languageModelApiKey
      // 设置外部资源API密钥并验证
      this._externalResourcesApiKey = options.externalResourcesApiKey
      this.isExternalResourcesApiValid = this.validateExternalResourcesApiKey()
      this.modelProvider = options.modelProvider

      // 验证API密钥 - 放宽验证要求
      if (!this.apiKey || this.apiKey === 'your-api-key-here') {
        log.warn(`OwlService: 缺少有效的API密钥配置, 当前值: ${this.apiKey}`)
        return false
      }

      log.info(`OwlService: API密钥验证成功, 当前值长度: ${this.apiKey.length}`)

      // 即使外部资源API密钥没有设置，也允许初始化
      this.isExternalResourcesApiValid = !!this._externalResourcesApiKey
      log.info(`外部资源API密钥状态: ${this.isExternalResourcesApiValid ? '有效' : '无效'}`)

      log.info(`OwlService: 使用${this.modelProvider}提供商初始化成功`)
      this.isInitialized = true
      log.info('OwlService 初始化完成，可以正常使用')
      return true
    } catch (error) {
      log.error('OwlService初始化失败:', error)
      return false
    }
  }

  /**
   * 验证外部资源API密钥
   * @returns 密钥是否有效
   */
  private validateExternalResourcesApiKey(): boolean {
    // 简化验证逻辑，只要有密钥就视为有效
    const isValid = !!this._externalResourcesApiKey && this._externalResourcesApiKey !== 'your-api-key-here'
    log.info(`ExternalResourcesApiKey 验证${isValid ? '成功' : '失败'}`)
    return isValid
  }

  /**
   * 获取外部资源API状态
   * @returns API状态
   */
  getExternalResourcesStatus(): { isValid: boolean } {
    return {
      isValid: this.isExternalResourcesApiValid
    }
  }

  /**
   * 评估内容质量
   * @param content 需要评估的内容
   * @param type 内容类型
   * @returns 质量评估结果
   */
  async evaluateQuality(
    content: string,
    type: 'content' | 'code' | 'design' = 'content'
  ): Promise<QualityEvaluationResult> {
    if (!this.isInitialized) {
      throw new Error('OwlService未初始化，请先调用initialize方法')
    }

    log.info(`OwlService: 评估${type}质量`, { contentLength: content.length })

    try {
      // 这里应该是实际调用外部API进行评估
      // 现在使用模拟数据
      return this.simulateQualityEvaluation(content, type)
    } catch (error) {
      log.error('评估质量失败:', error)
      throw error
    }
  }

  /**
   * 调用语言模型API处理消息
   * @param messages 消息数组
   * @param toolDefinitions 工具定义
   * @returns 模型响应结果
   */
  async callModelApi(
    messages: Array<{ role: string; content: string }>,
    toolDefinitions?: Array<{ name: string; description: string; parameters: any }>
  ): Promise<{ content: string; toolCalls?: Array<{ name: string; arguments: any }> }> {
    if (!this.isInitialized) {
      throw new Error('OwlService未初始化，请先调用initialize方法')
    }

    log.info(`OwlService: 调用${this.modelProvider}模型API处理消息`, { messagesCount: messages.length })

    try {
      // 根据不同的模型提供商调用不同的API
      switch (this.modelProvider) {
        case 'openai':
          return await this.callOpenAIApi(messages, toolDefinitions)
        case 'anthropic':
          return await this.callAnthropicApi(messages, toolDefinitions)
        case 'google':
          return await this.callGoogleApi(messages, toolDefinitions)
        case 'local':
        default:
          // 本地模式下使用模拟数据
          log.info('使用本地模式，返回模拟数据')
          return this.simulateModelResponse(messages[messages.length - 1]?.content || '')
      }
    } catch (error) {
      log.error('调用模型API失败:', error)
      throw error
    }
  }

  /**
   * 调用OpenAI API
   */
  private async callOpenAIApi(
    messages: Array<{ role: string; content: string }>,
    toolDefinitions?: Array<{ name: string; description: string; parameters: any }>
  ): Promise<{ content: string; toolCalls?: Array<{ name: string; arguments: any }> }> {
    try {
      const response = await axios.post(
        this.openaiApiEndpoint,
        {
          model: 'gpt-4-turbo',
          messages,
          tools: toolDefinitions
            ? toolDefinitions.map((tool) => ({
                type: 'function',
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters
                }
              }))
            : undefined,
          tool_choice: toolDefinitions && toolDefinitions.length > 0 ? 'auto' : 'none'
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const result = response.data.choices[0].message

      // 格式化响应
      return {
        content: result.content || '',
        toolCalls: result.tool_calls
          ? result.tool_calls.map((tool: any) => ({
              name: tool.function.name,
              arguments: JSON.parse(tool.function.arguments)
            }))
          : undefined
      }
    } catch (error) {
      log.error('OpenAI API调用失败:', error)
      throw error
    }
  }

  /**
   * 调用Anthropic API
   */
  private async callAnthropicApi(
    messages: Array<{ role: string; content: string }>,
    toolDefinitions?: Array<{ name: string; description: string; parameters: any }>
  ): Promise<{ content: string; toolCalls?: Array<{ name: string; arguments: any }> }> {
    try {
      // 转换消息格式
      const anthropicMessages = messages.map((msg) => ({
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content
      }))

      const response = await axios.post(
        this.anthropicApiEndpoint,
        {
          model: 'claude-3-opus-20240229',
          messages: anthropicMessages,
          tools: toolDefinitions,
          max_tokens: 4000
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      )

      const result = response.data

      // 格式化响应
      return {
        content: result.content[0].text || '',
        toolCalls: result.tool_use
          ? [
              {
                name: result.tool_use.name,
                arguments: result.tool_use.input
              }
            ]
          : undefined
      }
    } catch (error) {
      log.error('Anthropic API调用失败:', error)
      throw error
    }
  }

  /**
   * 调用Google API
   */
  private async callGoogleApi(
    messages: Array<{ role: string; content: string }>,
    // 此参数目前在Google API中未使用，但预留以供将来扩展
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _toolDefinitions?: Array<{ name: string; description: string; parameters: any }>
  ): Promise<{ content: string; toolCalls?: Array<{ name: string; arguments: any }> }> {
    try {
      // 构建Google API请求格式
      const prompt = messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')

      const response = await axios.post(
        `${this.googleApiEndpoint}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      // 提取响应内容
      const result = response.data.candidates[0].content.parts[0].text

      // 由于Google API不直接支持工具调用，我们需要解析响应内容来检测是否有工具调用
      // 这是一个简化的实现，实际应用中可能需要更复杂的解析逻辑
      let toolCalls
      if (result.includes('TOOL_CALL:')) {
        const toolCallMatch = result.match(/TOOL_CALL:\s*(\w+)\s*\{([^}]+)\}/)
        if (toolCallMatch) {
          try {
            toolCalls = [
              {
                name: toolCallMatch[1],
                arguments: JSON.parse(`{${toolCallMatch[2]}}`)
              }
            ]
          } catch (e) {
            log.error('解析Google API工具调用失败:', e)
          }
        }
      }

      return {
        content: result.replace(/TOOL_CALL:\s*\w+\s*\{[^}]+\}/, '').trim(),
        toolCalls
      }
    } catch (error) {
      log.error('Google API调用失败:', error)
      throw error
    }
  }

  /**
   * 模拟模型响应（本地备用方法）
   */
  private simulateModelResponse(userQuery: string): ModelApiResponse {
    log.info('使用模拟模型响应', { query: userQuery })

    let simulatedResponse: ModelApiResponse = {
      content: '我已收到您的请求，正在处理中...'
    }

    // 根据用户查询模拟不同的响应
    if (userQuery.includes('搜索')) {
      simulatedResponse = {
        content: `我可以帮您在网络上搜索相关信息。以下是关于"${userQuery.replace('搜索', '').trim()}"的一些可能相关的结果:`,
        toolCalls: [
          {
            name: 'web_search',
            arguments: {
              query: userQuery.replace('搜索', '').trim()
            }
          }
        ]
      }
    } else if (userQuery.includes('代码') || userQuery.includes('编程')) {
      simulatedResponse = {
        content: '根据您的请求，我为您准备了一些示例代码：',
        toolCalls: [
          {
            name: 'execute_code',
            arguments: {
              language: 'python',
              code: 'print("Hello, World!")'
            }
          }
        ]
      }
    } else if (userQuery.includes('分析') || userQuery.includes('数据')) {
      simulatedResponse = {
        content: '我可以帮您分析数据。请提供需要分析的数据，或者我可以生成一些示例数据进行分析演示。',
        toolCalls: [
          {
            name: 'analyze_data',
            arguments: {
              data_type: 'example',
              analysis_type: 'basic_statistics'
            }
          }
        ]
      }
    } else if (userQuery.includes('评估') || userQuery.includes('质量')) {
      simulatedResponse = {
        content: '我将为您提供内容质量评估。请稍等片刻，我会给出详细的评分和建议：',
        toolCalls: [
          {
            name: 'evaluate_quality',
            arguments: {
              content: userQuery.replace(/评估|质量/g, '').trim(),
              type: 'content'
            }
          }
        ]
      }
    } else {
      // 默认响应
      simulatedResponse = {
        content: `我理解您的问题是关于"${userQuery}"。我可以使用各种工具来帮助您。请告诉我您具体需要什么帮助？`
      }
    }

    return simulatedResponse
  }

  /**
   * 模拟质量评估结果（本地备用方法）
   */
  private simulateQualityEvaluation(
    _content: string, // 内容参数暂未使用，但保留以便将来实现真实评估
    type: 'content' | 'code' | 'design' = 'content'
  ): QualityEvaluationResult {
    // 这里模拟质量评估的结果
    const criteriaMap = {
      content: [
        { name: '准确性', score: Math.floor(Math.random() * 5) + 6, description: '内容的事实正确性和可靠性' },
        { name: '完整性', score: Math.floor(Math.random() * 5) + 6, description: '内容是否涵盖主题的所有关键方面' },
        { name: '清晰度', score: Math.floor(Math.random() * 4) + 7, description: '内容表达是否清晰易懂' },
        { name: '相关性', score: Math.floor(Math.random() * 3) + 7, description: '内容与主题的相关程度' }
      ],
      code: [
        { name: '功能性', score: Math.floor(Math.random() * 5) + 6, description: '代码是否能够正确实现预期功能' },
        { name: '可维护性', score: Math.floor(Math.random() * 5) + 6, description: '代码的结构、命名和注释的质量' },
        { name: '效率性', score: Math.floor(Math.random() * 4) + 6, description: '代码的执行效率和资源使用' },
        { name: '安全性', score: Math.floor(Math.random() * 5) + 5, description: '代码的安全实践和潜在漏洞' }
      ],
      design: [
        { name: '用户体验', score: Math.floor(Math.random() * 4) + 7, description: '设计的直观性和易用性' },
        { name: '视觉吸引力', score: Math.floor(Math.random() * 4) + 6, description: '设计的美观程度和视觉和谐性' },
        { name: '一致性', score: Math.floor(Math.random() * 3) + 7, description: '设计元素的一致性和统一性' },
        { name: '响应性', score: Math.floor(Math.random() * 4) + 6, description: '设计在不同环境下的适应性' }
      ]
    }

    const criteria = criteriaMap[type] || criteriaMap.content
    const totalScore = criteria.reduce((sum, item) => sum + item.score, 0)
    const averageScore = Math.round((totalScore / criteria.length) * 10) / 10

    const suggestionMap = {
      content: ['考虑添加更多关键数据来支持您的论点', '优化内容结构，提高整体连贯性', '简化复杂概念的表达，提高可读性'],
      code: [
        '考虑添加更详细的注释来提高代码可读性',
        '优化错误处理机制，提高代码健壮性',
        '重构重复代码段，提高可维护性'
      ],
      design: [
        '考虑增强视觉层次结构，引导用户注意',
        '优化颜色对比度，提高可访问性',
        '确保UI元素在不同屏幕尺寸上的一致性'
      ]
    }

    // 随机选择2-3条建议
    const allSuggestions = suggestionMap[type] || suggestionMap.content
    const count = Math.floor(Math.random() * 2) + 2
    const suggestions = [...allSuggestions].sort(() => 0.5 - Math.random()).slice(0, count)

    // 生成评估总结
    let summary = ''
    if (averageScore >= 8) {
      summary = `整体${type === 'content' ? '内容' : type === 'code' ? '代码' : '设计'}质量良好。`
    } else if (averageScore >= 6) {
      summary = `整体${type === 'content' ? '内容' : type === 'code' ? '代码' : '设计'}质量一般，有提升空间。`
    } else {
      summary = `整体${type === 'content' ? '内容' : type === 'code' ? '代码' : '设计'}质量较差，需要重大改进。`
    }

    return {
      score: averageScore,
      criteria,
      summary,
      suggestions
    }
  }

  // 测试API连接
  async testApiConnection(): Promise<{
    status: 'success' | 'error'
    provider: string
    message: string
    details?: any
  }> {
    try {
      // 验证API密钥
      if (!this.apiKey) {
        return {
          status: 'error',
          provider: this.modelProvider,
          message: `${this.modelProvider} API密钥未配置`
        }
      }

      if (this.modelProvider === 'google') {
        try {
          // 构建简单的测试请求
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`
          const testData = {
            contents: [
              {
                role: 'user',
                parts: [{ text: '简单的API测试消息，请回复一个简短的确认' }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 50
            }
          }

          // 使用axios进行API调用测试
          const response = await axios.post(apiUrl, testData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // 10秒超时
          })

          // 检查响应状态和内容
          if (response.status === 200 && response.data) {
            let hasContent = false
            if (
              response.data.candidates &&
              response.data.candidates[0] &&
              response.data.candidates[0].content &&
              response.data.candidates[0].content.parts
            ) {
              hasContent = true
            }

            return {
              status: 'success',
              provider: this.modelProvider,
              message: `成功连接到 ${this.modelProvider} API`,
              details: {
                responseTime: response.headers['x-request-time'] || 'N/A',
                modelVersion: response.headers['x-vertex-ai-model'] || 'gemini-pro',
                hasContent
              }
            }
          } else {
            // 响应状态不为200或没有响应数据
            return {
              status: 'error',
              provider: this.modelProvider,
              message: `API连接测试失败: 状态码 ${response.status}`,
              details: response.data
            }
          }
        } catch (apiError: any) {
          // API调用过程中出现错误
          return {
            status: 'error',
            provider: this.modelProvider,
            message: `API连接测试失败: ${apiError.message || '未知错误'}`,
            details: apiError.response?.data || {}
          }
        }
      }

      // 对于其他提供商，暂时只返回基本成功信息
      return {
        status: 'success',
        provider: this.modelProvider,
        message: `API连接测试已启动，请在渲染进程中查看结果`
      }
    } catch (error: any) {
      log.error(`API连接测试失败: ${error.message || '未知错误'}`)
      return {
        status: 'error',
        provider: this.modelProvider || 'unknown',
        message: `API连接测试失败: ${error.message || '未知错误'}`,
        details: error.response?.data || error
      }
    }
  }
}

export const owlService = new OwlService()
export default owlService
