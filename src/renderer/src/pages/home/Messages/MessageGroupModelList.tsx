import { HStack } from '@renderer/components/Layout'
import { Message } from '@renderer/types'
import { FC, memo } from 'react'
import styled from 'styled-components'

interface Props {
  messages: Message[]
  selectedIndex: number
  setSelectedIndex: (index: number) => void
}

/**
 * 消息组模型列表组件
 * 当多模型消息显示风格为"折叠"时显示此组件
 */
const MessageGroupModelList: FC<Props> = ({ messages, selectedIndex, setSelectedIndex }) => {
  // 获取唯一的模型ID列表
  const uniqueModels = Array.from(new Set(messages.map((message) => message.model?.id || 'unknown')))

  return (
    <ModelListContainer>
      {uniqueModels.map((modelId, index) => {
        const modelName = messages.find((message) => message.model?.id === modelId)?.model?.name || '未知模型'
        return (
          <ModelItem key={modelId} $active={index === selectedIndex} onClick={() => setSelectedIndex(index)}>
            {modelName}
          </ModelItem>
        )
      })}
    </ModelListContainer>
  )
}

const ModelListContainer = styled(HStack)`
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding: 0 8px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`

const ModelItem = styled.div<{ $active: boolean }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  background-color: ${(props) => (props.$active ? 'var(--color-primary-light)' : 'transparent')};
  color: ${(props) => (props.$active ? 'var(--color-primary)' : 'var(--color-text-secondary)')};
  border: 1px solid ${(props) => (props.$active ? 'var(--color-primary)' : 'var(--color-border)')};

  &:hover {
    background-color: var(--color-primary-light);
    color: var(--color-primary);
  }
`

export default memo(MessageGroupModelList)
