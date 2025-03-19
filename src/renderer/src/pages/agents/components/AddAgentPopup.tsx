import 'emoji-picker-element'

import { CheckOutlined, LoadingOutlined, ThunderboltOutlined } from '@ant-design/icons'
import EmojiPicker from '@renderer/components/EmojiPicker'
import { TopView } from '@renderer/components/TopView'
import { AGENT_PROMPT } from '@renderer/config/prompts'
import { useAgents } from '@renderer/hooks/useAgents'
import { useSidebarIconShow } from '@renderer/hooks/useSidebarIcon'
import { fetchGenerate } from '@renderer/services/ApiService'
import { getDefaultModel } from '@renderer/services/AssistantService'
import { estimateTextTokens } from '@renderer/services/TokenService'
import { useAppSelector } from '@renderer/store'
import { Agent, KnowledgeBase } from '@renderer/types'
import { getLeadingEmoji, uuid } from '@renderer/utils'
import { Button, Form, FormInstance, Input, Modal, Popover, Select, SelectProps } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
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

// 文本动画变体
const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  })
}

// 输入框动画变体
const inputVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, type: 'spring', stiffness: 200, damping: 20 } },
  hover: { scale: 1.02, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', transition: { duration: 0.2 } },
  focus: {
    scale: 1.01,
    boxShadow: '0 0 0 3px rgba(var(--color-primary-rgb), 0.15)',
    borderColor: 'var(--color-primary)',
    transition: { duration: 0.2 }
  }
}

// 模态框动画变体
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      duration: 0.5
    }
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.3 } }
}

const PopupContainer: React.FC<Props> = ({ resolve }) => {
  const [open, setOpen] = useState(true)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const { addAgent } = useAgents()
  const formRef = useRef<FormInstance>(null)
  const [emoji, setEmoji] = useState('')
  const [loading, setLoading] = useState(false)
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

  // Compute label width based on the longest label
  const labelWidth = [t('agents.add.name'), t('agents.add.prompt'), t('agents.add.knowledge_base')]
    .map((labelText) => stringWidth(labelText) * 8)
    .reduce((maxWidth, currentWidth) => Math.max(maxWidth, currentWidth), 80)

  // 使用 InView 钩子跟踪元素是否在视图中
  const [formRef1, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  return (
    <ModalStyled
      title={<ModalTitle>{t('agents.add.title')}</ModalTitle>}
      open={open}
      onOk={() => formRef.current?.submit()}
      onCancel={onCancel}
      maskClosable={false}
      afterClose={onClose}
      okText={t('agents.add.title')}
      width={800}
      centered
      modalRender={(modal) => (
        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit">
          {modal}
        </motion.div>
      )}>
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
        <motion.div
          ref={formRef1}
          variants={textVariants}
          custom={0}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}>
          <FormItemStyled name="name" label="Emoji">
            <Popover content={<EmojiPicker onEmojiClick={setEmoji} />} arrow>
              <EmojiButton icon={emoji && <span style={{ fontSize: 20 }}>{emoji}</span>}>
                {t('common.select')}
              </EmojiButton>
            </Popover>
          </FormItemStyled>
        </motion.div>

        <motion.div variants={textVariants} custom={1} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <FormItemStyled name="name" label={t('agents.add.name')} rules={[{ required: true }]}>
            <motion.div variants={inputVariants} initial="initial" animate="animate" whileHover="hover">
              <InputStyled placeholder={t('agents.add.name.placeholder')} spellCheck={false} allowClear />
            </motion.div>
          </FormItemStyled>
        </motion.div>

        <motion.div variants={textVariants} custom={2} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <div style={{ position: 'relative' }}>
            <FormItemStyled
              name="prompt"
              label={t('agents.add.prompt')}
              rules={[{ required: true }]}
              style={{ position: 'relative' }}>
              <TextAreaContainer>
                <motion.div variants={inputVariants} initial="initial" animate="animate" whileHover="hover">
                  <TextAreaStyled placeholder={t('agents.add.prompt.placeholder')} spellCheck={false} rows={10} />
                </motion.div>
                <TokenCountStyled>Tokens: {tokenCount}</TokenCountStyled>
              </TextAreaContainer>
            </FormItemStyled>
            <GenerateButton
              icon={loading ? <LoadingOutlined /> : <ThunderboltOutlined />}
              onClick={handleButtonClick}
              disabled={loading}
            />
          </div>
        </motion.div>

        {showKnowledgeIcon && (
          <motion.div variants={textVariants} custom={3} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
            <FormItemStyled
              name="knowledge_base_ids"
              label={t('agents.add.knowledge_base')}
              rules={[{ required: false }]}>
              <motion.div variants={inputVariants} initial="initial" animate="animate" whileHover="hover">
                <SelectStyled
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
              </motion.div>
            </FormItemStyled>
          </motion.div>
        )}
      </Form>
    </ModalStyled>
  )
}

