import { CheckOutlined, ExpandOutlined, LoadingOutlined } from '@ant-design/icons'
import { useSettings } from '@renderer/hooks/useSettings'
import { MCPToolResponse, Message } from '@renderer/types'
import { Collapse, message as antdMessage, Modal, Tooltip } from 'antd'
import { motion, AnimatePresence } from 'framer-motion'
import { isEmpty } from 'lodash'
import { FC, useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  message: Message
}

const MessageTools: FC<Props> = ({ message }) => {
  const [activeKeys, setActiveKeys] = useState<string[]>([])
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({})
  const [expandedResponse, setExpandedResponse] = useState<{ content: string; title: string } | null>(null)
  const [animationComplete, setAnimationComplete] = useState(false)
  const { t } = useTranslation()
  const { messageFont, fontSize } = useSettings()
  const fontFamily = useMemo(() => {
    return messageFont === 'serif'
      ? 'serif'
      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans","Helvetica Neue", sans-serif'
  }, [messageFont])

  const toolResponses = message.metadata?.mcpTools || []

  useEffect(() => {
    // Set animation to complete after tools are loaded
    if (!isEmpty(toolResponses) && !animationComplete) {
      const timer = setTimeout(() => {
        setAnimationComplete(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [toolResponses, animationComplete])

  if (isEmpty(toolResponses)) {
    return null
  }

  const copyContent = (content: string, toolId: string) => {
    navigator.clipboard.writeText(content)
    antdMessage.success({ 
      content: t('message.copied'), 
      key: 'copy-message',
      icon: <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <CheckOutlined />
      </motion.span>
    })
    setCopiedMap((prev) => ({ ...prev, [toolId]: true }))
    setTimeout(() => setCopiedMap((prev) => ({ ...prev, [toolId]: false })), 2000)
  }

  const handleCollapseChange = (keys: string | string[]) => {
    setActiveKeys(Array.isArray(keys) ? keys : [keys])
  }

  // Format tool responses for collapse items
  const getCollapseItems = () => {
    const items: { key: string; label: JSX.Element; children: React.ReactNode }[] = []
    // Add tool responses
    toolResponses.forEach((toolResponse: MCPToolResponse) => {
      const { id, tool, status, response } = toolResponse
      const isInvoking = status === 'invoking'
      const isDone = status === 'done'
      const result = {
        params: tool.inputSchema,
        response: toolResponse.response
      }

      items.push({
        key: id,
        label: (
          <MessageTitleLabel>
            <TitleContent>
              <ToolName>{tool.name}</ToolName>
              <StatusIndicator $isInvoking={isInvoking}>
                {isInvoking ? t('tools.invoking') : t('tools.completed')}
                {isInvoking && (
                  <motion.span
                    initial={{ opacity: 0.6, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.2 }}>
                    <LoadingOutlined spin style={{ marginLeft: 6 }} />
                  </motion.span>
                )}
                {isDone && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 10 }}>
                    <CheckOutlined style={{ marginLeft: 6 }} />
                  </motion.span>
                )}
              </StatusIndicator>
            </TitleContent>
            <ActionButtonsContainer>
              {isDone && response && (
                <>
                  <Tooltip title={t('common.expand')} mouseEnterDelay={0.5}>
                    <ActionButton
                      as={motion.button}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="message-action-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedResponse({
                          content: JSON.stringify(response, null, 2),
                          title: tool.name
                        })
                      }}
                      aria-label={t('common.expand')}>
                      <ExpandOutlined />
                    </ActionButton>
                  </Tooltip>
                  <Tooltip title={t('common.copy')} mouseEnterDelay={0.5}>
                    <ActionButton
                      as={motion.button}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="message-action-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyContent(JSON.stringify(result, null, 2), id)
                      }}
                      aria-label={t('common.copy')}>
                      <AnimatePresence mode="wait">
                        {!copiedMap[id] ? (
                          <motion.i 
                            key="copy-icon" 
                            className="iconfont icon-copy"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        ) : (
                          <motion.span 
                            key="copied-icon" 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', damping: 10 }}
                          >
                            <CheckOutlined style={{ color: 'var(--color-primary)' }} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </ActionButton>
                  </Tooltip>
                </>
              )}
            </ActionButtonsContainer>
          </MessageTitleLabel>
        ),
        children: isDone && result && (
          <ToolResponseContainer 
            as={motion.div}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontFamily, fontSize }}
          >
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </ToolResponseContainer>
        )
      })
    })

    return items
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <CollapseContainer
          activeKey={activeKeys}
          size="small"
          onChange={handleCollapseChange}
          className="message-tools-container"
          items={getCollapseItems()}
          expandIcon={({ isActive }) => (
            <motion.div
              animate={{ rotate: isActive ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <CollapsibleIcon className={`iconfont icon-chevron-right`} />
            </motion.div>
          )}
        />
      </motion.div>

      <AnimatePresence>
        {!!expandedResponse && (
          <Modal
            title={expandedResponse?.title}
            open={!!expandedResponse}
            onCancel={() => setExpandedResponse(null)}
            footer={null}
            width="80%"
            bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <ExpandedResponseContainer style={{ fontFamily, fontSize }}>
                <ActionButton
                  as={motion.button}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="copy-expanded-button"
                  onClick={() => {
                    if (expandedResponse) {
                      navigator.clipboard.writeText(expandedResponse.content)
                      antdMessage.success({ 
                        content: t('message.copied'), 
                        key: 'copy-expanded',
                        icon: <motion.span
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CheckOutlined />
                        </motion.span>
                      })
                    }
                  }}
                  aria-label={t('common.copy')}>
                  <i className="iconfont icon-copy"></i>
                </ActionButton>
                <pre>{expandedResponse.content}</pre>
              </ExpandedResponseContainer>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  )
}

const CollapseContainer = styled(Collapse)`
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }

  .ant-collapse-header {
    background-color: var(--color-bg-2);
    transition: background-color 0.3s ease, transform 0.2s ease;

    &:hover {
      background-color: var(--color-bg-3);
      transform: translateX(2px);
    }
  }

  .ant-collapse-content {
    transition: all 0.3s ease;
  }

  .ant-collapse-content-box {
    padding: 0 !important;
  }
`

const MessageTitleLabel = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 26px;
  gap: 10px;
  padding: 0;
`

const TitleContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`

const ToolName = styled.span`
  color: var(--color-text);
  font-weight: 500;
  font-size: 13px;
`

const StatusIndicator = styled.span<{ $isInvoking: boolean }>`
  color: ${(props) => (props.$isInvoking ? 'var(--color-primary)' : 'var(--color-success, #52c41a)')};
  font-size: 11px;
  display: flex;
  align-items: center;
  opacity: 0.85;
  border-left: 1px solid var(--color-border);
  padding-left: 8px;
`

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`

const ActionButton = styled.button`
  background: none;
  border: none;
  color: var(--color-text-2);
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: all 0.2s ease-in-out;
  border-radius: 4px;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
    transition: transform 0.5s ease, opacity 0.5s ease;
    pointer-events: none;
  }

  &:active::after {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
    transition: 0s;
  }

  &:hover {
    opacity: 1;
    color: var(--color-text);
    background-color: var(--color-bg-1);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    opacity: 1;
  }

  .iconfont {
    font-size: 14px;
  }
`

const CollapsibleIcon = styled.i`
  color: var(--color-text-2);
  font-size: 12px;
  transition: transform 0.2s;
`

const ToolResponseContainer = styled.div`
  background: var(--color-bg-1);
  border-radius: 0 0 4px 4px;
  padding: 12px 16px;
  overflow: auto;
  max-height: 300px;
  border-top: 1px solid var(--color-border);
  position: relative;
  transform-origin: top;
  will-change: transform, opacity, height;

  &:hover {
    background-color: var(--color-bg-2);
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--color-text);
    transition: color 0.3s ease;
  }
`

const ExpandedResponseContainer = styled.div`
  background: var(--color-bg-1);
  border-radius: 8px;
  padding: 16px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease, transform 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  .copy-expanded-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: var(--color-bg-2);
    border-radius: 4px;
    z-index: 1;
    transition: background-color 0.3s ease, transform 0.2s ease;

    &:hover {
      background-color: var(--color-bg-3);
    }
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--color-text);
    transition: color 0.3s ease;
  }
`

export default MessageTools
