import {
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  DatabaseOutlined,
  ExpandOutlined,
  FileImageOutlined,
  GlobalOutlined,
  LoadingOutlined,
  MenuOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { useSettings } from '@renderer/hooks/useSettings'
import { OwlToolResult } from '@renderer/services/OwlService'
import { Button, Card, Dropdown, Radio, Space, Tooltip, Typography } from 'antd'
import { FC, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface SandboxBrowserProps {
  // 沙盒浏览器模式: iframe(内嵌)、window(新窗口)、tab(新标签页)、toolbar(工具栏)
  mode: 'iframe' | 'window' | 'tab' | 'toolbar'
  // 沙盒URL，默认使用一个示例页面
  url?: string
  // 当前活动的工具集
  activeToolkit?: string
  // 工具集切换回调
  onToolkitChange?: (toolkit: string) => void
  // 可用的工具集列表
  availableToolkits?: string[]
  // 工具调用结果
  toolResults?: OwlToolResult[]
}

const { Text, Title, Paragraph } = Typography

const SandboxBrowser: FC<SandboxBrowserProps> = ({
  mode = 'iframe',
  url = 'https://example.com',
  activeToolkit,
  onToolkitChange,
  availableToolkits,
  toolResults = []
}) => {
  // 使用类型断言确保类型系统知道mode可以是任何有效的模式
  const validMode = mode as 'iframe' | 'window' | 'tab' | 'toolbar'
  const { t } = useTranslation()
  const { owlToolkits = [] } = useSettings()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [externalWindow, setExternalWindow] = useState<Window | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(url)
  // 优先使用传入的可用工具集，如果未提供则使用全局设置中的工具集
  const toolkits = availableToolkits || owlToolkits || []
  const [currentToolkit, setCurrentToolkit] = useState(
    activeToolkit || (toolkits.length > 0 ? toolkits[0] : 'web_browser')
  )

  useEffect(() => {
    // 使用类型断言确保类型系统知道mode可以是toolbar
    const validMode = mode as 'iframe' | 'window' | 'tab' | 'toolbar'

    // 如果是window或tab模式，打开新窗口
    if (validMode === 'window' || validMode === 'tab') {
      const windowFeatures = validMode === 'window' ? 'width=800,height=600,resizable=yes' : ''
      const newWindow = window.open(currentUrl, 'owlSandbox', windowFeatures)
      setExternalWindow(newWindow)

      // 清理函数
      return () => {
        if (newWindow && !newWindow.closed) {
          newWindow.close()
        }
      }
    }
    // toolbar模式下不需要初始化浏览器
    if (validMode === 'toolbar') {
      return
    }
  }, [mode, currentUrl])

  // 工具集变更时的处理
  useEffect(() => {
    if (activeToolkit && activeToolkit !== currentToolkit) {
      setCurrentToolkit(activeToolkit)
      const newUrl = getToolkitDefaultUrl(activeToolkit)
      setCurrentUrl(newUrl)
    }
  }, [activeToolkit, currentToolkit])

  // 刷新iframe内容
  const handleRefresh = () => {
    if (validMode === 'iframe' && iframeRef.current) {
      iframeRef.current.src = currentUrl
    } else if (validMode === 'toolbar') {
      // toolbar模式下不需要刷新
      return
    } else if (externalWindow && !externalWindow.closed) {
      externalWindow.location.reload()
    }
  }

  // 获取工具集图标
  const getToolkitIcon = (toolkit: string) => {
    switch (toolkit) {
      case 'web_search':
        return <SearchOutlined />
      case 'web_browser':
        return <GlobalOutlined />
      case 'code_interpreter':
        return <CodeOutlined />
      case 'file_manager':
        return <DatabaseOutlined />
      case 'image_generation':
        return <FileImageOutlined />
      case 'data_analysis':
        return <BulbOutlined />
      default:
        return <GlobalOutlined />
    }
  }

  // 获取工具集名称
  const getToolkitName = (toolkit: string) => {
    const key = `owl.toolkit.${toolkit}`
    return t(key) || toolkit
  }

  // 获取工具集默认URL
  const getToolkitDefaultUrl = (toolkit: string) => {
    switch (toolkit) {
      case 'web_search':
        return 'https://www.baidu.com'
      case 'web_browser':
        return 'https://example.com'
      case 'code_interpreter':
        return 'about:blank'
      case 'file_manager':
        return 'about:blank'
      case 'image_generation':
        return 'about:blank'
      case 'data_analysis':
        return 'about:blank'
      default:
        return 'about:blank'
    }
  }

  // 切换工具集
  const handleToolkitChange = (toolkit: string) => {
    setCurrentToolkit(toolkit)
    const newUrl = getToolkitDefaultUrl(toolkit)
    setCurrentUrl(newUrl)

    if (mode === 'iframe' && iframeRef.current) {
      iframeRef.current.src = newUrl
    } else if (externalWindow && !externalWindow.closed) {
      externalWindow.location.href = newUrl
    }

    if (onToolkitChange) {
      onToolkitChange(toolkit)
    }
  }

  // 复制URL
  const handleCopyUrl = () => {
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        // 可以添加复制成功的提示
        console.log('URL copied to clipboard')
      })
      .catch((err) => {
        console.error('Failed to copy URL: ', err)
      })
  }

  // 全屏显示
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  // toolbar模式下只显示工具集切换器
  if (validMode === 'toolbar') {
    return (
      <ToolkitSwitcher>
        <Radio.Group value={currentToolkit} onChange={(e) => handleToolkitChange(e.target.value)}>
          {Array.isArray(toolkits) &&
            toolkits.map((toolkit) => (
              <Radio.Button key={toolkit} value={toolkit}>
                {getToolkitIcon(toolkit)}
                <span style={{ marginLeft: '4px' }}>{getToolkitName(toolkit)}</span>
              </Radio.Button>
            ))}
        </Radio.Group>
      </ToolkitSwitcher>
    )
  }

  // 如果是外部窗口模式，只显示控制按钮
  if (validMode === 'window' || validMode === 'tab') {
    return (
      <SandboxControls>
        <Space>
          <Tooltip title={t('owl.sandbox.refresh_external_window')}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              disabled={!externalWindow || externalWindow.closed}
            />
          </Tooltip>
          <Tooltip title={t('owl.sandbox.copy_url')}>
            <Button icon={<CopyOutlined />} onClick={handleCopyUrl} />
          </Tooltip>
        </Space>
        <ToolkitSelector>
          <Dropdown
            menu={{
              items: owlToolkits.map((toolkit) => ({
                key: toolkit,
                label: getToolkitName(toolkit),
                icon: getToolkitIcon(toolkit)
              })),
              onClick: ({ key }) => handleToolkitChange(key)
            }}
            trigger={['click']}>
            <ToolkitButton>
              {getToolkitIcon(currentToolkit)}
              <span style={{ marginLeft: '5px' }}>{getToolkitName(currentToolkit)}</span>
              <MenuOutlined style={{ marginLeft: '5px' }} />
            </ToolkitButton>
          </Dropdown>
        </ToolkitSelector>
        <div>{mode === 'window' ? t('owl.sandbox.open_in_new_window') : t('owl.sandbox.open_in_new_tab')}</div>
      </SandboxControls>
    )
  }

  // 渲染工具调用结果
  const renderToolResults = () => {
    if (!toolResults || toolResults.length === 0) {
      return null
    }

    return (
      <ToolResultsContainer>
        <ToolResultsHeader>
          <Title level={5}>{t('owl.tool_results')}</Title>
        </ToolResultsHeader>
        {toolResults.map((result, index) => (
          <ToolResultCard key={result.toolId || `tool-result-${index}-${result.toolName}-${Date.now()}`}>
            <ToolResultHeader>
              <ToolName>
                {getToolkitIcon(result.toolName || '')}
                <span style={{ marginLeft: '8px' }}>{result.toolName || ''}</span>
              </ToolName>
              <ToolStatus>
                {result.status === 'success' && <CheckCircleOutlined style={{ color: 'var(--color-success)' }} />}
                {result.status === 'error' && <CloseCircleOutlined style={{ color: 'var(--color-error)' }} />}
                {result.status === 'running' && <LoadingOutlined style={{ color: 'var(--color-processing)' }} />}
                <span style={{ marginLeft: '5px' }}>
                  {result.status === 'success' && t('owl.tool_status.success')}
                  {result.status === 'error' && t('owl.tool_status.error')}
                  {result.status === 'running' && t('owl.tool_status.running')}
                </span>
              </ToolStatus>
            </ToolResultHeader>
            <ToolResultContent>
              {result.toolName === 'web_search' && renderWebSearchResult(result.result)}
              {result.toolName === 'execute_code' && renderCodeResult(result.result)}
              {result.toolName === 'analyze_data' && renderDataAnalysisResult(result.result)}
              {(!result.toolName || !['web_search', 'execute_code', 'analyze_data'].includes(result.toolName)) && (
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                  {typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
                </pre>
              )}
            </ToolResultContent>
          </ToolResultCard>
        ))}
      </ToolResultsContainer>
    )
  }

  // 渲染网络搜索结果
  const renderWebSearchResult = (result: any) => {
    if (!result || !result.results) {
      return <Text type="secondary">{t('owl.no_search_results')}</Text>
    }

    return (
      <div>
        {result.results.map((item: any, index: number) => (
          <SearchResultItem key={`search-result-${index}-${item.url || ''}-${Date.now()}`}>
            <SearchResultTitle>{item.title || ''}</SearchResultTitle>
            <SearchResultUrl href={item.url || '#'} target="_blank" rel="noopener noreferrer">
              {item.url || ''}
            </SearchResultUrl>
            <SearchResultSnippet>{item.snippet || ''}</SearchResultSnippet>
          </SearchResultItem>
        ))}
      </div>
    )
  }

  // 渲染代码执行结果
  const renderCodeResult = (result: any) => {
    if (!result) {
      return <Text type="secondary">{t('owl.no_code_result')}</Text>
    }

    return (
      <div>
        <CodeExecutionResult>
          <Paragraph>
            <Text strong>{t('owl.execution_time')}:</Text> {result.executionTime}
          </Paragraph>
          <pre style={{ backgroundColor: 'var(--color-background-dark)', padding: '8px', borderRadius: '4px' }}>
            {result.output}
          </pre>
        </CodeExecutionResult>
      </div>
    )
  }

  // 渲染数据分析结果
  const renderDataAnalysisResult = (result: any) => {
    if (!result) {
      return <Text type="secondary">{t('owl.no_analysis_result')}</Text>
    }

    return (
      <div>
        <Title level={5}>{result.summary || ''}</Title>
        <Text strong>{t('owl.statistics')}:</Text>
        <StatisticsList>
          {result.statistics &&
            typeof result.statistics === 'object' &&
            Object.entries(result.statistics).map(([key, value]: [string, any], index: number) => (
              <StatisticsItem key={`stat-${key}-${index}`}>
                <StatisticsLabel>{key || ''}:</StatisticsLabel>
                <StatisticsValue>{value || ''}</StatisticsValue>
              </StatisticsItem>
            ))}
        </StatisticsList>
        {result.chart && <ChartPlaceholder>{t('owl.chart_placeholder')}</ChartPlaceholder>}
      </div>
    )
  }

  // 其他模式下显示完整沙盒浏览器内容
  return (
    <SandboxContainer $expanded={isExpanded}>
      <SandboxHeader>
        <ToolkitTabs>
          {(owlToolkits || []).map((toolkit, index) => (
            <ToolkitTab
              key={`toolkit-tab-${toolkit || ''}-${index}`}
              $active={currentToolkit === toolkit}
              onClick={() => handleToolkitChange(toolkit || '')}>
              {getToolkitIcon(toolkit || '')}
              <span style={{ marginLeft: '5px' }}>{getToolkitName(toolkit || '')}</span>
            </ToolkitTab>
          ))}
        </ToolkitTabs>
      </SandboxHeader>

      {/* 工具调用结果展示区域 */}
      {renderToolResults()}

      <SandboxControls>
        <Space>
          <Tooltip title={t('owl.sandbox.refresh')}>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
          </Tooltip>
          <Tooltip title={t('owl.sandbox.copy_url')}>
            <Button icon={<CopyOutlined />} onClick={handleCopyUrl} />
          </Tooltip>
          <Tooltip title={isExpanded ? t('owl.sandbox.collapse') : t('owl.sandbox.expand')}>
            <Button icon={<ExpandOutlined />} onClick={handleToggleExpand} />
          </Tooltip>
        </Space>
        <SandboxUrl>{currentUrl}</SandboxUrl>
      </SandboxControls>
      <SandboxFrame
        ref={iframeRef}
        src={currentUrl}
        sandbox="allow-scripts allow-forms allow-popups"
        title="OWL Sandbox"
      />
    </SandboxContainer>
  )
}

const SandboxContainer = styled.div<{ $expanded: boolean }>`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  height: ${(props) => (props.$expanded ? '600px' : '300px')};
  transition: height 0.3s ease;
  background-color: var(--color-background);
`

const SandboxHeader = styled.div`
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background-soft);
`

const ToolkitTabs = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 0 8px;
  &::-webkit-scrollbar {
    height: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--color-border);
  }
