import db from '@renderer/databases'
import { deleteMessageFiles } from '@renderer/services/MessagesService'
import store from '@renderer/store'
import { Assistant, Topic } from '@renderer/types'
import { find } from 'lodash'
import { useEffect, useState } from 'react'

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
