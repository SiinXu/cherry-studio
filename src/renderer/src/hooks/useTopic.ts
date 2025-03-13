import db from '@renderer/databases'
import i18n from '@renderer/i18n'
import { deleteMessageFiles } from '@renderer/services/MessagesService'
import store from '@renderer/store'
import { updateTopic } from '@renderer/store/assistants'
import { prepareTopicMessages } from '@renderer/store/messages'
import { Assistant, Message, Topic } from '@renderer/types'
import { find, isEmpty } from 'lodash'
import { useEffect, useState } from 'react'

import { useAssistant } from './useAssistant'
import { getStoreSetting } from './useSettings'

let _activeTopic: Topic
let _setActiveTopic: (topic: Topic) => void

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
    try {
      // 使用自定义方法生成标题
      const topicContent = topic.messages.map((m) => `${m.role}: ${m.content}`).join('\n')
      const summaryPrompt = `请给以下对话生成一个简短的主题名称（不超过20个字符）：\n${topicContent}`

      // 创建一个符合Message类型的对象
      const userMessage: Message = {
        id: `summary-${Date.now()}`,
        assistantId: assistant.id,
        topicId: topic.id,
        role: 'user',
        content: summaryPrompt,
        createdAt: new Date().toISOString(),
        status: 'success',
        type: 'text'
      }

      // 调用API获取标题
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [userMessage], assistant })
      })

      if (response.ok) {
        const summaryText = await response.text()
        if (summaryText && summaryText.length > 0) {
          const data = { ...topic, name: summaryText }
          _setActiveTopic(data)
          store.dispatch(updateTopic({ assistantId: assistant.id, topic: data }))
        }
      }
    } catch (error) {
      console.error('Error generating topic name:', error)
    }
  }
}

// 定义TopicGroup接口
interface TopicGroup {
  tag: string
  topics: Topic[]
}

// Convert class to object with functions since class only has static methods
// 只有静态方法,没必要用class，可以export {}
export function useTopicGroups(assistant: Assistant) {
  // 按标签对主题进行分组
  const groups: Record<string, Topic[]> = {}

  if (assistant?.topics && assistant?.topics.length > 0) {
    assistant.topics.forEach((topic) => {
      // 使用groupId替代tag，因为Topic类型没有tag属性
      const tag = topic.groupId || 'default'
      if (!groups[tag]) {
        groups[tag] = []
      }
      groups[tag].push(topic)
    })
  }

  // 将分组转换为TopicGroup数组
  const topicGroups: TopicGroup[] = Object.entries(groups).map(([tag, topics]) => ({
    tag,
    topics: topics.sort((a, b) => {
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      return bTime - aTime
    })
  }))

  // 按降序排列组（默认组总是在最前面）
  return topicGroups.sort((a, b) => {
    if (a.tag === 'default') return -1
    if (b.tag === 'default') return 1
    return a.tag.localeCompare(b.tag)
  })
}

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
