import { PlusOutlined } from '@ant-design/icons'
import DragableList from '@renderer/components/DragableList'
import Scrollbar from '@renderer/components/Scrollbar'
import { useAgents } from '@renderer/hooks/useAgents'
import { useAssistants } from '@renderer/hooks/useAssistant'
import { Assistant } from '@renderer/types'
import { AnimatePresence, motion } from 'framer-motion'
import { FC, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import styled from 'styled-components'

import AssistantItem from './AssistantItem'

interface AssistantsTabProps {
  activeAssistant: Assistant
  setActiveAssistant: (assistant: Assistant) => void
  onCreateAssistant: () => void
  onCreateDefaultAssistant: () => void
}

// 定义动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
      mass: 1
    }
  },
  hover: {
    y: -2,
    scale: 1.01,
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
    transition: { duration: 0.15 }
  }
}

const addButtonVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: 0.4,
      duration: 0.5,
      type: 'spring',
      stiffness: 500,
      damping: 25
    }
  },
  hover: {
    scale: 1.05,
    y: -3,
    backgroundColor: 'rgba(var(--color-primary-rgb), 0.12)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  }
}

const Assistants: FC<AssistantsTabProps> = ({
  activeAssistant,
  setActiveAssistant,
  onCreateAssistant,
  onCreateDefaultAssistant
}) => {
  const { assistants, removeAssistant, addAssistant, updateAssistants } = useAssistants()
  // 跟踪列表拖拽状态
  const [dragging, setDragging] = useState(false)
  const { addAgent } = useAgents()
  const { t } = useTranslation()

  const onDelete = useCallback(
    (assistant: Assistant) => {
      const remaining = assistants.filter((a) => a.id !== assistant.id)
      const newActive = remaining[remaining.length - 1]
      newActive ? setActiveAssistant(newActive) : onCreateDefaultAssistant()
      removeAssistant(assistant.id)
    },
    [assistants, removeAssistant, setActiveAssistant, onCreateDefaultAssistant]
  )

  // 使用 InView 钩子检测组件是否在视图中
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '50px'
  })

  return (
    <Container className="assistants-tab" ref={ref}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="assistants-container">
        {/* 标题已移除 */}

        <ListWrapper>
          <DragableList
            list={assistants}
            onUpdate={updateAssistants}
            style={{
              paddingBottom: dragging ? '34px' : 0,
              width: '100%'
            }}
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}>
            {(assistant) => (
              <motion.div
                variants={itemVariants}
                layout
                layoutId={`assistant-${assistant.id}`}
                whileHover="hover"
                whileTap="tap"
                transition={{
                  layout: { type: 'spring', stiffness: 400, damping: 30 }
                }}>
                <AssistantItem
                  key={assistant.id}
                  assistant={assistant}
                  isActive={assistant.id === activeAssistant.id}
                  onSwitch={setActiveAssistant}
                  onDelete={onDelete}
                  addAgent={addAgent}
                  addAssistant={addAssistant}
                  onCreateDefaultAssistant={onCreateDefaultAssistant}
                />
              </motion.div>
            )}
          </DragableList>
        </ListWrapper>

        <AnimatePresence mode="wait">
          {!dragging && (
            <motion.div
              variants={addButtonVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              whileHover="hover"
              whileTap="tap">
              <AssistantAddItem onClick={onCreateAssistant}>
                <AssistantIcon>
                  <PlusOutlined style={{ color: 'var(--color-primary)' }} />
                </AssistantIcon>
                <AssistantName>{t('chat.add.assistant.title')}</AssistantName>
              </AssistantAddItem>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ minHeight: 16 }}></div>
      </motion.div>
    </Container>
  )
}

// 样式组件（只定义一次）
const Container = styled(Scrollbar)`
  display: flex;
  flex-direction: column;
  padding-top: 16px;
  user-select: none;
  border-radius: 12px;
  overflow: auto;
  max-height: 100vh;
  width: 100%;

  .assistants-container {
    padding: 0 8px;
    width: 100%;
  }
`

const ListWrapper = styled.div`
  margin: 0 0 16px 0;
  padding: 8px 4px;
  border-radius: 12px;
  background: rgba(var(--color-bg-container-rgb), 0.6);
  width: 100%;
`

// 标题相关样式已移除

const AssistantAddItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 18px;
  position: relative;
  margin: 0 0 8px;
  font-family: var(--font-family);
  border-radius: 12px;
  border: 1.5px dashed var(--color-primary-light);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  background-color: rgba(var(--color-primary-rgb), 0.05);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  backdrop-filter: blur(4px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(120deg, transparent, rgba(var(--color-primary-rgb), 0.08), transparent);
    background-size: 200% 100%;
    animation: shine 4s infinite;
    opacity: 0.6;
  }

  @keyframes shine {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: -100% 0;
    }
  }
`

const AssistantIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  border-radius: 14px;
  margin-right: 10px;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
  color: white;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(var(--color-primary-rgb), 0.35);
  position: relative;
  z-index: 2;

  svg {
    color: white !important;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  }
`

const AssistantName = styled.div`
  color: var(--color-primary);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  position: relative;
  z-index: 2;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.7);
`

export default Assistants