// 样式化组件
const ModalStyled = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.06),
      0 3px 8px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    border: none;
    background: var(--color-background);
  }

  .ant-modal-close {
    position: absolute;
    top: 14px;
    right: 14px;
    color: var(--color-text);
    background: var(--color-background-elevated);
    border-radius: 8px;
    width: 32px;
    height: 32px;
    cursor: pointer !important;
    opacity: 1;
    z-index: 1001;
    display: flex;
    align-items: center;
    justify-content: center;

    .ant-modal-close-x {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      line-height: 1;
    }

    &:hover {
      background: var(--color-background-soft);
      color: var(--color-error);
    }
  }

  .ant-modal-header {
    border-bottom: none;
    padding: 28px 28px 0;
    background: transparent;
  }

  .ant-modal-body {
    padding: 20px 28px 28px;
  }

  .ant-modal-footer {
    border-top: none;
    padding: 0 28px 28px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .ant-btn {
      border-radius: 12px;
      height: 42px;
      padding: 0 20px;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .ant-btn-primary {
      background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
      border: none;
      box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.2);

      &:hover {
        box-shadow: 0 6px 16px rgba(var(--color-primary-rgb), 0.3);
      }
    }
  }
`

const ModalTitle = styled.div`
  font-size: 24px;
  font-weight: 600;
  background: linear-gradient(120deg, var(--color-primary), var(--color-primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  position: relative;
  display: inline-block;
  padding-bottom: 6px;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 40%;
    height: 3px;
    background: linear-gradient(90deg, var(--color-primary), transparent);
    border-radius: 3px;
  }
`

const FormItemStyled = styled(Form.Item)`
  margin-bottom: 24px;

  .ant-form-item-label > label {
    font-weight: 500;
    color: var(--color-text);
  }
`

const InputStyled = styled(Input)`
  border-radius: 12px;
  border: 1px solid var(--color-border);
  padding: 12px 16px;
  height: auto;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  font-weight: 500;

  &:hover {
    border-color: var(--color-primary-light);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.15);
    transform: translateY(-2px);
    background: rgba(var(--color-primary-rgb), 0.03);
  }
`

const TextAreaContainer = styled.div`
  position: relative;
  width: 100%;
`

const TextAreaStyled = styled(TextArea)`
  border-radius: 16px;
  border: 1px solid var(--color-border);
  padding: 16px;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  font-family: var(--font-family-mono);
  resize: vertical;
  min-height: 160px;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  line-height: 1.6;

  &:hover {
    border-color: var(--color-primary-light);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  &:focus {
    border-color: var(--color-primary);
    box-shadow:
      0 0 0 3px rgba(var(--color-primary-rgb), 0.15),
      0 8px 24px rgba(0, 0, 0, 0.07);
    background: rgba(var(--color-primary-rgb), 0.03);
    transform: translateY(-2px);
  }
`

const TokenCountStyled = styled.div`
  position: absolute;
  bottom: 12px;
  right: 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-2);
  background: var(--color-background-soft);
  padding: 4px 12px;
  border-radius: 20px;
  opacity: 0.85;
  border: 1px solid rgba(var(--color-primary-rgb), 0.1);
  backdrop-filter: blur(8px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
  z-index: 2;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:hover {
    opacity: 1;
    transform: translateY(-3px);
    box-shadow:
      0 8px 16px rgba(0, 0, 0, 0.12),
      0 3px 6px rgba(0, 0, 0, 0.06);
    background: linear-gradient(135deg, var(--color-background-soft), rgba(var(--color-primary-rgb), 0.07));
  }
`

const EmojiButton = styled(Button)`
  border-radius: 12px;
  padding: 0 16px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 2px solid var(--color-border);
  background: rgba(var(--color-primary-rgb), 0.03);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    border-color: var(--color-primary-light);
    background: rgba(var(--color-primary-rgb), 0.06);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`

const GenerateButton = styled(Button)`
  position: absolute;
  top: 8px;
  right: 8px;
  border-radius: 10px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
  border: none;
  color: white;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 10px rgba(var(--color-primary-rgb), 0.25);
  overflow: hidden;
  z-index: 5;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.6s ease;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 16px rgba(var(--color-primary-rgb), 0.4);

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3);
  }

  &:disabled {
    background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
    color: #d9d9d9;
    box-shadow: none;
  }
`

const SelectStyled = styled(Select)`
  .ant-select-selector {
    border-radius: 8px !important;
    border: 2px solid var(--color-border) !important;
    padding: 4px 8px !important;
    min-height: 40px !important;
    transition: all 0.3s ease !important;
  }

  .ant-select-selector:hover {
    border-color: var(--color-primary-light) !important;
  }

  &.ant-select-focused .ant-select-selector {
    border-color: var(--color-primary) !important;
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1) !important;
  }

  .ant-select-selection-item {
    background: var(--color-background-soft);
    border-radius: 4px;
    margin: 2px;
    padding: 2px 8px;
  }
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
