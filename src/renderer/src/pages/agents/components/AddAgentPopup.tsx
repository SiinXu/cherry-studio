import 'emoji-picker-element'

import { CheckOutlined, LoadingOutlined, ThunderboltOutlined } from '@ant-design/icons'
import EmojiPicker from '@renderer/components/EmojiPicker'
import { TopView } from '@renderer/components/TopView'
import { AGENT_PROMPT } from '@renderer/config/prompts'
import { useAgents } from '@renderer/hooks/useAgents'
import { useSidebarIconShow } from '@renderer/hooks/useSidebarIcon'
import { fetchEmojiSuggestion, fetchGenerate } from '@renderer/services/ApiService'
import { getDefaultModel } from '@renderer/services/AssistantService'
import { estimateTextTokens } from '@renderer/services/TokenService'
import { useAppSelector } from '@renderer/store'
import { Agent, KnowledgeBase } from '@renderer/types'
import { getLeadingEmoji, uuid } from '@renderer/utils'
import { Button, Form, FormInstance, Input, Modal, Popover, Select, SelectProps, Space } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import stringWidth from 'string-width'
import styled from 'styled-components'

interface Props {
  resolve: (data: Agent | null) => void
}

type FieldType = {
  id: string
  name: string
  prompt: string
  knowledge_base_ids: string[]
}

