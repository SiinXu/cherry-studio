import {
  ClearOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  HolderOutlined,
  PlusOutlined,
  PushpinOutlined,
  QuestionCircleOutlined,
  RetweetOutlined,
  RightOutlined,
  UploadOutlined
} from '@ant-design/icons'
import type { DropResult } from '@hello-pangea/dnd'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import CopyIcon from '@renderer/components/Icons/CopyIcon'
import PromptPopup from '@renderer/components/Popups/PromptPopup'
import Scrollbar from '@renderer/components/Scrollbar'
import { isMac } from '@renderer/config/constant'
import { useAssistant, useAssistants } from '@renderer/hooks/useAssistant'
import { modelGenerating } from '@renderer/hooks/useRuntime'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAssistantGroups } from '@renderer/hooks/useAssistant'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import store from '@renderer/store'
import { addAssistant as addAssistantAction } from '@renderer/store/assistants'
import { setGenerating } from '@renderer/store/runtime'
import { Assistant, AssistantGroup } from '@renderer/types'
import { droppableReorder } from '@renderer/utils'
import { copyAssistantAsMarkdown } from '@renderer/utils/copy'
import {
  exportMarkdownToJoplin,
  exportMarkdownToSiyuan,
  exportMarkdownToYuque,
  exportAssistantAsMarkdown,
  assistantToMarkdown
} from '@renderer/utils/export'
import { safeFilter, safeMap } from '@renderer/utils/safeArrayUtils'
import { Dropdown, Form, Input, MenuProps, Modal, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { findIndex } from 'lodash'
import { FC, startTransition, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { v4 as uuid } from 'uuid'

interface Props {
  assistant: Assistant
  setAssistant: (assistant: Assistant) => void
}

const AssistantItem: FC<Props> = ({ assistant: _assistant, setAssistant }) => {
  const { assistants } = useAssistants()
  const { assistant, removeAssistant, updateAssistant, addAssistant } = useAssistant(_assistant.id)
  const { t } = useTranslation()
  const { showAssistantTime, assistantPosition, enableAssistantsGroup } = useSettings()

  const {
    groups: assistantGroups,
    addGroup,
    updateGroup,
    removeGroup,
    updateAssistantGroup,
    updateGroupsOrder
  } = useAssistantGroups()
  const [form] = Form.useForm()
  const borderRadius = showAssistantTime ? 12 : 'var(--list-item-border-radius)'
  // 分组管理状态
  const [groupModalVisible, setGroupModalVisible] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<AssistantGroup | null>(null)
  // 从localStorage获取已保存的助手分组展开状态，如果没有则默认全部展开
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    try {
      const savedState = localStorage.getItem('assistantGroups_expandedState')
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        return new Set(parsedState)
      }
    } catch (e) {
      console.error('Error loading assistant group expanded state:', e)
    }
    // 默认展开所有分组
    return new Set((assistantGroups || []).map((g) => g.id))
  })
  const [dragging, setDragging] = useState(false)
  const dropTargetRef = useRef<string | null>(null)
  const [deletingAssistantId, setDeletingAssistantId] = useState<string | null>(null)
  const deleteTimerRef = useRef<NodeJS.Timeout>(null)

  const handleGroupFormSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (currentGroup) {
        // 编辑现有分组
        updateGroup({
          ...currentGroup,
          name: values.name,
          description: values.description
        })
      } else {
        // 创建新分组
        const newGroup: AssistantGroup = {
          id: uuid(),
          name: values.name,
          description: values.description,
          assistants: []
        }
        addGroup(newGroup)
        // 默认展开新创建的分组
        setExpandedGroups((prev) => new Set([...prev, newGroup.id]))
      }
      setGroupModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('Failed to submit group form:', error)
    }
  }

  const handleCreateGroup = () => {
    setCurrentGroup(null)
    form.resetFields()
    setGroupModalVisible(true)
  }

  const handleEditGroup = (group: AssistantGroup, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡到toggle
    setCurrentGroup(group)
    form.setFieldsValue({
      name: group.name,
      description: group.description
    })
    setGroupModalVisible(true)
  }

  const handleDeleteGroup = (group: AssistantGroup) => {
    Modal.confirm({
      title: t('assistants.group.delete.title'),
      content: t('assistants.group.delete.content'),
      onOk: () => {
        removeGroup(group.id)
        // 从展开状态中移除
        setExpandedGroups((prev) => {
          const newSet = new Set(prev)
          newSet.delete(group.id)
          return newSet
        })
      }
    })
  }

  const handleDragStart = () => {
    setDragging(true)
  }

  const handleDragEnd = (result: DropResult) => {
    setDragging(false)
    dropTargetRef.current = null

    if (!result.destination) return

    const { source, destination, type } = result

    if (type === 'group') {
      // 重新排序分组
      const newGroups = Array.from(assistantGroups || [])
      const [removed] = newGroups.splice(source.index, 1)
      newGroups.splice(destination.index, 0, removed)
      updateGroupsOrder(newGroups.map((g) => g.id))
    } else if (type === 'assistant') {
      // 重新排序助手
      const sourceGroup = assistantGroups?.find((g) => g.id === source.droppableId)
      const destGroup = assistantGroups?.find((g) => g.id === destination.droppableId)

      if (!sourceGroup) return

      const sourceAssistants = Array.from(sourceGroup.assistants)
      const [movedAssistant] = sourceAssistants.splice(source.index, 1)

      if (source.droppableId === destination.droppableId) {
        // 同一分组内移动
        sourceAssistants.splice(destination.index, 0, movedAssistant)
        updateAssistantGroup(sourceGroup.id, sourceAssistants)
      } else if (destGroup) {
        // 移动到其他分组
        const destAssistants = Array.from(destGroup.assistants)
        destAssistants.splice(destination.index, 0, movedAssistant)
        updateAssistantGroup(sourceGroup.id, sourceAssistants)
        updateAssistantGroup(destGroup.id, destAssistants)
      }
    }
  }

  const handleDragUpdate = (update: any) => {
    if (update.type === 'assistant') {
      dropTargetRef.current = update.destination?.droppableId
    }
  }

  const handleCreateAssistant = () => {
    const newAssistant: Assistant = {
      id: uuid(),
      name: t('assistants.new'),
      description: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      stop: [],
      systemPrompt: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    addAssistant(newAssistant)
    setAssistant(newAssistant)
  }

  const handleDeleteAssistant = (assistant: Assistant) => {
    setDeletingAssistantId(assistant.id)
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
    }
    deleteTimerRef.current = setTimeout(() => {
      removeAssistant(assistant.id)
      setDeletingAssistantId(null)
    }, 1000)
  }

  const handleExportAssistant = async (assistant: Assistant) => {
    try {
      const markdown = await assistantToMarkdown(assistant)
      await exportAssistantAsMarkdown(markdown, assistant.name)
    } catch (error) {
      console.error('Failed to export assistant:', error)
    }
  }

  const handleExportToJoplin = async (assistant: Assistant) => {
    try {
      const markdown = await assistantToMarkdown(assistant)
      await exportMarkdownToJoplin(markdown, assistant.name)
    } catch (error) {
      console.error('Failed to export to Joplin:', error)
    }
  }

  const handleExportToYuque = async (assistant: Assistant) => {
    try {
      const markdown = await assistantToMarkdown(assistant)
      await exportMarkdownToYuque(markdown, assistant.name)
    } catch (error) {
      console.error('Failed to export to Yuque:', error)
    }
  }

  const handleExportToSiyuan = async (assistant: Assistant) => {
    try {
      const markdown = await assistantToMarkdown(assistant)
      await exportMarkdownToSiyuan(markdown, assistant.name)
    } catch (error) {
      console.error('Failed to export to Siyuan:', error)
    }
  }

  const handleCopyAssistant = async (assistant: Assistant) => {
    try {
      await copyAssistantAsMarkdown(assistant)
    } catch (error) {
      console.error('Failed to copy assistant:', error)
    }
  }

  const handleMoveToGroup = (assistant: Assistant, groupId: string) => {
    const sourceGroup = assistantGroups?.find((g) => g.assistants.some((a) => a.id === assistant.id))
    const targetGroup = assistantGroups?.find((g) => g.id === groupId)

    if (!sourceGroup || !targetGroup) return

    const sourceAssistants = sourceGroup.assistants.filter((a) => a.id !== assistant.id)
    const targetAssistants = [...targetGroup.assistants, assistant]

    updateAssistantGroup(sourceGroup.id, sourceAssistants)
    updateAssistantGroup(targetGroup.id, targetAssistants)
  }

  const renderAssistantItem = (assistant: Assistant, index: number, groupId: string) => {
    const isActive = assistant.id === _assistant.id
    const isDeleting = deletingAssistantId === assistant.id

    const menuItems: MenuProps['items'] = [
      {
        label: t('assistants.edit.title'),
        key: 'edit',
        icon: <EditOutlined />,
        onClick: () => {
          PromptPopup.show({
            title: t('assistants.edit.title'),
            content: t('assistants.edit.content'),
            initialValue: assistant.name,
            onOk: (value) => {
              updateAssistant({
                ...assistant,
                name: value
              })
            }
          })
        }
      },
      {
        label: t('assistants.copy.title'),
        key: 'copy',
        icon: <CopyIcon />,
        onClick: () => handleCopyAssistant(assistant)
      },
      {
        label: t('assistants.export.title'),
        key: 'export',
        icon: <UploadOutlined />,
        children: [
          {
            label: t('assistants.export.markdown'),
            key: 'export-markdown',
            onClick: () => handleExportAssistant(assistant)
          },
          {
            label: t('assistants.export.joplin'),
            key: 'export-joplin',
            onClick: () => handleExportToJoplin(assistant)
          },
          {
            label: t('assistants.export.yuque'),
            key: 'export-yuque',
            onClick: () => handleExportToYuque(assistant)
          },
          {
            label: t('assistants.export.siyuan'),
            key: 'export-siyuan',
            onClick: () => handleExportToSiyuan(assistant)
          }
        ]
      },
      {
        label: t('assistants.delete.title'),
        key: 'delete',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteAssistant(assistant)
      }
    ]

    if (enableAssistantsGroup && assistantGroups && assistantGroups.length > 0) {
      menuItems.splice(2, 0, {
        label: t('assistants.move_to_group'),
        key: 'move-to-group',
        icon: <FolderOpenOutlined />,
        children: [
          {
            label: t('assistants.no_group'),
            key: 'no-group',
            onClick: () => handleMoveToGroup(assistant, '')
          },
          ...assistantGroups.map((group) => ({
            label: group.name,
            key: group.id,
            onClick: () => handleMoveToGroup(assistant, group.id)
          }))
        ]
      })
    }

    return (
      <Draggable key={assistant.id} draggableId={assistant.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              opacity: snapshot.isDragging ? 0.5 : 1
            }}
          >
            <Dropdown
              menu={{ items: menuItems }}
              trigger={['contextMenu']}
              overlayStyle={{ minWidth: 200 }}
            >
              <AssistantItem
                $isActive={isActive}
                $isDeleting={isDeleting}
                onClick={() => setAssistant(assistant)}
                $borderRadius={borderRadius}
              >
                <AssistantTitle>{assistant.name}</AssistantTitle>
                {showAssistantTime && (
                  <AssistantTime>
                    {dayjs(assistant.updatedAt).format('MM-DD HH:mm')}
                  </AssistantTime>
                )}
              </AssistantItem>
            </Dropdown>
          </div>
        )}
      </Draggable>
    )
  }

  const renderGroup = (group: AssistantGroup) => {
    const isExpanded = expandedGroups.has(group.id)
    const assistants = group.assistants || []

    return (
      <GroupContainer key={group.id}>
        <GroupHeader
          onClick={() => {
            setExpandedGroups((prev) => {
              const newSet = new Set(prev)
              if (isExpanded) {
                newSet.delete(group.id)
              } else {
                newSet.add(group.id)
              }
              localStorage.setItem('assistantGroups_expandedState', JSON.stringify([...newSet]))
              return newSet
            })
          }}
        >
          <GroupTitle>
            <DownOutlined rotate={isExpanded ? 0 : -90} />
            <span>{group.name}</span>
          </GroupTitle>
          <GroupActions>
            <Tooltip title={t('assistants.group.edit.title')}>
              <EditOutlined
                onClick={(e) => handleEditGroup(group, e)}
                style={{ marginRight: 8 }}
              />
            </Tooltip>
            <Tooltip title={t('assistants.group.delete.title')}>
              <DeleteOutlined onClick={() => handleDeleteGroup(group)} />
            </Tooltip>
          </GroupActions>
        </GroupHeader>
        {isExpanded && (
          <Droppable droppableId={group.id} type="assistant">
            {(provided) => (
              <GroupContent ref={provided.innerRef} {...provided.droppableProps}>
                {assistants.map((assistant, index) => renderAssistantItem(assistant, index, group.id))}
                {provided.placeholder}
              </GroupContent>
            )}
          </Droppable>
        )}
      </GroupContainer>
    )
  }

  return (
    <Container>
      <Header>
        <Title>{t('assistants.title')}</Title>
        <Actions>
          {enableAssistantsGroup && (
            <Tooltip title={t('assistants.group.add.title')}>
              <FolderAddOutlined onClick={handleCreateGroup} />
            </Tooltip>
          )}
          <Tooltip title={t('assistants.add')}>
            <PlusOutlined onClick={handleCreateAssistant} />
          </Tooltip>
        </Actions>
      </Header>
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragUpdate={handleDragUpdate}>
        <Scrollbar>
          <Content>
            {enableAssistantsGroup && assistantGroups && assistantGroups.length > 0 ? (
              <Droppable droppableId="groups" type="group">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {assistantGroups.map((group, index) => (
                      <Draggable key={group.id} draggableId={group.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            {renderGroup(group)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ) : (
              <Droppable droppableId="ungrouped" type="assistant">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {assistants.map((assistant, index) => renderAssistantItem(assistant, index, ''))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </Content>
        </Scrollbar>
      </DragDropContext>
      <Modal
        title={currentGroup ? t('assistants.group.edit.title') : t('assistants.group.add.title')}
        open={groupModalVisible}
        onOk={handleGroupFormSubmit}
        onCancel={() => {
          setGroupModalVisible(false)
          form.resetFields()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('assistants.group.name')}
            rules={[{ required: true, message: t('assistants.group.validation.name') }]}
          >
            <Input placeholder={t('assistants.group.name.placeholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('assistants.group.description')}>
            <Input.TextArea placeholder={t('assistants.group.description.placeholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  )
}

export default AssistantItem

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--background-color);
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
`

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
  color: var(--text-color-secondary);

  .anticon {
    cursor: pointer;
    font-size: 16px;
    transition: color 0.3s;

    &:hover {
      color: var(--text-color);
    }
  }
`

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`

const GroupContainer = styled.div`
  margin-bottom: 12px;
`

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  color: var(--text-color-secondary);
  transition: color 0.3s;

  &:hover {
    color: var(--text-color);
  }
`

const GroupTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
`

const GroupActions = styled.div`
  display: flex;
  gap: 8px;

  .anticon {
    cursor: pointer;
    font-size: 14px;
    transition: color 0.3s;

    &:hover {
      color: var(--text-color);
    }
  }
`

const GroupContent = styled.div`
  padding-left: 24px;
`

const AssistantItem = styled.div<{
  $isActive: boolean
  $isDeleting: boolean
  $borderRadius: string | number
}>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 4px;
  border-radius: ${(props) => props.$borderRadius};
  background-color: ${(props) =>
    props.$isActive
      ? 'var(--primary-color)'
      : props.$isDeleting
      ? 'var(--error-color)'
      : 'transparent'};
  color: ${(props) => (props.$isActive ? '#fff' : 'var(--text-color)')};
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: ${(props) =>
      props.$isActive
        ? 'var(--primary-color)'
        : props.$isDeleting
        ? 'var(--error-color)'
        : 'var(--hover-color)'};
  }
`

const AssistantTitle = styled.div`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const AssistantTime = styled.div`
  margin-left: 8px;
  font-size: 12px;
  opacity: 0.7;
`
