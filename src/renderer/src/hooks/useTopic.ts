import db from '@renderer/databases'
import i18n from '@renderer/i18n'
import { deleteMessageFiles } from '@renderer/services/MessagesService'
import store from '@renderer/store'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { updateTopic } from '@renderer/store/assistants'
import { prepareTopicMessages } from '@renderer/store/messages'
import { Assistant, Topic, TopicGroup } from '@renderer/types'
import { find, isEmpty } from 'lodash'
import { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { useAssistant } from './useAssistant'
import { getStoreSetting } from './useSettings'

let _activeTopic: Topic
let _setActiveTopic: (topic: Topic) => void

export function useTopicGroups(assistantId?: string) {
  const dispatch = useAppDispatch()
  const topics = useAppSelector((state) => state.topics)

  // 确保有默认值，防止null/undefined对象遍历错误
  const groups = topics?.groups || []
  const isLoading = topics?.isLoading || false
  const loadingError = topics?.loadingError || null

  const topicGroups = assistantId ? groups.filter((group) => group.assistantId === assistantId) : groups

  const addGroup = (name: string, description?: string) => {
    const newGroup: TopicGroup = {
      id: uuid(),
      name,
      description,
      assistantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    dispatch({ type: 'topics/addGroup', payload: newGroup })
    return newGroup
  }

  const updateGroup = (group: TopicGroup) => {
    dispatch({ type: 'topics/updateGroup', payload: group })
  }

  const removeGroup = (groupId: string) => {
    dispatch({ type: 'topics/removeGroup', payload: { id: groupId } })
  }

  const updateTopicGroup = (topicId: string, groupId?: string) => {
    if (assistantId) {
      dispatch({ type: 'assistants/updateTopicGroup', payload: { assistantId, topicId, groupId } })
    }
  }

  const updateGroupsOrder = (groups: TopicGroup[]) => {
    dispatch({ type: 'topics/updateGroupsOrder', payload: groups })
  }

  return {
    groups: topicGroups,
    isLoading,
    loadingError,
    addGroup,
    updateGroup,
    removeGroup,
    updateTopicGroup,
    updateGroupsOrder
  }
}

export function useActiveTopic(_assistant: Assistant, topic?: Topic) {
  const { assistant } = useAssistant(_assistant.id)
  const [activeTopic, setActiveTopic] = useState(topic || _activeTopic || assistant?.topics[0])

  _activeTopic = activeTopic
  _setActiveTopic = setActiveTopic

  useEffect(() => {
    if (activeTopic) {
      store.dispatch(prepareTopicMessages(activeTopic))
    }
  }, [activeTopic])

  useEffect(() => {
    // activeTopic not in assistant.topics
    if (assistant && !find(assistant.topics, { id: activeTopic?.id })) {
      setActiveTopic(assistant.topics[0])
    }
  }, [activeTopic?.id, assistant])

  return { activeTopic, setActiveTopic }
}

export function useTopic(assistant: Assistant, topicId?: string) {
  return assistant?.topics.find((topic) => topic.id === topicId)
}

export function getTopic(assistant: Assistant, topicId: string) {
  return assistant?.topics.find((topic) => topic.id === topicId)
}

export async function getTopicById(topicId: string) {
  const assistants = store.getState().assistants.assistants
  const topics = assistants.map((assistant) => assistant.topics).flat()
  const topic = topics.find((topic) => topic.id === topicId)
  const messages = await TopicManager.getTopicMessages(topicId)
  return { ...topic, messages } as Topic
}

export const autoRenameTopic = async (assistant: Assistant, topicId: string) => {
  const topic = await getTopicById(topicId)
  const enableTopicNaming = getStoreSetting('enableTopicNaming')

  if (isEmpty(topic.messages)) {
    return
  }

  if (topic.isNameManuallyEdited) {
    return
  }

  if (!enableTopicNaming) {
    const topicName = topic.messages[0]?.content.substring(0, 50)
    if (topicName) {
      const data = { ...topic, name: topicName } as Topic
      _setActiveTopic(data)
      store.dispatch(updateTopic({ assistantId: assistant.id, topic: data }))
    }
    return
  }

  if (topic && topic.name === i18n.t('chat.default.topic.name') && topic.messages.length >= 2) {
    const { fetchMessagesSummary } = await import('@renderer/services/ApiService')
    const summaryText = await fetchMessagesSummary({ messages: topic.messages, assistant })
    if (summaryText) {
      const data = { ...topic, name: summaryText }
      _setActiveTopic(data)
      store.dispatch(updateTopic({ assistantId: assistant.id, topic: data }))
    }
  }
}

// Convert class to object with functions since class only has static methods
// 只有静态方法,没必要用class，可以export {}
export const TopicManager = {
  async getTopicLimit(limit: number) {
    return await db.topics
      .orderBy('updatedAt') // 按 updatedAt 排序（默认升序）
      .reverse() // 逆序（变成降序）
      .limit(limit) // 取前 10 条
      .toArray()
  },

  async getTopic(id: string) {
    return await db.topics.get(id)
  },

  async getAllTopics() {
    return await db.topics.toArray()
  },

  async getTopicMessages(id: string) {
    const topic = await TopicManager.getTopic(id)
    return topic ? topic.messages : []
  },

  async removeTopic(id: string) {
    const messages = await TopicManager.getTopicMessages(id)

    for (const message of messages) {
      await deleteMessageFiles(message)
    }

    db.topics.delete(id)
  },

  async clearTopicMessages(id: string) {
    const topic = await TopicManager.getTopic(id)

    if (topic) {
      for (const message of topic?.messages ?? []) {
        await deleteMessageFiles(message)
      }

      topic.messages = []

      await db.topics.update(id, topic)
    }
  }
}
