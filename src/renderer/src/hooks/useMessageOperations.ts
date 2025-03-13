import { db } from '@renderer/databases'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import store, { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  clearStreamMessage,
  clearTopicMessages,
  commitStreamMessage,
  MessagesState,
  resendMessage,
  selectDisplayCount,
  selectTopicLoading,
  selectTopicMessages,
  setStreamMessage,
  setTopicLoading,
  updateMessage,
  updateMessages
} from '@renderer/store/messages'
import type { Assistant, Message, Topic } from '@renderer/types'
import { abortCompletion } from '@renderer/utils/abortController'
import { useCallback } from 'react'
/**
 * 自定义Hook，提供消息操作相关的功能
 *
 * @param topic 当前主题
 * @returns 一组消息操作方法
 */
export function useMessageOperations(topic: Topic | null | undefined) {
  const dispatch = useAppDispatch()
  const messages = useAppSelector((state) => {
    const topicId = topic?.id || ''
    return selectTopicMessages(state, topicId)
  })

  /**
   * 删除单个消息
   */
  const deleteMessage = useCallback(
    async (message: Message) => {
      const newMessages = messages.filter((m) => m.id !== message.id)
      await dispatch(updateMessages(topic, newMessages))
    },
    [dispatch, topic, messages]
  )

  /**
   * 删除一组消息（基于askId）
   */
  const deleteGroupMessages = useCallback(
    async (askId: string) => {
      const newMessages = messages.filter((m) => m.askId !== askId)
      await dispatch(updateMessages(topic, newMessages))
    },
    [dispatch, topic, messages]
  )

  /**
   * 编辑消息内容
   */
  const editMessage = useCallback(
    async (messageId: string, updates: Partial<Message>) => {
      const topicId = topic?.id || ''
      if (!topicId) return

      await dispatch(
        updateMessage({
          topicId,
          messageId,
          updates
        })
      )
      db.topics.update(topicId, {
        messages: messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m))
      })
    },
    [dispatch, messages, topic?.id]
  )

  /**
   * 重新发送消息
   */
  const resendMessageAction = useCallback(
    async (message: Message, assistant: Assistant, isMentionModel = false) => {
      return dispatch(resendMessage(message, assistant, topic, isMentionModel))
    },
    [dispatch, topic]
  )

  /**
   * 重新发送用户消息（编辑后）
   */
  const resendUserMessageWithEdit = useCallback(
    async (message: Message, editedContent: string, assistant: Assistant) => {
      // 先更新消息内容
      await editMessage(message.id, { content: editedContent })
      // 然后重新发送
      return dispatch(resendMessage({ ...message, content: editedContent }, assistant, topic))
    },
    [dispatch, editMessage, topic]
  )

  /**
   * 设置流式消息
   */
  const setStreamMessageAction = useCallback(
    (message: Message | null) => {
      const topicId = topic?.id || ''
      if (!topicId) return

      dispatch(setStreamMessage({ topicId, message }))
    },
    [dispatch, topic?.id]
  )

  /**
   * 提交流式消息
   */
  const commitStreamMessageAction = useCallback(
    (messageId: string) => {
      const topicId = topic?.id || ''
      if (!topicId) return

      dispatch(commitStreamMessage({ topicId, messageId }))
    },
    [dispatch, topic?.id]
  )

  /**
   * 清除流式消息
   */
  const clearStreamMessageAction = useCallback(
    (messageId: string) => {
      const topicId = topic?.id || ''
      if (!topicId) return

      dispatch(clearStreamMessage({ topicId, messageId }))
    },
    [dispatch, topic?.id]
  )

  /**
   * 清除会话消息
   */
  const clearTopicMessagesAction = useCallback(
    async (_topicId?: string) => {
      const topicId = _topicId || topic?.id || ''
      if (!topicId) return

      await dispatch(clearTopicMessages(topicId))
    },
    [dispatch, topic?.id]
  )

  /**
   * 更新消息数据
   */
  const updateMessagesAction = useCallback(
    async (messages: Message[]) => {
      await dispatch(updateMessages(topic, messages))
    },
    [dispatch, topic]
  )

  /**
   * 创建新的上下文（clear message）
   */
  const createNewContext = useCallback(async () => {
    EventEmitter.emit(EVENT_NAMES.NEW_CONTEXT)
  }, [])

  const loading = useAppSelector((state) => selectTopicLoading(state, topic?.id || ''))
  const displayCount = useAppSelector(selectDisplayCount)
  // /**
  //  * 获取当前消息列表
  //  */
  // const getMessages = useCallback(() => messages, [messages])

  /**
   * 暂停消息生成
   */
  const pauseMessage = useCallback(
    // 存的是用户消息的id，也就是助手消息的askId
    async (message: Message) => {
      // 1. 调用 abort
      message.askId && abortCompletion(message.askId)

      // 2. 更新消息状态
      await editMessage(message.id, { status: 'paused', content: message.content })

      // 3.更改loading状态
      dispatch(setTopicLoading({ topicId: message.topicId, loading: false }))

      // 4. 清理流式消息
      clearStreamMessageAction(message.id)
    },
    [editMessage, dispatch, clearStreamMessageAction]
  )

  const pauseMessages = useCallback(async () => {
    const topicId = topic?.id || ''
    if (!topicId) return

    // 使用类型断言获取messages状态
    const state = store.getState() as any
    if (!state || !state.messages) return
    const messagesState = state.messages as MessagesState
    const streamMessages = messagesState.streamMessagesByTopic[topicId]

    if (streamMessages) {
      // 使用类型断言确保类型安全
      const streamMessagesList = Object.values(streamMessages).filter((msg): msg is Message => {
        return msg !== null && msg !== undefined && typeof msg === 'object' && 'askId' in msg && 'id' in msg
      })
      for (const message of streamMessagesList) {
        await pauseMessage(message)
      }
    }
  }, [pauseMessage, topic?.id])

  /**
   * 恢复/重发消息
   * 暂时不需要
   */
  const resumeMessage = useCallback(
    async (message: Message, assistant: Assistant) => {
      return resendMessageAction(message, assistant)
    },
    [resendMessageAction]
  )

  return {
    messages,
    loading,
    displayCount,
    updateMessages: updateMessagesAction,
    deleteMessage,
    deleteGroupMessages,
    editMessage,
    resendMessage: resendMessageAction,
    resendUserMessageWithEdit,
    setStreamMessage: setStreamMessageAction,
    commitStreamMessage: commitStreamMessageAction,
    clearStreamMessage: clearStreamMessageAction,
    createNewContext,
    clearTopicMessages: clearTopicMessagesAction,
    pauseMessage,
    pauseMessages,
    resumeMessage
  }
}
