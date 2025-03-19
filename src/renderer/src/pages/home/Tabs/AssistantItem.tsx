import { DeleteOutlined, EditOutlined, MinusCircleOutlined, SaveOutlined } from '@ant-design/icons'
import ModelAvatar from '@renderer/components/Avatar/ModelAvatar'
import CopyIcon from '@renderer/components/Icons/CopyIcon'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { modelGenerating } from '@renderer/hooks/useRuntime'
import { useSettings } from '@renderer/hooks/useSettings'
import AssistantSettingsPopup from '@renderer/pages/settings/AssistantSettings'
import { getDefaultModel, getDefaultTopic } from '@renderer/services/AssistantService'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { Assistant } from '@renderer/types'
import { uuid } from '@renderer/utils'
import { Dropdown } from 'antd'
import { ItemType } from 'antd/es/menu/interface'
import { motion } from 'framer-motion'
import { omit } from 'lodash'
import { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import styled from 'styled-components'

interface AssistantItemProps {
  assistant: Assistant
  isActive: boolean
  onSwitch: (assistant: Assistant) => void
  onDelete: (assistant: Assistant) => void
  onCreateDefaultAssistant: () => void
  addAgent: (agent: any) => void
  addAssistant: (assistant: Assistant) => void
}

// 动画变体
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } },
  hover: {
    scale: 1.03,
    y: -3,
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  tap: {
    scale: 0.97,
    y: 0,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.06)',
    transition: { duration: 0.15, ease: [0.19, 1, 0.22, 1] }
  }
}

const textVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.3, ease: 'easeOut' } }
}

const countVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } },
  hover: {
    scale: 1.2,
    y: -2,
    boxShadow: '0 4px 12px rgba(var(--color-primary-rgb), 0.2)',
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  tap: { scale: 0.9, transition: { duration: 0.15 } }
}

