import store from '@renderer/store'

import { formatIpcError } from '../utils/error'
import { safeIpcInvoke, safeIpcInvokeWithRetry } from '../utils/safeIpcUtils'
import { safeGet } from '../utils/safeObjectUtils'

// OWL框架服务类型定义
export interface OwlServiceOptions {
  languageModelApiKey: string
  externalResourcesApiKey: string
  modelProvider: 'openai' | 'anthropic' | 'google' | 'local'
  logLevel: 'debug' | 'info' | 'warning' | 'error'
}

// OWL工具集定义
export type OwlToolkit =
  | 'web_browser'
  | 'code_interpreter'
  | 'image_generation'
  | 'data_analysis'
  | 'web_search'
  | 'file_manager'
  | 'quality_evaluation'
  | 'autonomous_agent'

// OWL消息类型
export interface OwlMessage {
  role: 'user' | 'agent' | 'system'
  content: string
  toolResults?: OwlToolResult[]
  autonomous?: boolean
}

// OWL工具调用结果
export interface OwlToolResult {
  toolId: string
  toolName: string
  result: any
  status: 'success' | 'error' | 'running'
  timestamp: number
  followUpAction?: {
    type: string
    params: Record<string, any>
  }
}

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

// OWL会话接口
export interface OwlSession {
  id: string
  messages: OwlMessage[]
  activeToolkit: OwlToolkit
  enabledToolkits: OwlToolkit[]
  created: number
  updated: number
  isAutonomous: boolean
  autonomousGoal?: string
  autonomousSteps?: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    description: string
    result?: any
  }[]
}

// 调用语言模型API接口
export interface ModelApiResponse {
  content: string
  toolCalls?: {
    name: string
    arguments: Record<string, any>
  }[]
  // 添加错误相关字段用于错误处理
  error?: boolean
  errorType?: string
  errorDetails?: string
}

class OwlService {
  private options: OwlServiceOptions
  private sessions: Map<string, OwlSession> = new Map()
  private isInitialized = false
  private toolResults: Map<string, OwlToolResult[]> = new Map()

  constructor() {
    const settings = store.getState().settings
    this.options = {
      languageModelApiKey: settings.owlLanguageModelApiKey || '',
      externalResourcesApiKey: settings.owlExternalResourcesApiKey || '',
      modelProvider: settings.owlModelProvider || 'openai',
      logLevel: settings.owlLogLevel || 'info'
    }
  }

  // 初始化服务
  async initialize(): Promise<boolean> {
    console.log('OwlService - 开始初始化', this.options)
    if (this.isInitialized) {
      console.log('OwlService - 已经初始化成功，跳过初始化步骤')
      return true
    }

    // 检查设置中是否已启用OWL
    const settings = store.getState().settings
    if (!settings.enableOWL) {
      console.warn('OwlService - OWL功能未在设置中启用')
      return false
    }

    // 检查是否启用了高级功能
    if (!settings.advancedFeatures) {
      console.warn('OwlService - 高级功能未在设置中启用')
      return false
    }

    // 检查API密钥是否是默认值
    const isDefaultApiKey = this.options.languageModelApiKey === 'your-api-key-here'

    // 检查必要的API密钥是否已配置
    // 如果是默认API密钥，直接返回true，允许显示界面
    if (isDefaultApiKey) {
      console.log('OwlService - 使用默认API密钥，将显示配置提示')
      // 我们把初始化状态设为true，但不实际初始化后端服务
      this.isInitialized = true
      return true
    }

    // 检查API密钥是否有效
    if (!this.options.languageModelApiKey || this.options.languageModelApiKey.length < 10) {
      console.error('OwlService - 语言模型API密钥未配置或格式不正确')
      return false
    }

    try {
      console.log('OwlService - 尝试调用主进程initialize方法')
      // 使用安全的IPC调用主进程初始化OWL服务，带有重试机制
      const result = await safeIpcInvokeWithRetry(
        'owl:initialize',
        [
          {
            languageModelApiKey: this.options.languageModelApiKey,
            externalResourcesApiKey: this.options.externalResourcesApiKey || '',
            modelProvider: this.options.modelProvider || 'openai'
          }
        ],
        false, // 默认返回false，表示初始化失败
        5, // 重试5次
        1000 // 每次间隔1秒
      )

      // 只有当API密钥不是默认值时，才根据实际初始化结果判断
      if (!isDefaultApiKey) {
        this.isInitialized = !!result
        console.log(`OwlService - 初始化${this.isInitialized ? '成功' : '失败'}`, { result })
      }
      return this.isInitialized
    } catch (error) {
      const formattedError = formatIpcError(error)
      console.error('OwlService - 初始化服务时出错:', formattedError)
      this.isInitialized = false
      return false
    }
  }

  // 创建新会话
  async createSession(enabledToolkits: OwlToolkit[] | OwlToolkit = ['web_browser']): Promise<string> {
    try {
      // 确保enabledToolkits是数组
      const toolkitsArray = Array.isArray(enabledToolkits) ? enabledToolkits : [enabledToolkits]

      // 通过IPC调用主进程创建会话
      console.log('OwlService - 创建新会话', { enabledToolkits: toolkitsArray })
      const sessionId = await safeIpcInvoke('owl:create-session', toolkitsArray)

      if (!sessionId) {
        throw new Error('无法创建OWL会话')
      }

      // 创建本地会话对象用于UI显示
      const activeToolkit = toolkitsArray.length > 0 ? toolkitsArray[0] : 'web_browser'
      const session: OwlSession = {
        id: sessionId,
        messages: [],
        activeToolkit: activeToolkit as OwlToolkit,
        enabledToolkits: toolkitsArray,
        created: Date.now(),
        updated: Date.now(),
        isAutonomous: false
      }

      this.sessions.set(sessionId, session)
      this.toolResults.set(sessionId, [])

      // 添加系统消息
      this.addSystemMessage(sessionId, this.getSystemPrompt(toolkitsArray))

      return sessionId
    } catch (error) {
      const formattedError = formatIpcError(error)
      console.error('创建会话失败:', formattedError)
      // 创建一个临时本地会话ID，这样UI至少可以显示错误消息
      return `local_session_${Date.now()}`
    }
  }

  // 获取系统提示词
  private getSystemPrompt(enabledToolkits: OwlToolkit[]): string {
    const toolkitNames = enabledToolkits
      .map((toolkit) => {
        switch (toolkit) {
          case 'web_browser':
            return '网络浏览器'
          case 'web_search':
            return '网络搜索'
          case 'code_interpreter':
            return '代码解释器'
          case 'data_analysis':
            return '数据分析'
          case 'image_generation':
            return '图像生成'
          case 'file_manager':
            return '文件管理器'
          default:
            return toolkit
        }
      })
      .join('、')

    return `你是一个功能强大的AI助手，配备了先进的${toolkitNames}工具集。请回答用户的问题，并在必要时主动使用这些工具来提供最佳解答。当你使用工具时，请清晰地解释你的思考过程和所采取的行动。`
  }

