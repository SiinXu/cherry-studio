import { createOwlAgent, getOwlSupportedModels } from '@renderer/agents/OwlAgent'
import { useAgents } from '@renderer/hooks/useAgents'
import { useProviders } from '@renderer/hooks/useProvider'
import owlService from '@renderer/services/OwlService'
import log from 'electron-log'
import { useCallback, useEffect } from 'react'

import { EVENT_NAMES, EventEmitter } from './EventService'

/**
 * OwlAgentService 类
 * 负责初始化和管理OWL Agent在Cherry Studio中的集成
 */
class OwlAgentService {
  private initialized = false
  private owlAgentId: string | null = null

  /**
   * 初始化OWL Agent服务
   * 检查配置并将OWL Agent添加到Cherry Studio的Agent列表中
   */
  async initialize() {
    if (this.initialized) {
      return true
    }

    try {
      // 尝试初始化OWL服务
      const isOwlInitialized = await owlService.initialize()
      if (!isOwlInitialized) {
        log.info('OwlAgentService: OWL服务未初始化，无法添加OWL Agent')
        return false
      }

      // 使用事件总线注册OWL Agent初始化事件
      // 这是因为我们不能在服务类中直接使用React钩子
      EventEmitter.emit(EVENT_NAMES.OWL_AGENT_REGISTER)
      this.initialized = true
      log.info('OwlAgentService: OWL Agent服务初始化成功')
      return true
    } catch (error) {
      log.error('OwlAgentService: 初始化OWL Agent服务失败', error)
      return false
    }
  }

  /**
   * 设置当前OWL Agent的ID
   */
  setOwlAgentId(id: string) {
    this.owlAgentId = id
    log.info(`OwlAgentService: 设置OWL Agent ID为 ${id}`)
  }

  /**
   * 获取当前OWL Agent的ID
   */
  getOwlAgentId() {
    return this.owlAgentId
  }

  /**
   * 检查Agent是否为OWL Agent
   */
  isOwlAgent(agentId: string) {
    return agentId === this.owlAgentId
  }
}

const owlAgentService = new OwlAgentService()
export default owlAgentService

/**
 * 注册OWL Agent的React Hook
 * 用于在应用程序挂载时注册OWL Agent
 */
export const useOwlAgentRegistration = () => {
  const { addAgent, agents } = useAgents()
  const providers = useProviders()

  // 注册OWL Agent的回调函数
  const registerOwlAgent = useCallback(() => {
    try {
      // 检查是否已存在OWL Agent
      const existingOwlAgent = agents.find((agent) => agent.name === 'OWL 智能代理')

      if (existingOwlAgent) {
        // 如果已存在，设置ID并返回
        owlAgentService.setOwlAgentId(existingOwlAgent.id)
        log.info('OwlAgentService: 发现已存在的OWL Agent，跳过注册')
        return
      }

      // 创建新的OWL Agent
      const owlAgent = createOwlAgent()

      // 获取所有可用模型
      const allModels = Object.values(providers.providers).flatMap((provider: any) => provider.models || [])

      // 过滤出支持OWL的模型
      getOwlSupportedModels(allModels) // 结果将在其他地方使用

      // 添加OWL Agent到系统
      addAgent(owlAgent)

      // 设置OWL Agent ID
      owlAgentService.setOwlAgentId(owlAgent.id)

      log.info('OwlAgentService: OWL Agent注册成功')
    } catch (error) {
      log.error('OwlAgentService: 注册OWL Agent失败', error)
    }
  }, [agents, providers, addAgent])

  // 监听OWL Agent注册事件
  useEffect(() => {
    const handleOwlAgentRegister = () => {
      registerOwlAgent()
    }

    EventEmitter.on(EVENT_NAMES.OWL_AGENT_REGISTER, handleOwlAgentRegister)

    return () => {
      EventEmitter.off(EVENT_NAMES.OWL_AGENT_REGISTER, handleOwlAgentRegister)
    }
  }, [registerOwlAgent])

  return {
    registerOwlAgent
  }
}

// 在EventService.ts中添加OWL_AGENT_REGISTER事件
// 这里只是声明，实际添加需要修改EventService.ts文件
declare module '@renderer/services/EventService' {
  interface EventNames {
    OWL_AGENT_REGISTER: 'OWL_AGENT_REGISTER'
  }
}
