import {
  ApiOutlined,
  BulbOutlined,
  CheckOutlined,
  CodeOutlined,
  DatabaseOutlined,
  FileImageOutlined,
  GlobalOutlined,
  LeftOutlined,
  RightOutlined,
  RocketOutlined,
  SearchOutlined,
  SendOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { useSettings } from '@renderer/hooks/useSettings'
import owlService, { OwlMessage, OwlToolkit, QualityEvaluationResult } from '@renderer/services/OwlService'
import { safeGet } from '@renderer/utils/safeObjectUtils'
import { Button, Divider, Input, notification, Radio, Spin, Tag, Tooltip, Typography } from 'antd'
import { FC, ReactNode, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import QualityEvaluationDisplay from './QualityEvaluationDisplay'
import SandboxBrowser from './SandboxBrowser'

// 工具箱图标映射
const toolkitIcons: Record<string, ReactNode> = {
  web_browser: <GlobalOutlined />,
  code_interpreter: <CodeOutlined />,
  image_generation: <FileImageOutlined />,
  data_analysis: <DatabaseOutlined />,
  web_search: <SearchOutlined />,
  file_manager: <BulbOutlined />,
  quality_evaluation: <CheckOutlined />,
  autonomous_agent: <ThunderboltOutlined />
}

// 工具箱名称映射，通过翻译获取
import { TFunction } from 'i18next'
const getToolkitName = (toolkit: string, t: TFunction): string => {
  const key = `owl.toolkit.${toolkit}`
  return t(key) || toolkit
}

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface OwlAgentProps {
  visible: boolean
}

const OwlAgent: FC<OwlAgentProps> = ({ visible }): ReactNode => {
  const { t } = useTranslation()
  const {
    advancedFeatures,
    enableOWL,
    owlLanguageModelApiKey,
    owlExternalResourcesApiKey,
    owlSandboxBrowserMode,
    owlModelProvider,
    owlToolkits,
    owlLogLevel
  } = useSettings()

  const [userInput, setUserInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversations, setConversations] = useState<OwlMessage[]>([])
  const [sessionId, setSessionId] = useState<string>('')
  const [showSandbox, setShowSandbox] = useState(false)
  const [userToggleSandbox, setUserToggleSandbox] = useState(true)
  const [isAutonomousMode, setIsAutonomousMode] = useState(false)
  // autonomousGoal用于存储当前自主任务的目标, 后续可用于显示或重复使用
  const [autonomousGoal, setAutonomousGoal] = useState('')
  const [activeToolkit, setActiveToolkit] = useState<OwlToolkit>(
    owlToolkits && owlToolkits.length > 0 ? (owlToolkits[0] as OwlToolkit) : 'web_browser'
  )

  // 质量评估相关状态
  const [activeTab, setActiveTab] = useState<string>('chat')
  const [evaluationContent, setEvaluationContent] = useState('')
  const [evaluationType, setEvaluationType] = useState<'content' | 'code' | 'design'>('content')
  const [evaluationResult, setEvaluationResult] = useState<QualityEvaluationResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  // 获取模型提供商显示名称
  const getModelProviderDisplay = (): string => {
    const providers: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google AI',
      local: t('owl.local_model')
    }
    return providers[owlModelProvider || 'openai'] || owlModelProvider || t('owl.unknown')
  }

  // 获取工具集图标
  const getToolkitIcon = (toolkit: string): ReactNode => {
    return toolkitIcons[toolkit] || <ApiOutlined />
  }

  // 获取工具集名称
  const getToolkitNameForDisplay = (toolkit: string): string => {
    return getToolkitName(toolkit, t)
  }

  // 记录日志
  const logMessage = useCallback(
    (level: string, message: string) => {
      const logLevels = ['debug', 'info', 'warning', 'error']
      const configuredLevel = owlLogLevel || 'info'

      // 只有当配置的日志级别低于或等于当前消息的级别时才记录
      if (logLevels.indexOf(level) >= logLevels.indexOf(configuredLevel)) {
        console.log(`[OWL][${level.toUpperCase()}] ${message}`)
      }
    },
    [owlLogLevel]
  )

  // 处理工具集切换
  const handleToolkitChange = (toolkit: string) => {
    const toolkitId = toolkit as OwlToolkit
    setActiveToolkit(toolkitId)

    // 在OWL服务中切换工具集
    if (sessionId) {
      owlService.setActiveToolkit(sessionId, toolkitId)
      logMessage('info', t('owl.log.toolkit_change', { name: getToolkitNameForDisplay(toolkit) }))
    }
  }

  // 配置是否完整 - 只需要语言模型API密钥
  const isConfigComplete = owlLanguageModelApiKey && owlLanguageModelApiKey !== 'your-api-key-here'

  // 初始化OWL服务会话
  useEffect(() => {
    if (visible && advancedFeatures && enableOWL && isConfigComplete) {
      // 更新配置
      owlService.updateOptions({
        languageModelApiKey: owlLanguageModelApiKey || '',
        externalResourcesApiKey: owlExternalResourcesApiKey || '',
        modelProvider: owlModelProvider || 'openai',
        logLevel: owlLogLevel || 'info'
      })

      // 创建新会话
      const enabledToolkits = owlToolkits?.map((toolkit) => toolkit as OwlToolkit) || ['web_browser']
      // 使用Promise处理异步结果
      owlService
        .createSession(enabledToolkits)
        .then((newSessionId) => {
          setSessionId(newSessionId)

          // 添加默认欢迎消息
          const initialMessages: OwlMessage[] = []

          // 如果API密钥是默认值，添加一个提示消息
          if (owlLanguageModelApiKey === 'your-api-key-here') {
            initialMessages.push({
              role: 'agent',
              content: '您需要先配置API密钥才能使用OWL功能。请点击右上角的设置图标，在OWL设置中填写您的API密钥。',
              toolResults: []
            })
          } else {
            initialMessages.push({
              role: 'agent',
              content: t('owl.welcome_message'),
              toolResults: []
            })
          }

          setConversations(initialMessages)

          logMessage('info', t('owl.log.session_created', { id: newSessionId }))
        })
        .catch((error) => {
          console.error('创建会话失败:', error)
          // 创建临时ID作为后备方案
          const tempId = `temp-${Date.now()}`
          setSessionId(tempId)

          // 创建错误消息
          const errorMessages: OwlMessage[] = [
            {
              role: 'agent',
              content: t('owl.error.session_creation_failed'),
              toolResults: []
            }
          ]

          setConversations(errorMessages)
          logMessage('error', t('owl.log.session_creation_failed'))
        })

      // 初始化消息已在Promise链中处理
    }
  }, [
    visible,
    advancedFeatures,
    enableOWL,
    isConfigComplete,
    owlLanguageModelApiKey,
    owlExternalResourcesApiKey,
    owlModelProvider,
    owlLogLevel,
    owlToolkits,
    logMessage,
    t
  ])

  // 如果不满足显示条件，不渲染组件
  // 创建用于日志输出的安全对象，对API密钥进行脱敏处理
  // 只在开发环境下记录组件渲染条件
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_OWL === 'true') {
    const safeLogObject = {
      visible,
      advancedFeatures,
      enableOWL,
      owlLanguageModelApiKey: owlLanguageModelApiKey ? '******[已脱敏]******' : undefined
    }
    console.log('OwlAgent - 组件渲染条件检查:', safeLogObject)
  }
  if (!visible) {
    // 只在开发环境下记录详细信息
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_OWL === 'true') {
      console.log('OwlAgent - 组件被设置为不可见')
    }
    return null
  }
  if (!advancedFeatures) {
    // 只在开发环境下记录详细信息
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_OWL === 'true') {
      console.log('OwlAgent - 高级功能未启用')
    }
    return null
  }
  if (!enableOWL) {
    // 只在开发环境下记录详细信息
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_OWL === 'true') {
      console.log('OwlAgent - OWL功能未启用')
    }
    return null
  }
  // 不再以是否有API密钥来决定是否显示组件
  // 即使用户没有设置API密钥，也应该显示界面，并提示用户配置
  // 之前检查API密钥是否有效的逻辑移到OwlService中处理
  if (owlLanguageModelApiKey === 'your-api-key-here') {
    console.log('OwlAgent - 使用的是默认API密钥，需要用户配置自己的密钥')
  }

  // 清除当前会话
  const handleClearSession = () => {
    if (sessionId) {
      // 如果在自主模式中，先停止自主任务
      if (isAutonomousMode) {
        owlService.stopAutonomousTask(sessionId)
        setIsAutonomousMode(false)
        setAutonomousGoal('')
      }

      owlService.clearSession(sessionId)

      // 创建新会话
      const enabledToolkits = owlToolkits?.map((toolkit) => toolkit as OwlToolkit) || ['web_browser']
      // 使用async/await等待Promise完成后再设置State
      owlService
        .createSession(enabledToolkits)
        .then((newSessionId) => {
          setSessionId(newSessionId)
          setConversations([])
          setShowSandbox(false)
        })
        .catch((error) => {
          console.error('创建会话失败:', error)
          // 处理错误，生成一个临时ID
          setSessionId(`temp-${Date.now()}`)
          setConversations([])
          setShowSandbox(false)
        })

      logMessage('info', t('owl.log.session_cleared'))
    }
  }

  // 发送消息到OWL Agent
  const handleSendMessage = async (autonomousMode = false) => {
    if (!userInput.trim() || isProcessing || !sessionId) return

    // 记录日志
    logMessage('info', t('owl.log.user_message', { message: userInput }))

    // 开始处理
    setIsProcessing(true)

    try {
      // 添加用户消息到当前对话中
      const userMessageForDisplay: OwlMessage = {
        role: 'user',
        content: userInput,
        autonomous: autonomousMode
      }
      setConversations([...conversations, userMessageForDisplay])

      // 发送到OWL服务并等待响应
      const agentResponse = await owlService.addMessage(sessionId, userInput, autonomousMode)

      // 如果是自主模式，启动自主任务
      if (autonomousMode) {
        await owlService.startAutonomousTask(sessionId, userInput.trim())
      }

      if (agentResponse) {
        // 添加代理响应到对话
        setConversations((prev) => [...prev, agentResponse])

        // 使用safeGet安全访问工具结果，显示沙盒浏览器
        const toolResults = safeGet(agentResponse, 'toolResults') || []
        if (toolResults && toolResults.length > 0) {
          setShowSandbox(true)
        }
      } else {
        // 处理错误情况
        const errorMessage: OwlMessage = {
          role: 'agent',
          content: t('owl.error_processing'),
          toolResults: []
        }
        setConversations((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      logMessage('error', `处理消息时出错: ${error}`)

      // 添加错误消息到对话
      const errorMessage: OwlMessage = {
        role: 'agent',
        content: t('owl.error_occurred'),
        toolResults: []
      }
      setConversations((prev) => [...prev, errorMessage])
    } finally {
      setUserInput('')
      setIsProcessing(false)
    }
  }

  // 启动自主任务处理函数
  const handleStartAutonomousTask = async () => {
    if (!userInput.trim() || isProcessing || !sessionId) return

    try {
      // 设置自主模式状态
      setIsAutonomousMode(true)
      setAutonomousGoal(userInput.trim())

      // 发送消息开始自主任务
      await handleSendMessage(true)
    } catch (error) {
      const errorMessage = String(error) || '未知错误'
      logMessage('error', `启动自主任务出错: ${errorMessage}`)
      notification.error({
        message: t('owl.error_title'),
        description: t('owl.error_start_autonomous')
      })
    }
  }

  // 停止自主任务处理函数
  const handleStopAutonomousTask = async () => {
    if (!sessionId) return

    try {
      await owlService.stopAutonomousTask(sessionId)
      setIsAutonomousMode(false)
      setAutonomousGoal('')
      logMessage('info', '已停止自主任务')
    } catch (error) {
      const errorMessage = String(error) || '未知错误'
      logMessage('error', `停止自主任务时出错: ${errorMessage}`)
      notification.error({
        message: t('owl.error_title'),
        description: t('owl.error_stop_autonomous')
      })
    }
  }

  // 渲染对话消息
  const renderConversations = () => {
    if (!conversations || conversations.length === 0) {
      return (
        <EmptyContainer>
          <ApiOutlined style={{ fontSize: '48px', opacity: 0.5 }} />
          <Text style={{ marginTop: '16px', opacity: 0.7 }}>{t('owl.empty_conversation')}</Text>
        </EmptyContainer>
      )
    }

    return conversations.map((message, index) => (
      <MessageBubble
        key={`message-${message.role}-${index}-${Date.now()}`}
        role={message.role}
        $autonomous={Boolean(message.autonomous)}>
        <MessageHeader>
          {message.role === 'user' ? t('owl.you') : t('owl.agent_name')}
          {safeGet(message, 'autonomous') && (
            <Tag color="blue" style={{ marginLeft: '8px' }}>
              <ThunderboltOutlined /> {t('owl.autonomous_mode')}
            </Tag>
          )}
        </MessageHeader>
        <MessageContent>{message.content || ''}</MessageContent>
      </MessageBubble>
    ))
  }

  // 处理质量评估
  const handleQualityEvaluation = async () => {
    if (!evaluationContent.trim() || isEvaluating) return

    setIsEvaluating(true)
    try {
      // 调用OWL服务评估质量
      const result = await owlService.evaluateQuality(evaluationContent, evaluationType)
      setEvaluationResult(result)
      logMessage('info', t('owl.log.quality_evaluation_completed'))
    } catch (error) {
      logMessage('error', `质量评估出错: ${error}`)
    } finally {
      setIsEvaluating(false)
    }
  }

  // 清除评估结果
  const clearEvaluation = () => {
    setEvaluationContent('')
    setEvaluationResult(null)
  }

  return (
    <Container>
      <Header>
        <HeaderTop>
          <Title level={4}>
            <ApiOutlined style={{ marginRight: '8px' }} />
            {t('owl.agent_title')}
          </Title>
          <Button onClick={handleClearSession} size="small" type="text">
            {t('owl.clear_session') || '清除会话'}
          </Button>
        </HeaderTop>
        <Paragraph type="secondary">{t('owl.agent_description')}</Paragraph>

        <AgentInfo>
          <ModelInfo>
            <ModelLabel>{t('owl.model_provider')}:</ModelLabel>
            <Tag color="blue">{getModelProviderDisplay()}</Tag>
          </ModelInfo>

          <Divider type="vertical" />

          <ToolkitsInfo>
            <ToolkitsLabel>{t('owl.available_toolkits')}:</ToolkitsLabel>
            <ToolkitTags>
              {owlToolkits &&
                owlToolkits.map((toolkit) => (
                  <Tooltip key={toolkit} title={getToolkitNameForDisplay(toolkit)}>
                    <Tag
                      icon={getToolkitIcon(toolkit)}
                      color={
                        activeTab === (toolkit === 'quality_evaluation' ? 'evaluation' : 'chat') ? 'blue' : 'default'
                      }
                      onClick={() => {
                        if (toolkit === 'quality_evaluation') {
                          setActiveTab('evaluation')
                        } else if (activeTab === 'evaluation') {
                          setActiveTab('chat')
                        }
                        handleToolkitChange(toolkit)
                      }}
                      style={{ cursor: 'pointer' }}>
                      {getToolkitNameForDisplay(toolkit)}
                    </Tag>
                  </Tooltip>
                ))}
            </ToolkitTags>
          </ToolkitsInfo>
        </AgentInfo>
      </Header>

      {!isConfigComplete && (
        <ConfigWarning>
          <Text type="warning">{t('owl.config_incomplete')}</Text>
        </ConfigWarning>
      )}

      <MainContentContainer>
        <LeftSection $fullWidth={!showSandbox}>
          {activeTab === 'chat' ? (
            <>
              {/* 工具栏部分 - 蓝色框 */}
              {conversations?.length > 0 && conversations[conversations.length - 1]?.toolResults?.length > 0 && (
                <ToolbarContainer>
                  <SandboxBrowser
                    mode="toolbar"
                    activeToolkit={activeToolkit}
                    onToolkitChange={handleToolkitChange}
                    availableToolkits={owlToolkits || []}
                    toolResults={[]}
                  />
                </ToolbarContainer>
              )}
              {/* 对话历史区域 - 可滚动 */}
              <MessagesScrollArea>
                {isAutonomousMode && autonomousGoal && (
                  <div
                    style={{
                      padding: '8px 16px',
                      background: 'var(--color-primary-soft)',
                      borderRadius: '8px',
                      margin: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                    <div>
                      <ThunderboltOutlined style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                      <Text strong>{t('owl.autonomous_mode')}: </Text>
                      <Text>{autonomousGoal}</Text>
                    </div>
                    <Button danger size="small" icon={<ApiOutlined />} onClick={handleStopAutonomousTask}>
                      {t('owl.stop')}
                    </Button>
                  </div>
                )}
                <ConversationContainer>
                  {renderConversations()}
                  {isProcessing && (
                    <LoadingContainer>
                      <Spin size="small" />
                      <Text style={{ marginLeft: '8px' }}>{t('owl.processing')}</Text>
                    </LoadingContainer>
                  )}
                  {conversations.length > 0 && !isProcessing && (
                    <div style={{ textAlign: 'center', padding: '8px', opacity: 0.7 }}>
                      <Text type="secondary">{t('owl.scroll_for_more')}</Text>
                    </div>
                  )}
                </ConversationContainer>
              </MessagesScrollArea>
              {/* 输入框区域 - 固定在底部 */}
              <InputContainer>
                <TextArea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={isAutonomousMode ? t('owl.enter_new_task') : t('owl.input_placeholder')}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  disabled={isProcessing || !isConfigComplete}
                />
                <ButtonGroup>
                  {isAutonomousMode ? (
                    <Button
                      danger
                      icon={<ApiOutlined />}
                      onClick={handleStopAutonomousTask}
                      disabled={!isConfigComplete || !isAutonomousMode}>
                      {t('owl.stop')}
                    </Button>
                  ) : (
                    <Button
                      type="default"
                      icon={<ThunderboltOutlined />}
                      onClick={handleStartAutonomousTask}
                      disabled={isProcessing || !isConfigComplete || !userInput.trim()}>
                      {t('owl.autonomous')}
                    </Button>
                  )}
                  <SendButton
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleSendMessage(false)}
                    disabled={!userInput.trim() || isProcessing || !isConfigComplete}>
                    {t('owl.send')}
                  </SendButton>
                </ButtonGroup>
              </InputContainer>
            </>
          ) : (
            <EvaluationContainer>
              {evaluationResult ? (
                <>
                  <QualityEvaluationDisplay evaluationResult={evaluationResult} type={evaluationType} />
                  <Button
                    type="primary"
                    icon={<RocketOutlined />}
                    onClick={clearEvaluation}
                    style={{ marginTop: '16px' }}>
                    {t('owl.quality.new_evaluation')}
                  </Button>
                </>
              ) : (
                <>
                  <EvaluationHeader>
                    <Title level={4}>{t('owl.quality.title')}</Title>
                    <Paragraph type="secondary">{t('owl.quality.description')}</Paragraph>
                  </EvaluationHeader>

                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>{t('owl.quality.content_type')}:</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Radio.Group
                        value={evaluationType}
                        onChange={(e) => setEvaluationType(e.target.value)}
                        buttonStyle="solid">
                        <Radio.Button value="content">{t('owl.quality.content')}</Radio.Button>
                        <Radio.Button value="code">{t('owl.quality.code')}</Radio.Button>
                        <Radio.Button value="design">{t('owl.quality.design')}</Radio.Button>
                      </Radio.Group>
                    </div>
                  </div>

                  <TextArea
                    value={evaluationContent}
                    onChange={(e) => setEvaluationContent(e.target.value)}
                    placeholder={t(`owl.quality.${evaluationType}_placeholder`)}
                    autoSize={{ minRows: 6, maxRows: 12 }}
                    style={{ marginBottom: '16px' }}
                  />

                  <Button
                    type="primary"
                    onClick={handleQualityEvaluation}
                    loading={isEvaluating}
                    disabled={!evaluationContent.trim()}
                    icon={<CheckOutlined />}>
                    {t('owl.quality.evaluate')}
                  </Button>
                </>
              )}
            </EvaluationContainer>
          )}
        </LeftSection>

        {/* 沙盒控制按钮 */}
        {conversations?.length > 0 && conversations[conversations.length - 1]?.toolResults?.length > 0 && (
          <SandboxToggleButton onClick={() => setUserToggleSandbox(!userToggleSandbox)}>
            {showSandbox ? <LeftOutlined /> : <RightOutlined />}
          </SandboxToggleButton>
        )}

        {showSandbox && (
          <ResizableSandboxContainer>
            <SandboxBrowser
              mode={owlSandboxBrowserMode || 'iframe'}
              activeToolkit={activeToolkit}
              onToolkitChange={handleToolkitChange}
              availableToolkits={owlToolkits || []}
              toolResults={
                conversations && conversations.length > 0 && conversations[conversations.length - 1]?.toolResults
                  ? conversations[conversations.length - 1].toolResults
                  : []
              }
            />
          </ResizableSandboxContainer>
        )}
      </MainContentContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0;
  background-color: var(--color-background);
  border-radius: 0;
  overflow: hidden;
  color: var(--color-text);
  font-family: var(--font-family);
`

const SandboxToggleButton = styled.button`
  position: absolute;
  top: 50%;
  right: ${(props) => (props.children?.[0]?.type === LeftOutlined ? 'auto' : '0')};
  left: ${(props) => (props.children?.[0]?.type === LeftOutlined ? '55%' : 'auto')};
  transform: translateY(-50%);
  width: 24px;
  height: 80px;
  background-color: var(--color-primary-bg);
  border: 1px solid var(--color-border);
  border-radius: ${(props) => (props.children?.[0]?.type === LeftOutlined ? '4px 0 0 4px' : '0 4px 4px 0')};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--color-primary);
    color: white;
  }
`

const MainContentContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow: hidden;
  position: relative;
`

const LeftSection = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 320px;
  overflow: hidden;
  width: ${(props) => (props.$fullWidth ? '100%' : '55%')};
  height: 100%;
`

const MessagesScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`

const ToolbarContainer = styled.div`
  background-color: #f0f8ff; /* 浅蓝色背景 */
  border-bottom: 1px solid var(--color-border);
  padding: 10px;
  min-height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`

const Header = styled.div`
  margin-bottom: 0;
  padding: 16px 20px;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`

const AgentInfo = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 10px 14px;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`

const ModelInfo = styled.div`
  display: flex;
  align-items: center;
  margin-right: 8px;
`

const ModelLabel = styled.span`
  margin-right: 6px;
  font-size: 13px;
  color: var(--color-text-2);
`

const ToolkitsInfo = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`

const ToolkitsLabel = styled.span`
  margin-right: 6px;
  font-size: 13px;
  color: var(--color-text-2);
`

const ToolkitTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`

const ConfigWarning = styled.div`
  margin-bottom: 16px;
  padding: 16px;
  background-color: var(--color-warning-bg, #fffbe6);
  border-radius: 8px;
  border: 1px solid var(--color-warning-border, #ffe58f);
  color: var(--color-warning, #faad14);
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;

  .anticon {
    font-size: 18px;
  }
`

const ConversationContainer = styled.div`
  width: 100%;
  padding: 24px 30px;
  background-color: var(--color-background-soft);
  display: flex;
  flex-direction: column;
`

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  opacity: 0.8;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  gap: 16px;
`

const MessageBubble = styled.div<{ role: 'user' | 'agent' | 'system'; $autonomous?: boolean }>`
  margin-bottom: 20px;
  padding: 16px 18px;
  border-radius: 12px;
  max-width: 80%;
  align-self: ${(props) => (props.role === 'user' ? 'flex-end' : 'flex-start')};
  background-color: ${(props) => (props.role === 'user' ? 'var(--color-primary-bg)' : 'var(--color-background)')};
  border: 1px solid ${(props) => (props.role === 'user' ? 'var(--color-primary-border)' : 'var(--color-border)')};
  margin-left: ${(props) => (props.role === 'user' ? 'auto' : '0')};
  margin-right: ${(props) => (props.role === 'user' ? '0' : '0')};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  color: var(--color-text);
  word-break: break-word;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
`

const MessageHeader = styled.div`
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--color-text-1);
`

const MessageContent = styled.div`
  white-space: pre-wrap;
  color: var(--color-text-1);
`

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`

const ResizableSandboxContainer = styled.div`
  width: 45%;
  min-width: 320px;
  max-width: 80%;
  resize: horizontal;
  overflow: hidden;
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
`

const InputContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 16px 20px;
  background-color: var(--color-background);
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
  width: 100%;
  min-height: 80px;
  z-index: 5;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`

const SendButton = styled(Button)`
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`

const EvaluationContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 0;
  padding: 16px 20px;
  background-color: var(--color-background-soft);
  display: flex;
  flex-direction: column;
`

const EvaluationHeader = styled.div`
  margin-bottom: 24px;
`

export default OwlAgent
