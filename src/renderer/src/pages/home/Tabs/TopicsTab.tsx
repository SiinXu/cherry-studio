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
import { useTopicGroups } from '@renderer/hooks/useTopic'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import store from '@renderer/store'
import { addTopic as addTopicAction } from '@renderer/store/assistants'
import { setGenerating } from '@renderer/store/runtime'
import { Assistant, Topic, TopicGroup } from '@renderer/types'
import { droppableReorder } from '@renderer/utils'
import { copyTopicAsMarkdown } from '@renderer/utils/copy'
import {
  exportMarkdownToJoplin,
  exportMarkdownToSiyuan,
  exportMarkdownToYuque,
  exportTopicAsMarkdown,
  topicToMarkdown
} from '@renderer/utils/export'
import { safeFilter, safeMap } from '@renderer/utils/safeArrayUtils'
import { hasTopicPendingRequests } from '@renderer/utils/queue'
import { Dropdown, Form, Input, MenuProps, Modal, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { findIndex } from 'lodash'
import { FC, startTransition, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { v4 as uuid } from 'uuid'

interface Props {
  assistant: Assistant
  activeTopic: Topic
  setActiveTopic: (topic: Topic) => void
}

const Topics: FC<Props> = ({ assistant: _assistant, activeTopic, setActiveTopic }) => {
  const { assistants } = useAssistants()
  const { assistant, removeTopic, updateTopic, addTopic } = useAssistant(_assistant.id)
  const { t } = useTranslation()
  const { showTopicTime, topicPosition, enableTopicsGroup } = useSettings()

  // 定义判断主题是否处于等待状态的函数
  const isPending = (topicId: string) => hasTopicPendingRequests(topicId)
  const {
    groups: topicGroups,
    addGroup,
    updateGroup,
    removeGroup,
    updateTopicGroup,
    updateGroupsOrder
  } = useTopicGroups(_assistant.id)
  const [form] = Form.useForm()
  const borderRadius = showTopicTime ? 12 : 'var(--list-item-border-radius)'
  // 分组管理状态
  const [groupModalVisible, setGroupModalVisible] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<TopicGroup | null>(null)
  // 从localStorage获取已保存的话题分组展开状态，如果没有则默认全部展开
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    try {
      const savedState = localStorage.getItem('topicGroups_expandedState')
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        return new Set(parsedState)
      }
    } catch (e) {
      console.error('Error loading topic group expanded state:', e)
    }
    // 默认展开所有分组
    return new Set((topicGroups || []).map((g) => g.id))
  })
  const [dragging, setDragging] = useState(false)
  const dropTargetRef = useRef<string | null>(null)
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null)
  const deleteTimerRef = useRef<NodeJS.Timeout>(null)

  const pendingTopics = useMemo(() => {
    return new Set<string>()
  }, [])

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
        const newGroup: TopicGroup = {
          id: uuid(),
          name: values.name,
          description: values.description,
          topics: []
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

  const handleEditGroup = (group: TopicGroup, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡到toggle
    setCurrentGroup(group)
    form.setFieldsValue({
      name: group.name,
      description: group.description
    })
    setGroupModalVisible(true)
  }

  const handleDeleteGroup = (group: TopicGroup) => {
    Modal.confirm({
      title: t('topics.group.delete.title'),
      content: t('topics.group.delete.content'),
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
      const newGroups = Array.from(topicGroups || [])
      const [removed] = newGroups.splice(source.index, 1)
      newGroups.splice(destination.index, 0, removed)
      updateGroupsOrder(newGroups.map((g) => g.id))
    } else if (type === 'topic') {
      // 重新排序话题
      const sourceGroup = topicGroups?.find((g) => g.id === source.droppableId)
      const destGroup = topicGroups?.find((g) => g.id === destination.droppableId)

      if (!sourceGroup) return

      const sourceTopics = Array.from(sourceGroup.topics)
      const [movedTopic] = sourceTopics.splice(source.index, 1)

      if (source.droppableId === destination.droppableId) {
        // 同一分组内移动
        sourceTopics.splice(destination.index, 0, movedTopic)
        updateTopicGroup(sourceGroup.id, sourceTopics)
      } else if (destGroup) {
        // 移动到其他分组
        const destTopics = Array.from(destGroup.topics)
        destTopics.splice(destination.index, 0, movedTopic)
        updateTopicGroup(sourceGroup.id, sourceTopics)
        updateTopicGroup(destGroup.id, destTopics)
      }
    }
  }

  const handleDragUpdate = (update: any) => {
    if (update.type === 'topic') {
      dropTargetRef.current = update.destination?.droppableId
    }
  }

  const handleCreateTopic = () => {
    const newTopic: Topic = {
      id: uuid(),
      title: t('topics.new'),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    addTopic(newTopic)
    setActiveTopic(newTopic)
  }

  const handleDeleteTopic = (topic: Topic) => {
    if (isPending(topic.id)) {
      Modal.warning({
        title: t('topics.delete.pending.title'),
        content: t('topics.delete.pending.content'),
        okText: t('common.ok')
      })
      return
    }

    setDeletingTopicId(topic.id)
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
    }
    deleteTimerRef.current = setTimeout(() => {
      removeTopic(topic.id)
      setDeletingTopicId(null)
    }, 1000)
  }

  const handleExportTopic = async (topic: Topic) => {
    try {
      const markdown = await topicToMarkdown(topic)
      await exportTopicAsMarkdown(markdown, topic.title)
    } catch (error) {
      console.error('Failed to export topic:', error)
    }
  }

  const handleExportToJoplin = async (topic: Topic) => {
    try {
      const markdown = await topicToMarkdown(topic)
      await exportMarkdownToJoplin(markdown, topic.title)
    } catch (error) {
      console.error('Failed to export to Joplin:', error)
    }
  }

  const handleExportToYuque = async (topic: Topic) => {
    try {
      const markdown = await topicToMarkdown(topic)
      await exportMarkdownToYuque(markdown, topic.title)
    } catch (error) {
      console.error('Failed to export to Yuque:', error)
    }
  }

  const handleExportToSiyuan = async (topic: Topic) => {
    try {
      const markdown = await topicToMarkdown(topic)
      await exportMarkdownToSiyuan(markdown, topic.title)
    } catch (error) {
      console.error('Failed to export to Siyuan:', error)
    }
  }

  const handleCopyTopic = async (topic: Topic) => {
    try {
      await copyTopicAsMarkdown(topic)
    } catch (error) {
      console.error('Failed to copy topic:', error)
    }
  }

  const handleMoveToGroup = (topic: Topic, groupId: string) => {
    const sourceGroup = topicGroups?.find((g) => g.topics.some((t) => t.id === topic.id))
    const targetGroup = topicGroups?.find((g) => g.id === groupId)

    if (!sourceGroup || !targetGroup) return

    const sourceTopics = sourceGroup.topics.filter((t) => t.id !== topic.id)
    const targetTopics = [...targetGroup.topics, topic]

    updateTopicGroup(sourceGroup.id, sourceTopics)
    updateTopicGroup(targetGroup.id, targetTopics)
  }

  const renderTopicItem = (topic: Topic, index: number, groupId: string) => {
    const isActive = activeTopic.id === topic.id
    const isPending = pendingTopics.has(topic.id)
    const isDeleting = deletingTopicId === topic.id

    const menuItems: MenuProps['items'] = [
      {
        label: t('topics.edit.title'),
        key: 'edit',
        icon: <EditOutlined />,
        onClick: () => {
          PromptPopup.show({
            title: t('topics.edit.title'),
            content: t('topics.edit.content'),
            initialValue: topic.title,
            onOk: (value) => {
              updateTopic({
                ...topic,
                title: value
              })
            }
          })
        }
      },
      {
        label: t('topics.copy.title'),
        key: 'copy',
        icon: <CopyIcon />,
        onClick: () => handleCopyTopic(topic)
      },
      {
        label: t('topics.export.title'),
        key: 'export',
        icon: <UploadOutlined />,
        children: [
          {
            label: t('topics.export.markdown'),
            key: 'export-markdown',
            onClick: () => handleExportTopic(topic)
          },
          {
            label: t('topics.export.joplin'),
            key: 'export-joplin',
            onClick: () => handleExportToJoplin(topic)
          },
          {
            label: t('topics.export.yuque'),
            key: 'export-yuque',
            onClick: () => handleExportToYuque(topic)
          },
          {
            label: t('topics.export.siyuan'),
            key: 'export-siyuan',
            onClick: () => handleExportToSiyuan(topic)
          }
        ]
      },
      {
        label: t('topics.delete.title'),
        key: 'delete',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteTopic(topic)
      }
    ]

    if (enableTopicsGroup && topicGroups && topicGroups.length > 0) {
      menuItems.splice(2, 0, {
        label: t('topics.move_to_group'),
        key: 'move-to-group',
        icon: <FolderOpenOutlined />,
        children: [
          {
            label: t('topics.no_group'),
            key: 'no-group',
            onClick: () => handleMoveToGroup(topic, '')
          },
          ...topicGroups.map((group) => ({
            label: group.name,
            key: group.id,
            onClick: () => handleMoveToGroup(topic, group.id)
          }))
        ]
      })
    }

    return (
      <Draggable key={topic.id} draggableId={topic.id} index={index}>
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
              <TopicItem
                $isActive={isActive}
                $isPending={isPending}
                $isDeleting={isDeleting}
                onClick={() => setActiveTopic(topic)}
                $borderRadius={borderRadius}
              >
                <TopicTitle>{topic.title}</TopicTitle>
                {showTopicTime && (
                  <TopicTime>
                    {dayjs(topic.updatedAt).format('MM-DD HH:mm')}
                  </TopicTime>
                )}
              </TopicItem>
            </Dropdown>
          </div>
        )}
      </Draggable>
    )
  }

  const renderGroup = (group: TopicGroup) => {
    const isExpanded = expandedGroups.has(group.id)
    const topics = group.topics || []

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
              localStorage.setItem('topicGroups_expandedState', JSON.stringify([...newSet]))
              return newSet
            })
          }}
        >
          <GroupTitle>
            <DownOutlined rotate={isExpanded ? 0 : -90} />
            <span>{group.name}</span>
          </GroupTitle>
          <GroupActions>
            <Tooltip title={t('topics.group.edit.title')}>
              <EditOutlined
                onClick={(e) => handleEditGroup(group, e)}
                style={{ marginRight: 8 }}
              />
            </Tooltip>
            <Tooltip title={t('topics.group.delete.title')}>
              <DeleteOutlined onClick={() => handleDeleteGroup(group)} />
            </Tooltip>
          </GroupActions>
        </GroupHeader>
        {isExpanded && (
          <Droppable droppableId={group.id} type="topic">
            {(provided) => (
              <GroupContent ref={provided.innerRef} {...provided.droppableProps}>
                {topics.map((topic, index) => renderTopicItem(topic, index, group.id))}
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
        <Title>{t('topics.title')}</Title>
        <Actions>
          {enableTopicsGroup && (
            <Tooltip title={t('topics.group.add.title')}>
              <FolderAddOutlined onClick={handleCreateGroup} />
            </Tooltip>
          )}
          <Tooltip title={t('topics.add')}>
            <PlusOutlined onClick={handleCreateTopic} />
          </Tooltip>
        </Actions>
      </Header>
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragUpdate={handleDragUpdate}>
        <Scrollbar>
          <Content>
            {enableTopicsGroup && topicGroups && topicGroups.length > 0 ? (
              <Droppable droppableId="groups" type="group">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {topicGroups.map((group, index) => (
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
              <Droppable droppableId="ungrouped" type="topic">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {assistant.topics.map((topic, index) => renderTopicItem(topic, index, ''))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </Content>
        </Scrollbar>
      </DragDropContext>
      <Modal
        title={currentGroup ? t('topics.group.edit.title') : t('topics.group.add.title')}
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
            label={t('topics.group.name')}
            rules={[{ required: true, message: t('topics.group.validation.name') }]}
          >
            <Input placeholder={t('topics.group.name.placeholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('topics.group.description')}>
            <Input.TextArea placeholder={t('topics.group.description.placeholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  )
}

export default Topics

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

const TopicItem = styled.div<{
  $isActive: boolean
  $isPending: boolean
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
      : props.$isPending
      ? 'var(--warning-color)'
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
        : props.$isPending
        ? 'var(--warning-color)'
        : props.$isDeleting
        ? 'var(--error-color)'
        : 'var(--hover-color)'};
  }
`

const TopicTitle = styled.div`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const TopicTime = styled.div`
  margin-left: 8px;
  font-size: 12px;
  opacity: 0.7;
`
