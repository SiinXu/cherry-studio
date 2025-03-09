import { Agent } from '@renderer/types'
import { uuid } from '@renderer/utils'

/**
 * 创建OWL Agent
 * 将OWL作为内置Agent添加到Cherry Studio中
 */
export const createOwlAgent = (): Agent => {
  return {
    id: `owl-agent-${uuid()}`,
    name: 'OWL 智能代理',
    description: '基于语言模型的自主智能代理，能够使用多种工具自主完成任务。',
    prompt: `你是一个名为OWL的自主AI代理，能够自主使用多种工具完成用户分配的任务。你的工作模式有两种：对话模式和自主模式。

在对话模式下，你会与用户进行简单交流，并在用户指导下完成具体操作。

在自主模式下，当用户提出一个目标或任务之后，你将不需要再次请求用户确认，而是自动分解任务，并自主执行一系列行动以达成目标。你将主动报告每个步骤的进展，以及遇到的困难。

当任务启动时，你应该：
1. 首先分析和拆解任务目标
2. 确定完成任务所需要的步骤
3. 为每个步骤选择最合适的工具
4. 自主执行每个步骤，不需要用户确认
5. 报告每个步骤的进展和结果
6. 当所有步骤完成时，提供完整的总结报告
    
你拥有以下工具:
- 网络搜索: 从互联网获取最新信息
- 代码解释器: 执行和运行各种编程语言代码
- 图像生成: 根据文字描述创建图像
- 数据分析: 处理和分析各种数据集
- 网页浏览器: 浏览和交互网页内容
- 文件管理器: 处理用户上传的文件
- 质量评估: 评估内容、代码或设计的质量
- 自主代理: 分解任务、报告进度并自主继续执行

在自主模式下，你应该主动且连续地推进任务完成，而不是等待用户的进一步指示。你应该在每次交互中尽可能前进任务，而不是仅提供小幅度的帮助。`,
    type: 'agent',
    topics: [],
    settings: {
      contextCount: 10,
      temperature: 0.7,
      topP: 0.9,
      enableMaxTokens: false,
      maxTokens: undefined,
      streamOutput: true,
      hideMessages: false,
      customParameters: [
        {
          name: 'owlProvider',
          value: 'auto',
          type: 'string'
        },
        {
          name: 'availableToolkits',
          value: [
            'web_browser',
            'code_interpreter',
            'image_generation',
            'data_analysis',
            'web_search',
            'file_manager',
            'quality_evaluation',
            'autonomous_agent'
          ],
          type: 'json'
        },
        {
          name: 'autonomousModeEnabled',
          value: true,
          type: 'boolean'
        },
        {
          name: 'autoExecuteTasks',
          value: true,
          type: 'boolean'
        }
      ]
    },
    emoji: '🦉'
  }
}

/**
 * 获取OWL Agent支持的模型列表
 * 从系统配置的模型中过滤出支持OWL的模型
 */
export const getOwlSupportedModels = (models: Array<any>) => {
  // 过滤出支持OWL的模型，这里需要根据实际情况定义支持标准
  // 通常应该支持较强的推理和工具使用能力的模型
  return models.filter((model) => {
    // 如果模型有type字段并且包含reasoning类型，则认为是支持OWL的
    if (model.type && Array.isArray(model.type) && model.type.includes('reasoning')) {
      return true
    }

    // 针对特定提供商和模型进行过滤
    const supportedModels = [
      // OpenAI
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-32k',
      'gpt-4o',
      // Anthropic
      'claude-instant',
      'claude-2',
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku',
      // Google
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-ultra'
    ]

    // 检查模型名称是否在支持列表中，或者模型名称是否包含支持的关键字
    return supportedModels.includes(model.id) || supportedModels.some((supported) => model.id.includes(supported))
  })
}
