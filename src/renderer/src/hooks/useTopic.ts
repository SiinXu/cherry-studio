import db from '@renderer/databases'
import { deleteMessageFiles } from '@renderer/services/MessagesService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import store from '@renderer/store'
import { addTopicGroup, removeTopicGroup, updateTopicGroup, updateTopicGroupId } from '@renderer/store/assistants'
import { Assistant, Topic, TopicGroup } from '@renderer/types'
import { find } from 'lodash'
import { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { useAssistant } from './useAssistant'

let _activeTopic: Topic

export function useActiveTopic(_assistant: Assistant, topic?: Topic) {
  const assistantId = _assistant?.id || ''
  const { assistant } = useAssistant(assistantId)

  const hasValidTopics = assistant && Array.isArray(assistant.topics) && assistant.topics.length > 0
  const defaultTopic = topic || _activeTopic || (hasValidTopics ? assistant.topics[0] : null)

  const [activeTopic, setActiveTopic] = useState(defaultTopic)
  _activeTopic = activeTopic

  useEffect(() => {
    if (!_assistant || !_assistant.id) {
      console.error('useActiveTopic: 提供的assistant无效', _assistant)
      return
    }

    if (
      assistant &&
      Array.isArray(assistant.topics) &&
      activeTopic &&
      !find(assistant.topics, { id: activeTopic.id })
    ) {
      const firstTopic = assistant.topics[0]
      if (firstTopic) {
        console.log('切换到assistant的第一个topic', firstTopic)
        setActiveTopic(firstTopic)
      } else {
        console.error('assistant没有可用的topics', assistant)
      }
    }
  }, [activeTopic, assistant, _assistant])

  if (!_assistant || !_assistant.id) {
    return {
      activeTopic: null,
      setActiveTopic: (t: Topic) => console.error('无法设置activeTopic，assistant无效', t)
    }
  }

  return { activeTopic, setActiveTopic }
}

export function useTopic(assistant: Assistant, topicId?: string) {
  return assistant?.topics.find((topic) => topic.id === topicId)
}

export function useTopicGroups() {
  const topicGroups = useAppSelector((state) => state.assistants.topicGroups || [])
  const dispatch = useAppDispatch()

  const addGroup = (name: string, description?: string) => {
    const newGroup: TopicGroup = {
      id: uuid(),
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    dispatch(addTopicGroup(newGroup))
    return newGroup
  }

  const updateGroup = (group: TopicGroup) => {
    const updatedGroup = {
      ...group,
      updatedAt: new Date().toISOString()
    }
    dispatch(updateTopicGroup({ id: updatedGroup.id, ...updatedGroup }))
  }

  const removeGroup = (id: string) => {
    dispatch(removeTopicGroup({ id }))
  }

  const updateTopicGroupForTopic = (assistantId: string, topicId: string, groupId?: string) => {
    dispatch(updateTopicGroupId({ assistantId, topicId, groupId }))
  }

  return {
    topicGroups,
    addGroup,
    updateGroup,
    removeGroup,
    updateTopicGroup: updateTopicGroupForTopic
  }
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

export class TopicManager {
  static async getTopic(id: string) {
    return await db.topics.get(id)
  }

  static async getTopicMessages(id: string) {
    const topic = await this.getTopic(id)
    return topic ? topic.messages : []
  }

  static async removeTopic(id: string) {
    const messages = await this.getTopicMessages(id)

    for (const message of messages) {
      await deleteMessageFiles(message)
    }

    db.topics.delete(id)
  }

  static async clearTopicMessages(id: string) {
    const topic = await this.getTopic(id)

    if (topic) {
      for (const message of topic?.messages ?? []) {
        await deleteMessageFiles(message)
      }

      topic.messages = []

      await db.topics.update(id, topic)
    }
  }
}