const PopupContainer: React.FC<Props> = ({ resolve }) => {
  const [open, setOpen] = useState(true)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const { addAgent } = useAgents()
  const formRef = useRef<FormInstance>(null)
  const [emoji, setEmoji] = useState('')
  const [loading, setLoading] = useState(false)
  const [emojiLoading, setEmojiLoading] = useState(false)
  const [tokenCount, setTokenCount] = useState(0)
  const knowledgeState = useAppSelector((state) => state.knowledge)
  const showKnowledgeIcon = useSidebarIconShow('knowledge')
  const knowledgeOptions: SelectProps['options'] = []

  knowledgeState.bases.forEach((base) => {
    knowledgeOptions.push({
      label: base.name,
      value: base.id
    })
  })

  useEffect(() => {
    const updateTokenCount = async () => {
      const prompt = formRef.current?.getFieldValue('prompt')
      if (prompt) {
        const count = await estimateTextTokens(prompt)
        setTokenCount(count)
      } else {
        setTokenCount(0)
      }
    }
    updateTokenCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.getFieldValue('prompt')])

  const onFinish = (values: FieldType) => {
    const _emoji = emoji || getLeadingEmoji(values.name)

    if (values.name.trim() === '' || values.prompt.trim() === '') {
      return
    }

    const _agent: Agent = {
      id: uuid(),
      name: values.name,
      knowledge_bases: values.knowledge_base_ids
        ?.map((id) => knowledgeState.bases.find((t) => t.id === id))
        ?.filter((base): base is KnowledgeBase => base !== undefined),
      emoji: _emoji,
      prompt: values.prompt,
      defaultModel: getDefaultModel(),
      type: 'agent',
      topics: [],
      messages: []
    }

    addAgent(_agent)
    resolve(_agent)
    setOpen(false)
  }

  const onCancel = () => {
    setOpen(false)
  }

  const onClose = () => {
    resolve(null)
  }

  const handleButtonClick = async () => {
    const name = formRef.current?.getFieldValue('name')
    const content = formRef.current?.getFieldValue('prompt')
    const promptText = content || name

    if (!promptText) {
      return
    }

    if (content) {
      navigator.clipboard.writeText(content)
    }

    setLoading(true)

    try {
      const generatedText = await fetchGenerate({
        prompt: AGENT_PROMPT,
        content: promptText
      })
      formRef.current?.setFieldValue('prompt', generatedText)
    } catch (error) {
      console.error('Error fetching data:', error)
    }

    setLoading(false)
  }

  // 生成emoji的函数
  const generateEmoji = async () => {
    const name = formRef.current?.getFieldValue('name')
    if (!name) return

    setEmojiLoading(true)
    try {
      // 使用简单的emoji映射表直接生成，避免复杂的外部调用
      const emojiMap: Record<string, string[]> = {
        // 智能助手相关
        '助手': ['🤖', '🧠', '💡', '🔍', '📚'],
        '智能': ['🧠', '💡', '⚡', '✨', '🔮'],
        '翻译': ['🌐', '🔄', '📝', '🗣️'],
        '学习': ['📚', '🎓', '✏️', '📝', '🧠'],
        '编程': ['💻', '⌨️', '🖥️', '📱'],
        '写作': ['✍️', '📝', '📄', '📰'],
        '数据': ['📊', '📈', '📉', '🧮'],
        '游戏': ['🎮', '🎲', '🎯', '🎪'],
        '音乐': ['🎵', '🎼', '🎧', '🎷'],
        '设计': ['🎨', '✏️', '📐', '📱'],
        '旅游': ['✈️', '🌍', '🗺️', '🧳'],
        '美食': ['🍲', '🍳', '🍽️', '🍔'],
        '猫': ['🐱', '😺', '😻', '🐾'],
        '狗': ['🐶', '🐕', '🦮', '🐾']
      }
      
      // 查找匹配的emoji
      const words = name.toLowerCase().split(/\s+/)
      const matchedEmojis: string[] = []
      
      for (const word of words) {
        for (const [key, emojis] of Object.entries(emojiMap)) {
          if (word.includes(key) || key.includes(word)) {
            const emoji = emojis[Math.floor(Math.random() * emojis.length)]
            matchedEmojis.push(emoji)
          }
        }
      }
      
      // 如果找到匹配的emoji，随机选择一个
      if (matchedEmojis.length > 0) {
        const suggestedEmoji = matchedEmojis[Math.floor(Math.random() * matchedEmojis.length)]
        setEmoji(suggestedEmoji)
        console.log('生成的emoji:', suggestedEmoji) // 调试用
      } else {
        // 如果没有匹配的emoji，使用默认的
        const defaultEmojis = ['🤖', '💡', '✨', '🧠', '📚']
        const defaultEmoji = defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)]
        setEmoji(defaultEmoji)
        console.log('使用默认emoji:', defaultEmoji) // 调试用
      }
    } catch (error) {
      console.error('Error generating emoji:', error)
      // 出错时使用默认emoji
      const defaultEmojis = ['🤖', '💡', '✨', '🧠', '📚']
      const defaultEmoji = defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)]
      setEmoji(defaultEmoji)
    } finally {
      setEmojiLoading(false)
    }
  }

  // Compute label width based on the longest label
  const labelWidth = [t('agents.add.name'), t('agents.add.prompt'), t('agents.add.knowledge_base')]
    .map((labelText) => stringWidth(labelText) * 8)
    .reduce((maxWidth, currentWidth) => Math.max(maxWidth, currentWidth), 80)

  return (
    <Modal
      title={t('agents.add.title')}
      open={open}
      onOk={() => formRef.current?.submit()}
      onCancel={onCancel}
      maskClosable={false}
      afterClose={onClose}
      okText={t('agents.add.title')}
      width={800}
      centered>
      <Form
        ref={formRef}
        form={form}
        labelCol={{ flex: `${labelWidth}px` }}
        labelAlign="left"
        colon={false}
        style={{ marginTop: 25 }}
        onFinish={onFinish}
        onValuesChange={async (changedValues) => {
          if (changedValues.prompt) {
            const count = await estimateTextTokens(changedValues.prompt)
            setTokenCount(count)
          }
        }}>
        <Form.Item label="Emoji">
          <Space>
            <Popover content={<EmojiPicker onEmojiClick={setEmoji} />} arrow>
              <Button style={{ width: '60px', height: '40px', fontSize: '24px' }}>
                {emoji || '😀'}
              </Button>
            </Popover>
            <Button 
              onClick={generateEmoji} 
              loading={emojiLoading}
              disabled={!formRef.current?.getFieldValue('name')}
            >
              自动生成
            </Button>
          </Space>
        </Form.Item>
        <Form.Item 
          name="name" 
          label={t('agents.add.name')} 
          rules={[{ required: true }]}
        >
          <Input 
            placeholder={t('agents.add.name.placeholder')} 
            spellCheck={false} 
            allowClear 
            onChange={(e) => {
              // 当名称改变时，清除emoji以避免混淆
              if (emoji && e.target.value === '') {
                setEmoji('')
              }
            }}
          />
        </Form.Item>
        <div style={{ position: 'relative' }}>
          <Form.Item
            name="prompt"
            label={t('agents.add.prompt')}
            rules={[{ required: true }]}
            style={{ position: 'relative' }}>
            <TextAreaContainer>
              <TextArea placeholder={t('agents.add.prompt.placeholder')} spellCheck={false} rows={10} />
              <TokenCount>Tokens: {tokenCount}</TokenCount>
            </TextAreaContainer>
          </Form.Item>
          <Button
            icon={loading ? <LoadingOutlined /> : <ThunderboltOutlined />}
            onClick={handleButtonClick}
            style={{ position: 'absolute', top: 8, right: 8 }}
            disabled={loading}
          />
        </div>
        {showKnowledgeIcon && (
          <Form.Item name="knowledge_base_ids" label={t('agents.add.knowledge_base')} rules={[{ required: false }]}>
            <Select
              mode="multiple"
              allowClear
              placeholder={t('agents.add.knowledge_base.placeholder')}
              menuItemSelectedIcon={<CheckOutlined />}
              options={knowledgeOptions}
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

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

export default class AddAgentPopup {
  static topviewId = 0
  static hide() {
    TopView.hide('AddAgentPopup')
  }
  static show() {
    return new Promise<Agent | null>((resolve) => {
      TopView.show(
        <PopupContainer
          resolve={(v) => {
            resolve(v)
            this.hide()
          }}
        />,
        'AddAgentPopup'
      )
    })
  }
}