`

const ToolkitTab = styled.div<{ $active: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  white-space: nowrap;
  color: ${(props) => (props.$active ? 'var(--color-primary)' : 'var(--color-text-2)')};
  border-bottom: 2px solid ${(props) => (props.$active ? 'var(--color-primary)' : 'transparent')};
  background-color: ${(props) => (props.$active ? 'var(--color-primary-bg)' : 'transparent')};
  &:hover {
    color: var(--color-primary);
    background-color: var(--color-primary-bg);
  }
`

const ToolkitSelector = styled.div`
  margin: 0 8px;
`

const ToolkitButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-1);
  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`

const SandboxControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
`

const SandboxUrl = styled.div`
  flex: 1;
  margin: 0 8px;
  padding: 4px 8px;
  background-color: var(--color-background);
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
  font-size: 12px;
  max-width: 300px;
`

const SandboxFrame = styled.iframe`
  flex: 1;
  border: none;
  width: 100%;
  height: 100%;
  background-color: white;
`

const ToolResultsContainer = styled.div`
  padding: 12px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  max-height: 200px;
  overflow-y: auto;
`

const ToolResultsHeader = styled.div`
  margin-bottom: 8px;
`

const ToolResultCard = styled(Card)`
  margin-bottom: 10px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`

const ToolResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 8px;
`

const ToolName = styled.div`
  display: flex;
  align-items: center;
  font-weight: 500;
`

const ToolStatus = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
`

const ToolResultContent = styled.div`
  font-size: 13px;
`

const SearchResultItem = styled.div`
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-light);
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`

const SearchResultTitle = styled.h4`
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-primary);
`

const SearchResultUrl = styled.a`
  display: block;
  font-size: 12px;
  color: var(--color-success);
  margin-bottom: 4px;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
`

const SearchResultSnippet = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--color-text-2);
`

const CodeExecutionResult = styled.div`
  font-size: 13px;
`

const StatisticsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 8px 0;
`

const StatisticsItem = styled.li`
  display: flex;
  margin-bottom: 4px;
`

const StatisticsLabel = styled.span`
  font-weight: 500;
  min-width: 80px;
`

const StatisticsValue = styled.span`
  color: var(--color-text-1);
`

const ChartPlaceholder = styled.div`
  height: 100px;
  background-color: var(--color-background-soft);
  border: 1px dashed var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  border-radius: 4px;
  color: var(--color-text-2);
`

const ToolkitSwitcher = styled.div`
  padding: 8px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  display: flex;
  justify-content: center;

  &::-webkit-scrollbar {
    height: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--color-border);
  }
`

export default SandboxBrowser
