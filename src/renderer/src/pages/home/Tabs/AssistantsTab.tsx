import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  FolderAddOutlined,
  HolderOutlined,
  LoadingOutlined,
  PlusOutlined,
  RightOutlined
} from '@ant-design/icons'
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import { useAgents } from '@renderer/hooks/useAgents'
import { useAssistants } from '@renderer/hooks/useAssistant'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAppSelector } from '@renderer/store'
import { Assistant, AssistantGroup } from '@renderer/types'
import { droppableReorder } from '@renderer/utils'
import { Alert, Form, Input, Modal, Spin } from 'antd'
import { FC, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { v4 as uuid } from 'uuid'

import AssistantItem from './AssistantItem'

interface AssistantsTabProps {
  activeAssistant: Assistant
  setActiveAssistant: (assistant: Assistant) => void
  onCreateAssistant: () => void
  onCreateDefaultAssistant: () => void
}

// 自定义 safeFilter 和 safeMap 函数实现，避免import错误
function safeFilter<T>(arr: T[] | null | undefined, predicate: (value: T, index: number, array: T[]) => boolean): T[] {
  if (!Array.isArray(arr)) return []
  return arr.filter(predicate)
}

function safeMap<T, U>(arr: T[] | null | undefined, callback: (value: T, index: number, array: T[]) => U): U[] {
  if (!Array.isArray(arr)) return []
  return arr.map(callback)
}

const Assistants: FC<AssistantsTabProps> = ({
  activeAssistant,
  setActiveAssistant,
  onCreateAssistant,
  onCreateDefaultAssistant
}) => {
  const {
    assistants,
    addGroup,
    updateGroup,
    removeGroup,
    updateAssistantGroup,
    addAssistant,
    removeAssistant,
    updateGroupsOrder
  } = useAssistants()
  const { groups, isLoading, loadingError } = useAppSelector((state) => state.assistants) // 直接从store获取状态
  const { enableAssistantGroup } = useSettings()
  const { addAgent } = useAgents()
  const [form] = Form.useForm()
  const [groupModalVisible, setGroupModalVisible] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<AssistantGroup | null>(null)
  // 从localStorage获取已保存的分组展开状态，如果没有则默认全部展开
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    try {
      const savedState = localStorage.getItem('assistantGroups_expandedState')
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        return new Set(parsedState)
      }
    } catch (e) {
      console.error('Error loading group expanded state:', e)
    }
    return new Set(safeMap(groups, (g) => g.id)) // 默认展开所有分组
  })
  const [dragging, setDragging] = useState(false)
  const dropTargetRef = useRef<string | null>(null)
  const { t } = useTranslation()

  // 错误处理和数据加载检查
  useEffect(() => {
    if (loadingError) {
      console.error('加载助手数据时出错:', loadingError)
      // 可以在这里添加错误通知或重试逻辑
    }
  }, [loadingError])

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

  const handleDeleteGroup = (groupId: string) => {
    window.modal.confirm({
      title: t('assistants.group.delete.title'),
      content: t('assistants.group.delete.content'),
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => {
        removeGroup(groupId)
      }
    })
  }

  const handleGroupSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (currentGroup) {
        // 编辑分组
        updateGroup({
          ...currentGroup,
          name: values.name,
          description: values.description
        })
      } else {
        // 创建分组
        addGroup({
          id: uuid(),
          name: values.name,
          description: values.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
      setGroupModalVisible(false)
    } catch (error) {
      console.error('Validate failed:', error)
    }
  }

  // 切换分组的展开/折叠状态
  const toggleGroupExpanded = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡
    let newExpandedGroups: Set<string>
    if (expandedGroups.has(groupId)) {
      const newSet = new Set(expandedGroups)
      newSet.delete(groupId)
      newExpandedGroups = newSet
    } else {
      newExpandedGroups = new Set([...expandedGroups, groupId])
    }
    // 设置新状态
    setExpandedGroups(newExpandedGroups)
    // 保存到localStorage
    try {
      localStorage.setItem('assistantGroups_expandedState', JSON.stringify(Array.from(newExpandedGroups)))
    } catch (e) {
      console.error('Error saving group expanded state:', e)
    }
  }

  // 根据配置决定是否使用分组
  const ungroupedAssistants = enableAssistantGroup ? safeFilter(assistants, (a) => !a.groupId) : []

  // 处理将助手拖入分组
  const handleAssistantDragStart = (e: React.DragEvent, assistantId: string) => {
    setDragging(true)
    e.dataTransfer.setData('assistantId', assistantId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleAssistantDragEnd = () => {
    setDragging(false)
    dropTargetRef.current = null
  }

  const handleAssistantDragOver = (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    dropTargetRef.current = groupId !== null ? groupId : null
  }

  const handleAssistantDragLeave = () => {
    dropTargetRef.current = null
  }

  const handleAssistantDrop = (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault()
    const assistantId = e.dataTransfer.getData('assistantId')
    if (assistantId) {
      // 传递正确的参数格式给Redux action，null值表示移到未分组区域
      updateAssistantGroup(assistantId, groupId || undefined)
    }
    setDragging(false)
    dropTargetRef.current = null
  }

  // 处理分组拖拽结束事件
  const handleGroupDragEnd = (result: DropResult) => {
    setDragging(false)
    const { source, destination } = result

    // 如果没有目标位置或拖拽到相同位置，则不执行任何操作
    if (!destination || (source.index === destination.index && source.droppableId === destination.droppableId)) {
      return
    }

    // 使用droppableReorder工具函数重新排序分组
    const reorderedGroups = droppableReorder<AssistantGroup>([...groups], source.index, destination.index)

    // 更新Redux中的分组顺序
    updateGroupsOrder(reorderedGroups)

    // 可以选择性地存储分组顺序到localStorage
    try {
      localStorage.setItem('assistantGroups_order', JSON.stringify(reorderedGroups.map((g) => g.id)))
    } catch (e) {
      console.error('Error saving group order:', e)
    }
  }

  // 渲染一个分组
  const renderGroup = (group: AssistantGroup, index: number) => {
    const groupAssistants = safeFilter(assistants, (a) => a.groupId === group.id)
    const isExpanded = expandedGroups.has(group.id)

    return (
      <Draggable key={group.id} draggableId={group.id} index={index}>
        {(provided) => (
          <GroupContainer
            {...provided.draggableProps}
            ref={provided.innerRef}
            data-groupid={group.id}
            onDragOver={(e) => handleAssistantDragOver(e, group.id)}
            onDragLeave={handleAssistantDragLeave}
            onDrop={(e) => handleAssistantDrop(e, group.id)}
            className={dropTargetRef.current === group.id ? 'drag-over' : ''}
            isDragging={dragging}>
            <GroupHeader className="group-header-style">
              <div onClick={(e) => toggleGroupExpanded(group.id, e)} style={{ display: 'flex', flex: 1 }}>
                <GroupTitle>
                  <GroupIcon>{isExpanded ? <DownOutlined /> : <RightOutlined />}</GroupIcon>
                  <div>{group.name}</div>
                  <GroupCount>{groupAssistants.length}</GroupCount>
                </GroupTitle>
              </div>
              <GroupActions className="group-actions">
                <span {...provided.dragHandleProps} className="drag-handle">
                  <HolderOutlined />
                </span>
                <EditOutlined onClick={(e) => handleEditGroup(group, e)} />
                <DeleteOutlined
                  className="delete-icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteGroup(group.id)
                  }}
                />
              </GroupActions>
            </GroupHeader>
            <GroupContent className={isExpanded ? 'expanded' : 'collapsed'} isEmpty={groupAssistants.length === 0}>
              {safeMap(groupAssistants, (assistant) => (
                <div
                  key={assistant.id}
                  draggable
                  onDragStart={(e) => handleAssistantDragStart(e, assistant.id)}
                  onDragEnd={handleAssistantDragEnd}>
                  <AssistantItem
                    key={assistant.id}
                    assistant={assistant}
                    isActive={assistant.id === activeAssistant.id}
                    onSwitch={setActiveAssistant}
                    onDelete={(assistant) => {
                      const remaining = assistants.filter((a) => a.id !== assistant.id)
                      if (assistant.id === activeAssistant?.id) {
                        const newActive = remaining[remaining.length - 1]
                        newActive ? setActiveAssistant(newActive) : onCreateDefaultAssistant()
                      }
                      removeAssistant(assistant.id)
                    }}
                    addAgent={addAgent}
                    addAssistant={addAssistant}
                    onCreateDefaultAssistant={onCreateDefaultAssistant}
                  />
                </div>
              ))}
            </GroupContent>
          </GroupContainer>
        )}
      </Draggable>
    )
  }

  return (
    <Container>
      {loadingError ? (
        <Alert
          message={t('assistants.load.error')}
          description={loadingError?.message || String(loadingError)}
          type="error"
          showIcon
        />
      ) : isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <div style={{ marginTop: '10px' }}>{t('assistants.loading')}</div>
        </div>
      ) : (
        <>
          {/* 添加助手按钮 */}
          <ActionButtons>
            {!dragging && (
              <>
                {enableAssistantGroup ? (
                  <>
                    <CreateButton type="button" className="add-assistant-btn" onClick={onCreateAssistant}>
                      <PlusOutlined />
                      {t('chat.add.assistant.title')}
                    </CreateButton>
                    <GroupCreateButton type="button" className="add-group-btn" onClick={handleCreateGroup}>
                      <FolderAddOutlined />
                      {t('assistants.group.add')}
                    </GroupCreateButton>
                  </>
                ) : (
                  <AssistantAddItem onClick={onCreateAssistant} style={{ width: '100%' }}>
                    <AssistantName>
                      <PlusOutlined style={{ color: 'var(--color-text-2)', marginRight: 4 }} />
                      {t('chat.add.assistant.title')}
                    </AssistantName>
                  </AssistantAddItem>
                )}
              </>
            )}
          </ActionButtons>

          {enableAssistantGroup ? (
            // 启用分组时的显示方式
            <>
              {/* 未分组的助手 */}
              <UngroupedSection
                onDragOver={(e) => handleAssistantDragOver(e, null)}
                onDragLeave={handleAssistantDragLeave}
                onDrop={(e) => handleAssistantDrop(e, null)}
                className={dropTargetRef.current === null ? 'drag-over' : ''}
                $enableGroup={enableAssistantGroup}>
                <p className="section-title">{t('assistants.ungrouped')}</p>
                {safeMap(ungroupedAssistants, (assistant) => (
                  <div
                    key={assistant.id}
                    draggable="true"
                    onDragStart={(e) => handleAssistantDragStart(e, assistant.id)}
                    onDragEnd={handleAssistantDragEnd}
                    className="assistant-item-wrapper">
                    <AssistantItem
                      key={assistant.id}
                      assistant={assistant}
                      isActive={assistant.id === activeAssistant.id}
                      onSwitch={setActiveAssistant}
                      onDelete={(assistant) => {
                        const remaining = assistants.filter((a) => a.id !== assistant.id)
                        if (assistant.id === activeAssistant?.id) {
                          const newActive = remaining[remaining.length - 1]
                          newActive ? setActiveAssistant(newActive) : onCreateDefaultAssistant()
                        }
                        removeAssistant(assistant.id)
                      }}
                      addAgent={addAgent}
                      addAssistant={addAssistant}
                      onCreateDefaultAssistant={onCreateDefaultAssistant}
                      onMoveToGroup={updateAssistantGroup}
                      groups={groups}
                    />
                  </div>
                ))}
              </UngroupedSection>

              {/* 分割线 - 当分组展示时 */}
              {ungroupedAssistants.length > 0 && groups.length > 0 && <SectionDivider />}

              {/* 分组区域 - 可拖拽排序 */}
              <DragDropContext onDragEnd={handleGroupDragEnd}>
                <Droppable droppableId="groups-droppable">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="groups-container">
                      {safeMap(groups, (group, index) => renderGroup(group, index))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </>
          ) : (
            // 未启用分组时的原始显示方式
            <UngroupedSection $enableGroup={enableAssistantGroup}>
              {safeMap(assistants, (assistant) => (
                <div key={assistant.id} className="assistant-item-wrapper">
                  <AssistantItem
                    assistant={assistant}
                    isActive={assistant.id === activeAssistant.id}
                    onSwitch={setActiveAssistant}
                    onDelete={(assistant) => {
                      const remaining = assistants.filter((a) => a.id !== assistant.id)
                      if (assistant.id === activeAssistant?.id) {
                        const newActive = remaining[remaining.length - 1]
                        newActive ? setActiveAssistant(newActive) : onCreateDefaultAssistant()
                      }
                      removeAssistant(assistant.id)
                    }}
                    addAgent={addAgent}
                    addAssistant={addAssistant}
                    onCreateDefaultAssistant={onCreateDefaultAssistant}
                  />
                </div>
              ))}
            </UngroupedSection>
          )}

          {/* 创建/编辑分组模态框 */}
          <Modal
            title={currentGroup ? t('assistants.group.edit.title') : t('assistants.group.add.title')}
            open={groupModalVisible}
            onOk={handleGroupSubmit}
            onCancel={() => setGroupModalVisible(false)}
            destroyOnClose>
            <Form form={form} layout="vertical">
              <Form.Item
                name="name"
                label={t('assistants.group.name')}
                rules={[
                  {
                    required: true,
                    message: t('assistants.group.name.required')
                  }
                ]}>
                <Input placeholder={t('assistants.group.name.placeholder')} />
              </Form.Item>
              <Form.Item name="description" label={t('assistants.group.description')}>
                <Input.TextArea placeholder={t('assistants.group.description.placeholder')} rows={3} />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </Container>
  )
}

export default Assistants

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 11px;
  user-select: none;
  height: 100%;
  overflow-y: auto;
  padding: 0 16px 16px;
  box-sizing: border-box;

  .assistant-item-wrapper[draggable='true'] {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  /* 解决拖拽时的白边问题 */
  [draggable] {
    -webkit-user-drag: element;
    user-select: none;
  }
`

const UngroupedSection = styled.div<{ $enableGroup: boolean }>`
  padding: 8px;
  border-radius: 8px;
  min-height: 60px;
  overflow-y: auto;
  max-height: ${(props) => (props.$enableGroup ? '300px' : 'none')};

  .section-title {
    font-size: 13px;
    color: var(--color-text-3);
    margin: 5px 8px;
    padding-left: 8px;
  }

  &.drag-over {
    background-color: var(--color-bg-3);
  }

  .assistant-item-wrapper[draggable='true'] {
    cursor: grab;
    &:active {
      cursor: grabbing;
    }
  }
`

const SectionDivider = styled.div`
  height: 1px;
  background-color: var(--color-border);
  margin: 8px 0;
`

const GroupsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const GroupContainer = styled.div<{ isDragging?: boolean }>`
  margin-bottom: 16px;
  background-color: var(--color-bg-1);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  opacity: ${(props) => (props.isDragging ? 0.5 : 1)};
  box-shadow: ${(props) => (props.isDragging ? '0 5px 10px rgba(0, 0, 0, 0.1)' : 'none')};
  transition:
    opacity 0.2s,
    box-shadow 0.2s;
`

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-2);
  position: relative;
`

const GroupTitle = styled.div`
  flex: 1;
  font-weight: 500;
  display: flex;
  align-items: center;
  color: var(--color-text-1);
`

const GroupIcon = styled.span`
  margin-right: 8px;
  font-size: 16px;
  color: var(--color-text-3);
`

const GroupCount = styled.span`
  margin-left: 8px;
  color: var(--color-text-3);
  font-size: 12px;
  font-weight: normal;
`

const GroupActions = styled.div`
  display: flex;
  gap: 8px;

  .anticon {
    font-size: 16px;
    color: var(--color-text-3);
    cursor: pointer;

    &:hover {
      color: var(--color-primary);
    }
  }
`

const GroupContent = styled.div<{ isEmpty?: boolean }>`
  padding: ${(props) => (props.isEmpty ? '12px 16px' : '12px 0')};
  color: ${(props) => (props.isEmpty ? 'var(--color-text-3)' : 'inherit')};
`

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  width: 100%;
`

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: var(--color-bg-2);
  border: 1px dashed var(--color-border);
  color: var(--color-text-2);
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background-color: var(--color-primary-bg);
  }
`

const GroupCreateButton = styled(CreateButton)`
  border-style: dashed;
`

const AssistantAddItem = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px dashed var(--color-border);
  background-color: var(--color-bg-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    background-color: var(--color-primary-bg);
  }
`

const AssistantName = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--color-text-2);
`