  // 向会话添加系统消息
  private addSystemMessage(sessionId: string, content: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      console.error(`会话 ${sessionId} 不存在`)
      return
    }

    session.messages.push({
      role: 'system',
      content
    })

    session.updated = Date.now()
    this.sessions.set(sessionId, session)
  }

  // 向会话添加用户消息，并获取代理回复
  async addMessage(
    sessionId: string,
    content: string | Omit<OwlMessage, 'toolResults'>,
    autonomous = false
  ): Promise<OwlMessage | null> {
    // 检查会话是否存在
    const session = this.sessions.get(sessionId)
    if (!session) {
      this.logMessage('error', `会话 ${sessionId} 不存在`)
      return null
    }

    // 检查服务是否已初始化
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) {
        return {
          role: 'agent',
          content: '无法初始化OWL服务，请检查API密钥配置。'
        }
      }
    }

    // 处理用户消息
    const userMessage: OwlMessage =
      typeof content === 'string'
        ? { role: 'user', content, toolResults: [], autonomous }
        : { ...content, toolResults: [], autonomous }

    // 如果是自主模式，设置会话为自主模式
    if (autonomous && session) {
      session.isAutonomous = true
      session.autonomousGoal = userMessage.content
      if (!session.autonomousSteps) {
        session.autonomousSteps = []
      }
    }

    // 添加到会话中
    session.messages.push(userMessage)
    session.updated = Date.now()

    // 如果是用户消息，处理并获取代理响应
    if (userMessage.role === 'user') {
      return await this.processUserMessage(sessionId, userMessage)
    }

    return userMessage
  }

  // 调用语言模型API
  private async callModelApi(session: OwlSession): Promise<ModelApiResponse | null> {
    try {
      // 获取最后一条用户消息
      const lastUserMessage = session.messages.filter((msg) => msg.role === 'user').pop()

      if (!lastUserMessage) {
        return null
      }

      // 使用IPC调用主进程的API服务
      console.log('OwlService - 调用模型API', { sessionId: session.id })

      // 准备消息历史
      const messages = session.messages.map((msg) => ({
        role: msg.role,
        content: msg.content
      }))

      // 获取当前活动的工具集
      const toolDefinitions = this.getToolDefinitionsForToolkit(session.activeToolkit)

      // 通过IPC调用主进程的API
      const response = await safeIpcInvoke('owl:call-model-api', messages, toolDefinitions)

      if (!response) {
        throw new Error('模型API调用返回空响应')
      }

      // 确保返回的对象符合ModelApiResponse类型
      if (typeof response === 'object' && 'content' in response) {
        return response as ModelApiResponse
      }

      // 如果响应格式不正确，创建一个默认的ModelApiResponse
      return {
        content: typeof response === 'string' ? response : '模型响应格式不正确'
      }
    } catch (error) {
      const formattedError = formatIpcError(error)
      console.error('调用模型API出错:', formattedError)
      return {
        content: `调用模型API时出错: ${formattedError.message || '未知错误'}`
      }
    }
  }

  // 处理网络搜索调用
  private async processWebSearch(query: string): Promise<any> {
    // 模拟网络搜索结果
    // 在真实应用中，这里应该调用搜索API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      query,
      results: [
        {
          title: `关于 ${query} 的搜索结果 1`,
          url: `https://example.com/search?q=${encodeURIComponent(query)}`,
          snippet: `这是关于 ${query} 的信息摘要，包含了一些关键信息和描述...`
        },
        {
          title: `${query} 的详细介绍`,
          url: `https://example.org/details?topic=${encodeURIComponent(query)}`,
          snippet: `这里提供了 ${query} 的详细介绍和背景信息，可能对您的查询有所帮助。`
        },
        {
          title: `${query} 相关资源`,
          url: `https://resources.com/find?s=${encodeURIComponent(query)}`,
          snippet: `查找与 ${query} 相关的各种资源、文档和参考材料。`
        }
      ]
    }
  }

  // 处理代码执行调用
  private processCodeExecution(code: string, language: string): any {
    // 模拟代码执行结果
    // 在真实应用中，这里应该使用安全的代码沙盒执行代码
    return {
      executionTime: '0.05s',
      language,
      output: language === 'python' ? 'Hello, world!\n' : 'Code execution result',
      error: null
    }
  }

  // 处理数据分析调用
  private processDataAnalysis(dataType: string, operation: string): any {
    // 模拟数据分析结果
    // 在真实应用中，这里应该使用数据分析工具处理实际数据
    return {
      summary: `${dataType} 数据的 ${operation} 分析结果`,
      statistics: {
        平均值: '42.5',
        中位数: '41.0',
        标准差: '12.3',
        样本数: '100'
      },
      chart: true
    }
  }

  // 获取会话
  getSession(sessionId: string): OwlSession | null {
    return this.sessions.get(sessionId) || null
  }

  // 获取会话消息
  getMessages(sessionId: string): OwlMessage[] {
    const session = this.sessions.get(sessionId)
    return session ? session.messages : []
  }

  // 获取工具调用结果
  getToolResults(sessionId: string): OwlToolResult[] {
    return this.toolResults.get(sessionId) || []
  }

  // 设置活动工具集
  setActiveToolkit(sessionId: string, toolkit: OwlToolkit): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return false
    }

    if (!session.enabledToolkits.includes(toolkit)) {
      session.enabledToolkits.push(toolkit)
    }

    session.activeToolkit = toolkit
    session.updated = Date.now()
    this.sessions.set(sessionId, session)
    return true
  }

  // 清除会话
  async clearSession(sessionId: string): Promise<boolean> {
    try {
      // 通过IPC调用主进程清除会话
      console.log('OwlService - 清除会话', { sessionId })
      await safeIpcInvoke('owl:clear-session', [sessionId])

      // 清除本地会话对象
      return this.sessions.delete(sessionId) && this.toolResults.delete(sessionId)
    } catch (error) {
      const formattedError = formatIpcError(error)
      console.error('清除会话失败:', formattedError)
      // 尽管主进程操作可能失败，我们仍然清除本地会话
      return this.sessions.delete(sessionId) && this.toolResults.delete(sessionId)
    }
  }

  // 处理自主执行结果，决定下一步操作
  private async processAutonomousResults(sessionId: string, results: OwlToolResult[]): Promise<void> {
    const session = this.getSession(sessionId)
    if (!session || !session.isAutonomous) return

    // 更新自主步骤
    for (const result of results) {
      if (!session.autonomousSteps) {
        session.autonomousSteps = []
      }

      // 如果是进度报告
      if (result.toolName === 'report_progress') {
        session.autonomousSteps.push({
          status: result.result.status,
          description: result.result.description,
          result: result.result
        })
      }

      // 如果是子任务执行
      if (result.toolName === 'execute_subtask') {
        session.autonomousSteps.push({
          status: 'completed',
          description: result.result.subtask || '执行子任务',
          result: result.result
        })
      }

      // 如果工具结果中包含后续操作
      if (result.followUpAction) {
        // 根据后续操作类型处理
        switch (result.followUpAction.type) {
          case 'call_tool':
            // 自动调用下一个工具
            await this.executeToolCalls(sessionId, [
              {
                name: result.followUpAction.params.tool,
                arguments: result.followUpAction.params.arguments
              }
            ])
            break
          case 'message':
            // 自动发送消息
            await this.addMessage(
              sessionId,
              {
                role: 'user',
                content: result.followUpAction.params.content
              },
              true
            )
            break
        }
      }
    }

    // 如果任务似乎已完成（所有步骤都是completed状态），发送总结消息
    const allCompleted =
      session.autonomousSteps &&
      session.autonomousSteps.length > 0 &&
      session.autonomousSteps.every((step) => step.status === 'completed')

    if (allCompleted) {
      await this.addMessage(sessionId, {
        role: 'system',
        content: '所有任务步骤已完成，请提供完整总结'
      })
    }
  }

  // 为工具集生成工具定义
  private getToolDefinitionsForToolkit(
    toolkit: OwlToolkit
  ): Array<{ name: string; description: string; parameters: any }> {
    const toolDefinitions: Array<{ name: string; description: string; parameters: any }> = []

    switch (toolkit) {
      case 'web_search':
      case 'web_browser':
        toolDefinitions.push({
          name: 'web_search',
          description: '在互联网上搜索信息',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询词'
              }
            },
            required: ['query']
          }
        })
        break

      case 'code_interpreter':
        toolDefinitions.push({
          name: 'execute_code',
          description: '执行代码并返回结果',
          parameters: {
            type: 'object',
            properties: {
              language: {
                type: 'string',
                description: '编程语言，如python, javascript等'
              },
              code: {
                type: 'string',
                description: '要执行的代码'
              }
            },
            required: ['language', 'code']
          }
        })
        break

      case 'data_analysis':
        toolDefinitions.push({
          name: 'analyze_data',
          description: '分析数据并返回结果',
          parameters: {
            type: 'object',
            properties: {
              data_type: {
                type: 'string',
                description: '数据类型，如sample, json, csv等'
              },
              analysis_type: {
                type: 'string',
                description: '分析类型，如basic_statistics, correlation, clustering等'
              }
            },
            required: ['data_type']
          }
        })
        break

      case 'quality_evaluation':
        toolDefinitions.push({
          name: 'evaluate_quality',
          description: '评估内容质量并提供分数和建议',
          parameters: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: '要评估的内容'
              },
              criteria: {
                type: 'string',
                description: '评估标准，如clarity, coherence, relevance等'
              }
            },
            required: ['content']
          }
        })
        break

      case 'image_generation':
        toolDefinitions.push({
          name: 'generate_image',
          description: '根据描述生成图像',
          parameters: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: '图像描述提示词'
              },
              style: {
                type: 'string',
                description: '可选的图像风格'
              }
            },
            required: ['prompt']
          }
        })
        break

      case 'file_manager':
        toolDefinitions.push({
          name: 'manage_files',
          description: '管理文件操作',
          parameters: {
            type: 'object',
            properties: {
              operation: {
                type: 'string',
                description: '操作类型，如list, read, write等'
              },
              path: {
                type: 'string',
                description: '文件或目录路径'
              }
            },
            required: ['operation']
          }
        })
        break
    }

    return toolDefinitions
  }

  // 记录日志消息
  private logMessage(level: 'debug' | 'info' | 'warning' | 'error', message: string): void {
    const logLevels = {
      debug: 0,
      info: 1,
      warning: 2,
      error: 3
    }

    const configuredLevel = logLevels[this.options.logLevel] || 1
    const messageLevel = logLevels[level] || 0

    if (messageLevel >= configuredLevel) {
      switch (level) {
        case 'debug':
          console.debug(`[OWL] ${message}`)
          break
        case 'info':
          console.info(`[OWL] ${message}`)
          break
        case 'warning':
          console.warn(`[OWL] ${message}`)
          break
        case 'error':
          console.error(`[OWL] ${message}`)
          break
      }
    }
  }

  // 更新配置
  public updateOptions(options: Partial<OwlServiceOptions>): void {
    this.options = { ...this.options, ...options }
    this.isInitialized = false
  }

  // 处理用户消息
  private async processUserMessage(sessionId: string, userMessage: OwlMessage): Promise<OwlMessage | null> {
    if (!this.isInitialized && !(await this.initialize())) {
      this.logMessage('error', '服务未初始化，无法处理用户消息')
      return null
    }

    const session = this.sessions.get(sessionId)
    if (!session) return null

    // 将用户消息添加到会话历史中
    session.messages.push(userMessage)

    // 调用语言模型进行处理
    try {
      const agentResponse = await this.callModel(session.messages, session.activeToolkit, session.enabledToolkits)

      if (!agentResponse) {
        throw new Error('无法获取模型响应')
      }

      const agentMessage: OwlMessage = {
        role: 'agent',
        content: agentResponse.content,
        toolResults: []
      }

      // 如果有工具调用，处理工具调用
      if (agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
        const toolResults = await this.executeToolCalls(sessionId, agentResponse.toolCalls)
        agentMessage.toolResults = toolResults
      }

      session.messages.push(agentMessage)
      session.updated = Date.now()
      return agentMessage
    } catch (error: any) {
      this.logMessage('error', `处理用户消息时出错：${error.message}`)

      const errorMessage: OwlMessage = {
        role: 'agent',
        content: `抱歉，处理您的请求时出现错误：${error.message}`,
        toolResults: []
      }

      session.messages.push(errorMessage)
      return errorMessage
    }
  }

  // 调用语言模型API
  private async callModel(
    messages: OwlMessage[],
    activeToolkit: OwlToolkit,
    enabledToolkits: OwlToolkit[]
  ): Promise<ModelApiResponse | null> {
    this.logMessage('info', `使用${this.options.modelProvider}模型处理请求，活动工具集：${activeToolkit}`)

    try {
      // 转换消息格式为API期望的格式
      const apiMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content
      }))

      // 添加系统提示，说明可用工具集
      apiMessages.unshift({
        role: 'system',
        content: `你是OWL智能助手，一个功能强大的AI代理。你可以使用以下工具集：${enabledToolkits.join(', ')}。
                 当前激活的工具集是：${activeToolkit}。请根据用户的问题提供帮助，并在需要时利用这些工具集解决问题。`
      })

      // 获取当前工具集的工具定义
      const tools = this.getToolDefinitionsForToolkit(activeToolkit)

      // 根据不同的模型提供商调用相应的API
      if (this.options.modelProvider === 'openai') {
        return await this.callOpenAIAPI(apiMessages, tools)
      } else if (this.options.modelProvider === 'anthropic') {
        return await this.callAnthropicAPI(apiMessages, tools)
      } else if (this.options.modelProvider === 'google') {
        return await this.callGoogleAPI(apiMessages, tools)
      } else {
        // 本地模式或API密钥不可用时使用模拟响应
        this.logMessage('warning', '未配置API密钥或使用本地模式，返回模拟响应')
        return this.simulateModelResponse(apiMessages, activeToolkit)
      }
    } catch (error: any) {
      this.logMessage('error', `模型API调用失败：${error.message || '未知错误'}`)
      return null
    }
  }

  // 调用OpenAI API
  private async callOpenAIAPI(
    messages: { role: string; content: string }[],
    tools: Array<{ name: string; description: string; parameters: any }>
  ): Promise<ModelApiResponse | null> {
    // 验证API密钥
    if (!this.options.languageModelApiKey) {
      this.logMessage('error', 'OpenAI API密钥未配置')
      return null
    }

    try {
      // 准备请求数据
      const data = {
        model: 'gpt-4-turbo', // 或其他支持工具调用的模型
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        temperature: 0.7
      }

      // 设置请求头
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.languageModelApiKey}`
      }

      // 使用safeIpcInvoke调用主进程发送HTTP请求，避免在渲染进程中直接发送网络请求
      const response = await safeIpcInvokeWithRetry('owl:http-request', [
        {
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
          headers,
          data,
          timeout: 60000 // 60秒超时
        }
      ])

      // 处理响应
      if (response && response.data) {
        const result = response.data

        // 格式化返回结果
        const modelResponse: ModelApiResponse = {
          content: safeGet(result, 'choices[0].message.content') || ''
        }

        // 处理工具调用
        const toolCalls = safeGet(result, 'choices[0].message.tool_calls') || []
        if (toolCalls.length > 0) {
          modelResponse.toolCalls = toolCalls.map((call: any) => ({
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments)
          }))
        }

        return modelResponse
      }

      throw new Error('服务器响应格式异常')
    } catch (error: any) {
      this.logMessage('error', `OpenAI API调用失败: ${error.message || '未知错误'}`)
      return null
    }
  }

  // 调用Anthropic API (Claude)
  private async callAnthropicAPI(
    messages: { role: string; content: string }[],
    tools: Array<{ name: string; description: string; parameters: any }>
  ): Promise<ModelApiResponse | null> {
    // 验证API密钥
    if (!this.options.languageModelApiKey) {
      this.logMessage('error', 'Anthropic API密钥未配置')
      return null
    }

    try {
      // Claude API需要转换系统消息为人类消息
      const anthropicMessages = messages.map((msg) => {
        if (msg.role === 'system') {
          return { role: 'user', content: `<system>${msg.content}</system>` }
        }
        return msg
      })

      // 准备请求数据
      const data = {
        model: 'claude-3-opus-20240229', // 或其他适合的Claude模型
        messages: anthropicMessages,
        tools: tools.length > 0 ? { tools } : undefined,
        temperature: 0.7,
        max_tokens: 4000
      }

      // 设置请求头
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': this.options.languageModelApiKey,
        'anthropic-version': '2023-06-01'
      }

      // 使用safeIpcInvoke调用主进程发送HTTP请求
      const response = await safeIpcInvokeWithRetry('owl:http-request', [
        {
          url: 'https://api.anthropic.com/v1/messages',
          method: 'POST',
          headers,
          data,
          timeout: 60000 // 60秒超时
        }
      ])

      // 处理响应
      if (response && response.data) {
        const result = response.data

        // 格式化返回结果
        const modelResponse: ModelApiResponse = {
          content: safeGet(result, 'content[0].text') || ''
        }

        // 处理工具调用
        const toolCalls = safeGet(result, 'tool_use') || []
        if (toolCalls && toolCalls.length > 0) {
          modelResponse.toolCalls = toolCalls.map((call: any) => ({
            name: call.name,
            arguments: call.input
          }))
        }

        return modelResponse
      }

      throw new Error('服务器响应格式异常')
    } catch (error: any) {
      this.logMessage('error', `Anthropic API调用失败: ${error.message || '未知错误'}`)
      return null
    }
  }

  // 调用Google API (Gemini)
  private async callGoogleAPI(
    messages: { role: string; content: string }[],
    tools: Array<{ name: string; description: string; parameters: any }>
  ): Promise<ModelApiResponse | null> {
    // 验证API密钥
    if (!this.options.languageModelApiKey) {
      this.logMessage('error', 'Google API密钥未配置')
      return null
    }

    try {
      // 准备请求数据 - Gemini格式
      const geminiTools = tools.map((tool) => ({
        function_declarations: [
          {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }
        ]
      }))

      // 在系统消息中添加工具集信息
      const availableTools = [
        'web_search',
        'code_interpreter',
        'image_generation',
        'web_browser',
        'file_manager',
        'data_analysis',
        'autonomous_agent'
      ]

      // 查找现有的系统消息或创建新的
      let systemMessageIndex = messages.findIndex((msg) => msg.role === 'system')
      let systemContent = '你是OWL智能助手，一个功能强大的AI代理。'

      if (systemMessageIndex >= 0) {
        // 更新现有系统消息
        systemContent = messages[systemMessageIndex].content
      } else {
        // 添加新系统消息
        messages.unshift({
          role: 'system',
          content: systemContent
        })
        systemMessageIndex = 0
      }

      // 添加工具集信息到系统消息中
      if (!systemContent.includes('工具集')) {
        const toolsDescription = `你可以使用以下工具集：${availableTools.join(', ')}。\n当前激活的工具集是：autonomous_agent。请根据用户的问题提供帮助，并在需要时利用这些工具集解决问题。`
        messages[systemMessageIndex].content = `${systemContent} ${toolsDescription}`
      }

      // 根据官方API格式和成功的curl示例构建请求体
      const data: any = {
        contents: messages.map((msg) => ({
          // 正确映射角色: 用户->user, 助手->model, 系统消息在Gemini中作为user特殊处理
          role:
            msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'model' : msg.role === 'system' ? 'user' : 'user',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          topP: 0.9
        }
      }

      // 只有在确实有工具定义时才添加tools字段
      if (geminiTools.length > 0) {
        data.tools = geminiTools
      }

      // 记录完整的请求信息以便调试
      this.logMessage('debug', `完整的Google API请求数据: ${JSON.stringify(data, null, 2)}`)

      // 根据curl示例设置请求头，添加所有必要的请求头
      const headers = {
        'Content-Type': 'application/json',
        accept: '*/*',
        'accept-language': 'zh-CN',
        priority: 'u=1, i',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        referer: 'http://localhost:5173/',
        'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) cherry-studio/1.0.7 Chrome/126.0.6478.234 Electron/31.7.6 Safari/537.36'
      }

      // Gemini API URL包含密钥
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.options.languageModelApiKey}`

      this.logMessage('info', `尝试直接调用Google API而不通过IPC: ${apiUrl.substring(0, 70)}...`)

      try {
        // 直接使用fetch API调用Google API，而不是通过IPC
        // 添加AbortController来处理超时
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          this.logMessage('error', `Google API请求超时(20秒)`)
          controller.abort()
        }, 20000) // 20秒超时

        this.logMessage('info', `发送Google API请求，请求URL: ${apiUrl.substring(0, 70)}...`)
        this.logMessage('info', `请求数据长度: ${JSON.stringify(data).length} 字节`)

        // 尝试发送请求并处理可能的网络错误
        let fetchResponse
        try {
          fetchResponse = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
            signal: controller.signal
          })

          clearTimeout(timeoutId)
          // 记录响应状态
          this.logMessage('info', `Google API响应状态码: ${fetchResponse.status}`)
        } catch (fetchError) {
          // 如果是超时导致的错误，提供更清晰的错误消息
          if (fetchError.name === 'AbortError') {
            throw new Error('请求超时: Google API响应时间过长。请检查您的网络连接并重试。')
          }
          // 其他网络错误
          throw new Error(`连接到Google API时出错: ${fetchError.message}`)
        }

        if (!fetchResponse.ok) {
          // 尝试获取错误详情
          let errorText = ''
          try {
            errorText = await fetchResponse.text()
          } catch (e) {
            errorText = '无法获取错误详情'
          }

          // 根据HTTP状态码提供特定的错误信息
          let errorMessage = ''
          switch (fetchResponse.status) {
            case 400:
              errorMessage = 'API请求格式错误'
              break
            case 401:
              errorMessage = 'API密钥无效或授权失败'
              break
            case 403:
              errorMessage = '无权访问API'
              break
            case 404:
              errorMessage = 'API端点不存在'
              break
            case 429:
              errorMessage = 'API调用超出限制频率'
              break
            case 500:
            case 502:
            case 503:
              errorMessage = 'Google API服务器错误'
              break
            default:
              errorMessage = `Google API响应错误: 状态码 ${fetchResponse.status}`
          }

          this.logMessage('error', `${errorMessage}, 错误详情: ${errorText}`)
          throw new Error(`${errorMessage}\n\n错误详情: ${errorText}`)
        }

        const result = await fetchResponse.json()
        // 安全地记录响应结构，防止过长的日志
        this.logMessage('debug', `Google API响应结构: ${JSON.stringify(Object.keys(result))}`)
        this.logMessage('debug', `Google API响应候选数: ${result.candidates ? result.candidates.length : 0}`)

        // 格式化返回结果
        const modelResponse: ModelApiResponse = {
          content: ''
        }

        // 更强大的响应解析逻辑，兼容不同的Gemini API响应格式
        if (result.candidates && Array.isArray(result.candidates) && result.candidates.length > 0) {
          const candidate = result.candidates[0]

          // 尝试多种可能的结构
          if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
            // 标准Gemini格式
            for (const part of candidate.content.parts) {
              if (part.text) {
                modelResponse.content += part.text
              } else if (typeof part === 'string') {
                modelResponse.content += part
              } else if (part.functionCall) {
                // 处理函数调用
                modelResponse.toolCalls = modelResponse.toolCalls || []
                modelResponse.toolCalls.push({
                  name: part.functionCall.name,
                  arguments: part.functionCall.args || {}
                })
                this.logMessage('debug', `检测到工具调用: ${part.functionCall.name}`)
              } else if (part.toolUse || part.toolCalls) {
                // 处理自主代理工具调用 (新格式)
                const toolData = part.toolUse || part.toolCalls
                modelResponse.toolCalls = modelResponse.toolCalls || []

                if (Array.isArray(toolData)) {
                  // 数组格式
                  for (const tool of toolData) {
                    const toolName = tool.name || tool.type || 'autonomous_agent'
                    const toolArgs = tool.args || tool.arguments || tool.input || {}

                    modelResponse.toolCalls.push({
                      name: toolName,
                      arguments: toolArgs
                    })

                    // 安全地记录工具调用信息，防止日志过长
                    this.logMessage('debug', `检测到自主代理工具调用: ${toolName}`)
                    this.logMessage('debug', `工具参数类型: ${typeof toolArgs}`)
                  }
                } else if (toolData) {
                  // 单个工具调用
                  const toolName = toolData.name || toolData.type || 'autonomous_agent'
                  const toolArgs = toolData.args || toolData.arguments || toolData.input || {}

                  modelResponse.toolCalls.push({
                    name: toolName,
                    arguments: toolArgs
                  })

                  // 安全地记录工具调用信息
                  this.logMessage('debug', `检测到自主代理工具调用: ${toolName}`)
                  this.logMessage('debug', `工具参数类型: ${typeof toolArgs}`)
                }
              }
            }
          } else if (candidate.text) {
            // 简化的格式
            modelResponse.content = candidate.text
          } else if (typeof candidate === 'string') {
            // 纯文本格式
            modelResponse.content = candidate
          } else {
            // 尝试直接将对象字符串化
            this.logMessage('warning', `使用备用方法解析响应: ${JSON.stringify(candidate).substring(0, 200)}`)
            modelResponse.content = JSON.stringify(candidate)
          }
        } else if (result.text) {
          // 直接文本响应
          modelResponse.content = result.text
        } else if (result.content) {
          // 另一种可能的格式
          if (typeof result.content === 'string') {
            modelResponse.content = result.content
          } else if (result.content.parts && Array.isArray(result.content.parts)) {
            for (const part of result.content.parts) {
              if (part.text) {
                modelResponse.content += part.text
              }
            }
          } else {
            modelResponse.content = JSON.stringify(result.content)
          }
        } else {
          // 尝试转化整个响应
          this.logMessage('warning', `无法解析的API响应格式: ${JSON.stringify(Object.keys(result))}`)
          modelResponse.content = JSON.stringify(result).substring(0, 500) + '...'
        }

        if (!modelResponse.content) {
          this.logMessage('warning', `无法从响应中提取内容: ${JSON.stringify(result)}`)
          modelResponse.content = '无法从API响应中提取有效内容'
        }

        return modelResponse
      } catch (fetchError: any) {
        this.logMessage('error', `直接调用Google API失败: ${fetchError.message}，尝试通过IPC调用`)

        // 作为后备，尝试通过IPC调用
        this.logMessage('info', `尝试通过IPC池进行调用，超时设置为30秒`)
        const response = await safeIpcInvokeWithRetry(
          'owl:http-request',
          [
            {
              url: apiUrl,
              method: 'POST',
              headers,
              data,
              timeout: 30000 // 30秒超时
            }
          ],
          2
        ) // 增加重试次数

        // 安全处理response可能为null的情况
        // 将response类型改为any来避免TypeScript的null检查
        const safeResponse: any = response
        if (safeResponse && typeof safeResponse === 'object' && 'data' in safeResponse) {
          // 直接使用安全引用获取数据
          const result = safeResponse.data || {}
          // 对IPC响应使用相同的增强解析逻辑
          const modelResponse: ModelApiResponse = { content: '' }

          // 使用safeGet安全访问结果中的候选者数组
          const candidates = safeGet(result, 'candidates')
          // 确保候选者是数组类型
          const candidatesArray = Array.isArray(candidates) ? candidates : []

          if (candidatesArray.length > 0) {
            // 使用安全访问数组的第一个元素
            const candidate = candidatesArray[0]
            // 安全访问候选者的内容和部分
            const content = safeGet(candidate, 'content')
            const contentObj = content || {}
            const parts = safeGet(contentObj, 'parts')
            const partsArray = Array.isArray(parts) ? parts : []

            if (partsArray.length > 0) {
              for (const part of partsArray) {
                // 安全访问文本属性
                const text = safeGet(part, 'text')
                if (text) modelResponse.content += text
              }
            } else if (candidate.text) {
              modelResponse.content = candidate.text
            }
          } else if (safeGet(result, 'text')) {
            modelResponse.content = result.text
          } else {
            // 尝试使用safe函数获取响应
            modelResponse.content =
              safeGet(result, 'candidates[0].content.parts[0].text') ||
              safeGet(result, 'candidates[0].text') ||
              safeGet(result, 'content.parts[0].text') ||
              safeGet(result, 'content.text') ||
              safeGet(result, 'text') ||
              ''
          }

          if (!modelResponse.content) {
            this.logMessage('warning', `通过IPC无法解析内容: ${JSON.stringify(result).substring(0, 200)}`)
            modelResponse.content = '通过IPC调用获取到响应，但无法解析内容'
          } else {
            this.logMessage('info', `通过IPC成功解析响应，内容长度: ${modelResponse.content.length} 字符`)
          }

          return modelResponse
        }

        throw new Error('通过IPC调用失败且无法解析响应')
      }
    } catch (error: any) {
      const errorDetails = error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) : ''

      // 根据错误类型生成用户友好的错误消息
      let userFriendlyError = error.message || '未知错误'
      if (userFriendlyError.includes('timeout') || userFriendlyError.includes('超时')) {
        userFriendlyError = 'API请求超时，请检查您的网络连接或者API时尚可用'
      } else if (userFriendlyError.includes('network') || userFriendlyError.includes('网络')) {
        userFriendlyError = '网络连接错误，请确认您能够访问Google的服务'
      } else if (
        error.response?.status === 403 ||
        errorDetails.includes('permission') ||
        errorDetails.includes('auth')
      ) {
        userFriendlyError = 'API授权错误，请检查您的API密钥是否有效'
      } else if (error.response?.status === 404) {
        userFriendlyError = 'API端点不存在，请检查API URL是否正确'
      }

      this.logMessage('error', `Google API调用失败: ${userFriendlyError} ${errorDetails}`)

      // 尝试通过IPC测试API连接以获取更多详细信息
      try {
        safeIpcInvokeWithRetry('owl:test-api-connection', [])
          .then((result) => {
            if (result && result.status === 'error') {
              this.logMessage('error', `API连接测试结果: ${result.message}`)
            }
          })
          .catch((testError) => {
            this.logMessage('error', `API连接测试失败: ${testError.message || '未知错误'}`)
          })
      } catch (testError) {
        // 忽略这里的错误，因为这是一个辅助检测
      }

      // 返回带有错误信息的对象，而不是直接返回null
      // 这样上层应用可以展示错误信息给用户
      return {
        content: `无法连接到Google API: ${userFriendlyError}`,
        error: true,
        errorType: error.name || 'APIError',
        errorDetails: errorDetails
      }
    }
  }

  // 模拟模型响应（用于示例）
  private simulateModelResponse(messages: { role: string; content: string }[], toolkit: OwlToolkit): ModelApiResponse {
    // 获取最新的用户消息（从后往前查找）
    const userMessage = [...messages].reverse().find((m) => m.role === 'user')
    const userQuery = userMessage?.content || ''

    // 获取对话历史，用于判断上下文
    const conversationHistory = messages.filter((m) => m.role === 'user' || m.role === 'agent')
    const isFollowUp = conversationHistory.length > 2 // 判断是否是后续问题

    // 获取之前的用户查询，但只考虑最近5条消息以避免误判
    const recentUserQueries = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .slice(-6, -1) // 获取最近的5条用户消息，排除当前消息

    // 防止重复回答相同的问题 - 只比较最近的消息且检查是否是简短问题
    // 只有当用户输入比较短（10个字符以内）且和最近的一次提问完全一致时才判断为重复
    const previouslyAskedSameQuestion =
      userQuery.trim().length <= 10 &&
      recentUserQueries.length > 0 &&
      recentUserQueries[recentUserQueries.length - 1]?.toLowerCase().trim() === userQuery.toLowerCase().trim()

    console.log('OWL处理消息:', {
      userQuery,
      isFollowUp,
      previousQueries: recentUserQueries,
      toolkit,
      messagesCount: messages.length
    })

    let simulatedResponse: ModelApiResponse = {
      content: '我已收到您的请求，正在处理中...'
    }

    // 如果是重复的问题，给出提示
    // 注意：添加额外检查，确保输入不是常见的简短问候语或测试词
    const commonShortQueries = ['hi', 'hello', '你好', '测试', 'test', '?', '？']
    if (previouslyAskedSameQuestion && !commonShortQueries.includes(userQuery.toLowerCase().trim())) {
      return {
        content:
          '我注意到您再次询问同样的问题。我可以尝试用不同的方式回答，或者您可以提供更多细节，这样我能更好地帮助您。'
      }
    }

    // 根据工具集和用户查询模拟不同的响应
    if (toolkit === 'web_browser' || toolkit === 'web_search') {
      if (userQuery.includes('搜索') || userQuery.includes('查找') || userQuery.includes('查询')) {
        simulatedResponse = {
          content: `我将帮您在网络上查找相关信息。以下是关于"${userQuery.replace(/搜索|查找|查询/g, '').trim()}"的搜索结果:`,
          toolCalls: [
            {
              name: 'web_search',
              arguments: {
                query: userQuery.replace(/搜索|查找|查询/g, '').trim()
              }
            }
          ]
        }
      } else if (userQuery.match(/是什么|什么是|介绍/)) {
        // 识别定义性问题
        const topic = userQuery.replace(/是什么|什么是|介绍|请|你能|可以|我想|知道/g, '').trim()
        simulatedResponse = {
          content: `我将为您查找关于"${topic}"的信息：`,
          toolCalls: [
            {
              name: 'web_search',
              arguments: {
                query: `${topic} 定义 介绍`
              }
            }
          ]
        }
      } else {
        // 直接进行搜索
        simulatedResponse = {
          content: `让我为您查找关于"${userQuery}"的信息：`,
          toolCalls: [
            {
              name: 'web_search',
              arguments: {
                query: userQuery
              }
            }
          ]
        }
      }
    } else if (toolkit === 'code_interpreter') {
      if (
        userQuery.includes('代码') ||
        userQuery.includes('编程') ||
        userQuery.includes('函数') ||
        userQuery.includes('示例')
      ) {
        // 分析问题，生成更相关的代码示例
        let language = 'python' // 默认语言
        let code = 'print("Hello, World!")'

        // 检测编程语言
        if (userQuery.includes('JavaScript') || userQuery.includes('JS') || userQuery.includes('javascript')) {
          language = 'javascript'
          code = 'console.log("Hello, World!");'
        } else if (userQuery.includes('TypeScript') || userQuery.includes('typescript')) {
          language = 'typescript'
          code = 'const greeting: string = "Hello, World!"\nconsole.log(greeting);'
        }

        simulatedResponse = {
          content: `根据您的请求，我为您准备了${language}示例代码：`,
          toolCalls: [
            {
              name: 'execute_code',
              arguments: {
                language,
                code
              }
            }
          ]
        }
      } else {
        // 更智能的代码建议
        simulatedResponse = {
          content: '我理解您可能需要编程帮助。请问您想用哪种编程语言解决什么具体问题呢？我可以提供代码示例和解释。'
        }
      }
    } else if (toolkit === 'data_analysis') {
      if (userQuery.includes('分析') || userQuery.includes('数据') || userQuery.includes('统计')) {
        const analysisType = userQuery.includes('高级') ? 'advanced_analytics' : 'basic_statistics'
        simulatedResponse = {
          content: '我将帮您分析数据，正在准备分析结果：',
          toolCalls: [
            {
              name: 'analyze_data',
              arguments: {
                data_type: 'example',
                analysis_type: analysisType
              }
            }
          ]
        }
      } else {
        simulatedResponse = {
          content:
            '我可以帮您分析各种数据。请描述您需要分析的数据类型和分析目标，或者我可以为您生成一些示例数据进行演示。'
        }
      }
    } else if (toolkit === 'quality_evaluation') {
      if (userQuery.includes('评估') || userQuery.includes('质量') || userQuery.includes('评价')) {
        // 确定评估类型
        let evaluationType = 'content' // 默认类型
        if (userQuery.includes('代码')) evaluationType = 'code'
        if (userQuery.includes('设计')) evaluationType = 'design'

        simulatedResponse = {
          content: `我将为您提供${evaluationType === 'code' ? '代码' : evaluationType === 'design' ? '设计' : '内容'}质量评估，请稍等片刻：`,
          toolCalls: [
            {
              name: 'evaluate_quality',
              arguments: {
                content: userQuery.replace(/评估|质量|评价/g, '').trim(),
                type: evaluationType
              }
            }
          ]
        }
      } else {
        simulatedResponse = {
          content:
            '我可以对内容、代码或设计进行质量评估。请提供您想要评估的具体内容，并指明是希望评估内容质量、代码质量还是设计质量。'
        }
      }
    } else {
      // 生成多样化的默认响应
      const responseTemplates = [
        `关于"${userQuery}"，我理解您的问题并将尽力解答。作为一个拥有${toolkit}工具能力的AI助手，我能提供哪些具体帮助？`,
        `您询问的是关于"${userQuery}"。我可以使用${toolkit}工具集来协助您。能请您提供更多具体的需求吗？`,
        `我已收到您关于"${userQuery}"的问题。我将结合${toolkit}工具为您提供专业解答。您需要什么具体信息？`,
        `关于"${userQuery}"的问题很有趣。我可以运用${toolkit}工具集来探索这个话题，请告诉我您最关心的方面是什么？`
      ]
      // 根据对话轮次选择不同模板，避免重复
      const templateIndex = conversationHistory.length % responseTemplates.length
      simulatedResponse = {
        content: responseTemplates[templateIndex]
      }
    }

    return simulatedResponse
  }

  // 启动自主代理执行任务
  async startAutonomousTask(sessionId: string, goal: string): Promise<void> {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`)
    }

    // 激活自主代理工具集
    if (!session.enabledToolkits.includes('autonomous_agent')) {
      session.enabledToolkits.push('autonomous_agent')
    }
    session.activeToolkit = 'autonomous_agent'
    session.isAutonomous = true
    session.autonomousGoal = goal
    session.autonomousSteps = []

    // 添加系统消息，说明这是自主任务
    this.addSystemMessage(
      sessionId,
      `你现在是一个自主代理，需要完成以下目标：${goal}\n请自行分解任务，并按步骤执行，无需用户进一步确认。每完成一个步骤，都应报告进度并自动进行下一步。`
    )

    // 启动自主任务
    await this.addMessage(sessionId, { role: 'user', content: goal }, true)
  }

  // 停止自主代理任务执行
  async stopAutonomousTask(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`)
    }

    // 如果会话不是自主模式，直接返回
    if (!session.isAutonomous) return

    // 设置会话为非自主模式
    session.isAutonomous = false
    session.autonomousGoal = ''

    // 添加系统消息通知任务已停止
    this.addSystemMessage(sessionId, '自主任务已被用户停止。请停止当前正在进行的操作，并等待用户的新指示。')

    console.log('OwlService - 自主任务已停止', { sessionId })
  }
  // 执行工具调用
  private async executeToolCalls(
    sessionId: string,
    toolCalls: { name: string; arguments: Record<string, any> }[]
  ): Promise<OwlToolResult[]> {
    const results: OwlToolResult[] = []

    for (const tool of toolCalls) {
      try {
        this.logMessage('info', `执行工具调用：${tool.name}，参数：${JSON.stringify(tool.arguments)}`)

        // 根据工具类型执行不同的操作
        let result: any

        switch (tool.name) {
          case 'web_search':
            result = await this.simulateWebSearch(tool.arguments.query)
            break
          case 'execute_code':
            result = await this.simulateCodeExecution(tool.arguments.code, tool.arguments.language)
            break
          case 'analyze_data':
            result = await this.simulateDataAnalysis(tool.arguments.data_type, tool.arguments.analysis_type)
            break
          case 'evaluate_quality':
            result = await this.evaluateQuality(tool.arguments.content, tool.arguments.type)
            break
          default:
            result = { message: `未实现的工具：${tool.name}` }
        }

        results.push({
          toolId: `${tool.name}-${Date.now()}`,
          toolName: tool.name,
          result,
          status: 'success',
          timestamp: Date.now()
        })
      } catch (error: any) {
        this.logMessage('error', `工具执行失败：${tool.name}，错误：${error.message}`)

        results.push({
          toolId: `${tool.name}-${Date.now()}`,
          toolName: tool.name,
          result: { error: error.message },
          status: 'error',
          timestamp: Date.now()
        })
      }
    }

    return results
  }

  // 模拟网络搜索
  private async simulateWebSearch(query: string): Promise<any> {
    // 实际实现中应该使用实际的搜索API，如Google、Bing等
    this.logMessage('debug', `模拟网络搜索：${query}`)

    // 返回模拟搜索结果
    return {
      results: [
        {
          title: `关于 "${query}" 的搜索结果 1`,
          url: 'https://example.com/1',
          snippet: `这是关于 "${query}" 的第一个搜索结果摘要。这里包含一些相关的信息...`
        },
        {
          title: `关于 "${query}" 的搜索结果 2`,
          url: 'https://example.com/2',
          snippet: `这是关于 "${query}" 的第二个搜索结果摘要。这里包含更多相关的信息...`
        }
      ]
    }
  }

  // 模拟代码执行
  private async simulateCodeExecution(code: string, language: string): Promise<any> {
    // 实际实现中应该使用安全的代码执行环境
    this.logMessage('debug', `模拟代码执行：${language} 代码段`)

    // 返回模拟执行结果
    return {
      output: `// 代码执行结果\nHello, World!`,
      language,
      executionTime: '0.05s'
    }
  }

  // 模拟数据分析
  private async simulateDataAnalysis(dataType: string, analysisType: string): Promise<any> {
    this.logMessage('debug', `模拟数据分析：${dataType} 数据，${analysisType} 分析`)

    // 返回模拟分析结果
    return {
      summary: '数据分析完成',
      statistics: {
        mean: 42.5,
        median: 38.0,
        min: 10,
        max: 95
      },
      chart: '模拟图表数据 URL'
    }
  }

  // 处理工具调用
  private async processToolCalls(sessionId: string, toolCalls: any[]): Promise<OwlToolResult[]> {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error(`未找到会话: ${sessionId}`)
    }

    const results: OwlToolResult[] = []

    for (const call of toolCalls) {
      try {
        // 根据工具名称执行对应的操作
        const toolId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const toolName = call.name || '未知工具'
        let result: any = null
        let status: 'success' | 'error' | 'running' = 'running'

        // 模拟工具调用
        switch (toolName) {
          case 'web_search':
            result = this.simulateWebSearch(call.arguments?.query || '')
            status = 'success'
            break
          case 'execute_code':
            result = await this.simulateCodeExecution(call.arguments?.code || '', call.arguments?.language || 'python')
            status = 'success'
            break
          case 'analyze_data':
            result = await this.simulateDataAnalysis(
              call.arguments?.data_type || 'example',
              call.arguments?.analysis_type || 'basic'
            )
            status = 'success'
            break
          default:
            throw new Error(`不支持的工具: ${toolName}`)
        }

        // 添加结果
        const toolResult: OwlToolResult = {
          toolId,
          toolName,
          result,
          status,
          timestamp: Date.now()
        }

        results.push(toolResult)
      } catch (error: any) {
        this.logMessage('error', `执行工具调用失败: ${error.message}`)
        results.push({
          toolId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          toolName: call.name || '未知工具',
          result: { error: error.message },
          status: 'error',
          timestamp: Date.now()
        })
      }
    }

    return results
  }

  /**
   * 评估内容质量
   * @param content 要评估的内容
   * @param type 内容类型：'content'(文本内容), 'code'(代码), 'design'(设计)
   * @returns 质量评估结果
   */
  async evaluateQuality(
    content: string,
    type: 'content' | 'code' | 'design' = 'content'
  ): Promise<QualityEvaluationResult> {
    try {
      console.log(`开始评估${type}质量`)

      // 使用安全的IPC调用主进程中的评估方法
      const result = await safeIpcInvoke('owl:evaluate-quality', [content, type], null)
      if (!result) {
        throw new Error('未收到评估结果')
      }
      return result as QualityEvaluationResult
    } catch (error: any) {
      const formattedError = formatIpcError(error)
      console.error('质量评估失败:', formattedError)
      // 如果主进程调用失败，则使用本地模拟方法作为备选
      return this.simulateQualityEvaluation(content, type)
    }
  }

  /**
   * 模拟质量评估结果（本地备用方法）
   * @param content 要评估的内容
   * @param type 内容类型
   * @returns 模拟的评估结果
   */
  private simulateQualityEvaluation(
    content: string,
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
      content: [
        '考虑添加更多关键数据来支持您的论点',
        '可以通过具体示例来增强说明性',
        '结构可以更加清晰，考虑使用子标题或分点说明'
      ],
      code: ['考虑添加更详细的注释来解释复杂逻辑', '可以重构部分代码以提高可读性', '建议进行异常处理以增强健壮性'],
      design: ['可以增强颜色对比度以提高可读性', '考虑简化部分界面元素，减少视觉干扰', '建议优化移动设备上的显示效果']
    }

    return {
      score: averageScore,
      criteria,
      summary: `总体质量评分为${averageScore}分（满分10分）。${averageScore >= 8 ? '整体质量很好' : averageScore >= 6 ? '质量尚可，但有改进空间' : '需要重大改进'}。`,
      suggestions: suggestionMap[type] || suggestionMap.content
    }
  }

  // 测试API连接
  async testApiConnection(): Promise<{
    status: 'success' | 'error'
    provider: string
    message: string
  }> {
    try {
      // 验证API密钥
      if (!this.options.languageModelApiKey) {
        return {
          status: 'error',
          provider: this.options.modelProvider,
          message: `${this.options.modelProvider} API密钥未配置`
        }
      }

      // 简单测试消息
      const testMessages = [
        {
          role: 'user',
          content: '你好，这是一条测试消息，请回复"API连接测试成功"。'
        }
      ]

      // 不使用工具
      const tools: any[] = []

      // 根据不同的模型提供商测试API连接
      let response = null
      if (this.options.modelProvider === 'openai') {
        response = await this.callOpenAIAPI(testMessages, tools)
      } else if (this.options.modelProvider === 'anthropic') {
        response = await this.callAnthropicAPI(testMessages, tools)
      } else if (this.options.modelProvider === 'google') {
        response = await this.callGoogleAPI(testMessages, tools)
      }

      if (response) {
        return {
          status: 'success',
          provider: this.options.modelProvider,
          message: `API连接测试成功，模型响应: ${response.content.substring(0, 50)}...`
        }
      } else {
        return {
          status: 'error',
          provider: this.options.modelProvider,
          message: `API连接测试失败，未收到有效响应`
        }
      }
    } catch (error: any) {
      return {
        status: 'error',
        provider: this.options.modelProvider,
        message: `API连接测试失败: ${error.message || '未知错误'}`
      }
    }
  }
}

export const owlService = new OwlService()
export default owlService
