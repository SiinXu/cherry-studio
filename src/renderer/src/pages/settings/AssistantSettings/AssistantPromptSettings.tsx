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
import { useEffect, useRef, useState } from 'react'
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

  useEffect(() => {
    const updateTokenCount = async () => {
      const count = await estimateTextTokens(prompt)
      setTokenCount(count)
    }
    updateTokenCount()
  }, [prompt])

  useEffect(() => {
    if (name && name !== prevNameRef.current && autoGenEnabled) {
      prevNameRef.current = name

      if (emojiTimeoutRef.current) {
        clearTimeout(emojiTimeoutRef.current)
      }

      emojiTimeoutRef.current = setTimeout(() => {
        generateEmoji()
      }, 800)
    }

    return () => {
      if (emojiTimeoutRef.current) {
        clearTimeout(emojiTimeoutRef.current)
      }
    }
  }, [name])

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

  const generateEmoji = async () => {
    if (!name) return

    console.log('开始生成emoji, 名称:', name)
    setEmojiLoading(true)
    try {
      console.log('调用fetchEmojiSuggestion前')
      const suggestedEmoji = await fetchEmojiSuggestion(name)
      console.log('获取到emoji结果:', suggestedEmoji)
      setEmoji(suggestedEmoji)
      const _assistant = { ...assistant, name: name.trim(), emoji: suggestedEmoji, prompt }
      updateAssistant(_assistant)
      console.log('生成的emoji:', suggestedEmoji)
    } catch (error) {
      console.error('Error generating emoji:', error)
      const defaultEmojis = ['🤖', '💡', '✨', '🧠', '📚']
      const defaultEmoji = defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)]
      console.log('生成出错，使用默认emoji:', defaultEmoji)
      setEmoji(defaultEmoji)
      const _assistant = { ...assistant, name: name.trim(), emoji: defaultEmoji, prompt }
      updateAssistant(_assistant)
    } finally {
      setEmojiLoading(false)
      console.log('完成emoji生成流程')
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    if (newName && !autoGenEnabled) {
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