const AssistantItem: FC<AssistantItemProps> = ({ assistant, isActive, onSwitch, onDelete, addAgent, addAssistant }) => {
  const { t } = useTranslation()
  const { removeAllTopics } = useAssistant(assistant.id) // 使用当前助手的ID
  const { clickAssistantToShowTopic, topicPosition, showAssistantIcon } = useSettings()
  const defaultModel = getDefaultModel()

  const getMenuItems = useCallback(
    (assistant: Assistant): ItemType[] => [
      {
        label: t('assistants.edit.title'),
        key: 'edit',
        icon: <EditOutlined />,
        onClick: () => AssistantSettingsPopup.show({ assistant })
      },
      {
        label: t('assistants.copy.title'),
        key: 'duplicate',
        icon: <CopyIcon />,
        onClick: async () => {
          const _assistant: Assistant = { ...assistant, id: uuid(), topics: [getDefaultTopic(assistant.id)] }
          addAssistant(_assistant)
          onSwitch(_assistant)
        }
      },
      {
        label: t('assistants.clear.title'),
        key: 'clear',
        icon: <MinusCircleOutlined />,
        onClick: () => {
          window.modal.confirm({
            title: t('assistants.clear.title'),
            content: t('assistants.clear.content'),
            centered: true,
            okButtonProps: { danger: true },
            onOk: () => removeAllTopics() // 使用当前助手的removeAllTopics
          })
        }
      },
      {
        label: t('assistants.save.title'),
        key: 'save-to-agent',
        icon: <SaveOutlined />,
        onClick: async () => {
          const agent = omit(assistant, ['model', 'emoji'])
          agent.id = uuid()
          agent.type = 'agent'
          addAgent(agent)
          window.message.success({
            content: t('assistants.save.success'),
            key: 'save-to-agent'
          })
        }
      },
      { type: 'divider' },
      {
        label: t('common.delete'),
        key: 'delete',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => {
          window.modal.confirm({
            title: t('assistants.delete.title'),
            content: t('assistants.delete.content'),
            centered: true,
            okButtonProps: { danger: true },
            onOk: () => onDelete(assistant)
          })
        }
      }
    ],
    [addAgent, addAssistant, onSwitch, removeAllTopics, t, onDelete]
  )

  const handleSwitch = useCallback(async () => {
    await modelGenerating()

    if (topicPosition === 'left' && clickAssistantToShowTopic) {
      EventEmitter.emit(EVENT_NAMES.SWITCH_TOPIC_SIDEBAR)
    }

    onSwitch(assistant)
  }, [clickAssistantToShowTopic, onSwitch, assistant, topicPosition])

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  // 这里我们不需要 isHovered 状态，因为 framer-motion 的 whileHover 已经处理了悬停效果

  const assistantName = assistant.name || t('chat.default.name')
  // emoji 和名称分开处理，不再合并成一个字符串

  return (
    <Dropdown menu={{ items: getMenuItems(assistant) }} trigger={['contextMenu']}>
      <motion.div
        ref={ref}
        variants={itemVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        whileHover="hover"
        whileTap="tap">
        <Container onClick={handleSwitch} className={isActive ? 'active' : ''}>
          <AssistantNameRow className="name" title={assistantName}>
            {showAssistantIcon && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.1 }}
                className="avatar-container">
                <ModelAvatar model={assistant.model || defaultModel} size={22} />
              </motion.div>
            )}
            <motion.div
              variants={textVariants}
              initial="hidden"
              animate="visible"
              style={{ width: '100%', overflow: 'hidden' }}>
              <AssistantName>
                {assistant.emoji && (
                  <span className="emoji" aria-label="emoji">
                    {assistant.emoji}
                  </span>
                )}
                <span className="name-text">{assistantName}</span>
              </AssistantName>
            </motion.div>
          </AssistantNameRow>
          {isActive && (
            <motion.div
              onClick={() => EventEmitter.emit(EVENT_NAMES.SWITCH_TOPIC_SIDEBAR)}
              variants={countVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap">
              <MenuButton>
                <TopicCount className="topics-count">{assistant.topics.length}</TopicCount>
              </MenuButton>
            </motion.div>
          )}
        </Container>
      </motion.div>
    </Dropdown>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  position: relative;
  margin: 0 8px 8px;
  font-family: var(--font-family);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  width: calc(100% - 16px);
  cursor: pointer;
  background-color: rgba(var(--color-background-rgb), 0.7);
  backdrop-filter: blur(8px);
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.04),
    0 0 2px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  .iconfont {
    opacity: 0;
    color: var(--color-text-3);
    transition: all 0.3s ease;
  }

  &:hover {
    background-color: rgba(var(--color-background-rgb), 0.8);
    border-color: var(--color-border-dark);
    transform: translateY(-3px);
    box-shadow:
      0 8px 20px rgba(0, 0, 0, 0.08),
      0 2px 8px rgba(0, 0, 0, 0.04);

    .iconfont {
      opacity: 0.8;
    }
  }

  &.active {
    background-color: rgba(var(--color-primary-rgb), 0.05);
    border: 1px solid var(--color-primary-light);
    box-shadow:
      0 0 0 2px rgba(var(--color-primary-rgb), 0.15),
      0 6px 16px rgba(0, 0, 0, 0.06);
  }
`

const AssistantNameRow = styled.div`
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
`

const AssistantName = styled.div`
  color: var(--color-text);
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.3px;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  .emoji {
    color: initial; /* 恢复 emoji 的原始颜色 */
    background: none;
    flex-shrink: 0;
    font-size: 16px;
  }

  .name-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .active & {
    color: var(--color-primary);
  }
`

const MenuButton = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  min-width: 24px;
  height: 24px;
  min-height: 24px;
  border-radius: 6px;
  background-color: var(--color-primary);
  margin-left: 8px;
  padding: 0 8px;
  border: none;
  box-shadow: 0 1px 2px rgba(var(--color-primary-rgb), 0.2);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background-color: var(--color-primary-light);
    box-shadow: 0 2px 4px rgba(var(--color-primary-rgb), 0.25);
  }
`

const TopicCount = styled.div`
  color: white;
  font-size: 10px;
  font-weight: 500;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-primary);
  padding: 2px 4px;
  min-width: 16px;
  height: 16px;
`

export default AssistantItem
