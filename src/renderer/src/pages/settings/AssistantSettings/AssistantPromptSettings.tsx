import 'emoji-picker-element'

import { CloseCircleFilled, LoadingOutlined, ThunderboltOutlined } from '@ant-design/icons'
import EmojiPicker from '@renderer/components/EmojiPicker'
import { Box, HStack } from '@renderer/components/Layout'
import { fetchEmojiSuggestion } from '@renderer/services/ApiService'
import { estimateTextTokens } from '@renderer/services/TokenService'
import { Assistant, AssistantSettings } from '@renderer/types'
import { getLeadingEmoji } from '@renderer/utils'
import { Button, Input, Popover, Space, Tooltip } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  assistant: Assistant
  updateAssistant: (assistant: Assistant) => void
  updateAssistantSettings: (settings: AssistantSettings) => void
  onOk: () => void
}

const AssistantPromptSettings: React.FC<Props> = ({ assistant, updateAssistant, onOk }) => {
  const [emoji, setEmoji] = useState(getLeadingEmoji(assistant.name) || assistant.emoji)
  const [name, setName] = useState(assistant.name.replace(getLeadingEmoji(assistant.name) || '', '').trim())
  const [prompt, setPrompt] = useState(assistant.prompt)
  const [tokenCount, setTokenCount] = useState(0)
  const [emojiLoading, setEmojiLoading] = useState(false)
  const [autoGenEnabled, setAutoGenEnabled] = useState(true)
  const prevNameRef = useRef(name)
  const emojiTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { t } = useTranslation()

  console.log('📍 组件初始化状态:', {
    emoji,
    name,
    autoGenEnabled,
    assistantName: assistant.name,
    assistantEmoji: assistant.emoji
  })

  // 确保组件挂载时prevNameRef的值与初始name一致
  useEffect(() => {
    console.log('🔰 组件挂载初始化')
    prevNameRef.current = name
  }, [])

  useEffect(() => {
    const updateTokenCount = async () => {
      const count = await estimateTextTokens(prompt)
      setTokenCount(count)
    }
    updateTokenCount()
  }, [prompt])

  const generateEmoji = useCallback(async () => {
    console.log('🔍generateEmoji被调用，参数:', { name, prompt })
    if (!name) {
      console.log('❌名称为空，中止生成')
      return
    }

    console.log('✅开始生成emoji, 名称:', name)
    setEmojiLoading(true)
    try {
      console.log('🔄调用fetchEmojiSuggestion前')
      const suggestedEmoji = await fetchEmojiSuggestion(name)
      console.log('✅获取到emoji结果:', suggestedEmoji)

      // 立即设置emoji，不依赖其他状态更新
      setEmoji(suggestedEmoji)

      // 等待一下确保设置生效
      setTimeout(() => {
        const _assistant = { ...assistant, name: name.trim(), emoji: suggestedEmoji, prompt }
        console.log('📝更新智能体对象:', _assistant)
        updateAssistant(_assistant)
        console.log('✨生成的emoji:', suggestedEmoji)
      }, 0)
    } catch (error) {
      console.error('❌Error generating emoji:', error)
      const defaultEmojis = ['🤖', '💡', '✨', '🧠', '📚']
      const defaultEmoji = defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)]
      console.log('⚠️生成出错，使用默认emoji:', defaultEmoji)
      setEmoji(defaultEmoji)
      const _assistant = { ...assistant, name: name.trim(), emoji: defaultEmoji, prompt }
      updateAssistant(_assistant)
    } finally {
      setEmojiLoading(false)
      console.log('🏁完成emoji生成流程')
    }
  }, [name, prompt, assistant, updateAssistant])

  useEffect(() => {
    console.log('------name useEffect触发------', {
      name,
      prevName: prevNameRef.current,
      autoGenEnabled
    })

    // 仅在名称有实际变化且不为空且启用自动生成时触发
    if (name && name !== prevNameRef.current && autoGenEnabled) {
      console.log('🔥准备生成emoji，设置定时器🔥')
      prevNameRef.current = name

      // 清除之前的定时器
      if (emojiTimeoutRef.current) {
        clearTimeout(emojiTimeoutRef.current)
      }

      // 设置防抖延迟
      emojiTimeoutRef.current = setTimeout(() => {
        console.log('⚡定时器触发，开始生成emoji⚡')
        generateEmoji()
      }, 300) // 减少到300ms使反应更快
    }

    // 组件卸载时清除定时器
    return () => {
      if (emojiTimeoutRef.current) {
        clearTimeout(emojiTimeoutRef.current)
      }
    }
    // 确保依赖项顺序正确，先检查变量再检查函数
  }, [name, autoGenEnabled, generateEmoji])

  const onUpdate = () => {
    const _assistant = { ...assistant, name: name.trim(), emoji, prompt }
    updateAssistant(_assistant)
  }

  const handleEmojiSelect = (selectedEmoji: string) => {
    setEmoji(selectedEmoji)
    const _assistant = { ...assistant, name: name.trim(), emoji: selectedEmoji, prompt }
    updateAssistant(_assistant)
    setAutoGenEnabled(false)
  }

  const handleEmojiDelete = () => {
    setEmoji('')
    const _assistant = { ...assistant, name: name.trim(), prompt, emoji: '' }
    updateAssistant(_assistant)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    console.log('📝handleNameChange触发📝', { oldName: name, newName, autoGenEnabled })
    setName(newName)
    // 当用户开始输入时，重新启用自动生成
    if (newName && !autoGenEnabled) {
      console.log('🔄重新启用自动生成🔄')
      setAutoGenEnabled(true)
    }
  }

  return (
    <Container>
      <Box mb={8} style={{ fontWeight: 'bold' }}>
        {t('common.name')}
      </Box>
      <HStack gap={8} alignItems="center">
        <Space>
          <Popover content={<EmojiPicker onEmojiClick={handleEmojiSelect} />} arrow>
            <EmojiButtonWrapper>
              <Button style={{ fontSize: 20, padding: '4px', minWidth: '32px', height: '32px' }}>{emoji}</Button>
              {emoji && (
                <CloseCircleFilled
                  className="delete-icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEmojiDelete()
                  }}
                  style={{
                    display: 'none',
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    fontSize: '16px',
                    color: '#ff4d4f',
                    cursor: 'pointer'
                  }}
                />
              )}
            </EmojiButtonWrapper>
          </Popover>
          <Tooltip title="手动重新生成">
            <Button
              type="text"
              icon={emojiLoading ? <LoadingOutlined /> : <ThunderboltOutlined />}
              onClick={() => {
                setAutoGenEnabled(true)
                generateEmoji()
              }}
              loading={emojiLoading}
              disabled={!name}
            />
          </Tooltip>
        </Space>
        <Input
          placeholder={t('common.assistant') + t('common.name')}
          value={name}
          onChange={handleNameChange}
          onBlur={onUpdate}
          style={{ flex: 1 }}
        />
      </HStack>
      <Box mt={8} mb={8} style={{ fontWeight: 'bold' }}>
        {t('common.prompt')}
      </Box>
      <TextAreaContainer>
        <TextArea
          rows={10}
          placeholder={t('common.assistant') + t('common.prompt')}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={onUpdate}
          spellCheck={false}
          style={{ minHeight: 'calc(80vh - 200px)', maxHeight: 'calc(80vh - 150px)' }}
        />
        <TokenCount>Tokens: {tokenCount}</TokenCount>
      </TextAreaContainer>
      <HStack width="100%" justifyContent="flex-end" mt="10px">
        <Button type="primary" onClick={onOk}>
          {t('common.close')}
        </Button>
      </HStack>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: 5px;
`

const EmojiButtonWrapper = styled.div`
  position: relative;
  display: inline-block;

  &:hover .delete-icon {
    display: block !important;
  }
`

const TextAreaContainer = styled.div`
  position: relative;
  width: 100%;
`

const TokenCount = styled.div`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: var(--color-background-soft);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-text-2);
  user-select: none;
`

export default AssistantPromptSettings
