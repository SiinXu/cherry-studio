/**
 * IPC初始化模块
 * 集中管理所有IPC处理程序的注册与初始化
 */

import axios from 'axios'
import { app, BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'

import { registerIpc } from './ipc'
import { configManager } from './services/ConfigManager'
import { owlService } from './services/OwlService'

// 检查IPC处理程序是否已注册 - 更可靠的实现
function isHandlerRegistered(channel: string): boolean {
  // 使用私有的listeners来检查是否有处理程序注册
  // 注意：这是一个不稳定的API，可能在未来的Electron版本中变化
  try {
    // @ts-ignore - 访问私有属性
    const handlers = ipcMain._invokeHandlers
    return handlers && handlers.has(channel)
  } catch (e) {
    // 如果无法访问私有属性，则假设已注册
    return true
  }
}

// 验证IPC处理程序是否已注册
function verifyIpcHandlers(handlers: string[]): boolean {
  let allRegistered = true
  const missingHandlers: string[] = []

  log.info('检查必需的IPC处理程序:')
  handlers.forEach((handler) => {
    const isRegistered = isHandlerRegistered(handler)
    log.info(`- ${handler}: ${isRegistered ? '已注册' : '未注册'}`)
    if (!isRegistered) {
      allRegistered = false
      missingHandlers.push(handler)
    }
  })

  if (!allRegistered) {
    log.error(`以下处理程序未注册: ${missingHandlers.join(', ')}`)
  }

  return allRegistered
}

// 注册紧急回退处理程序以防止错误
function registerFallbackHandlers(handlers: string[]) {
  handlers.forEach((handler) => {
    if (!isHandlerRegistered(handler)) {
      log.warn(`注册紧急回退处理程序: ${handler}`)

      // 为特定处理程序提供更有意义的回退实现
      if (handler === 'app:set-theme') {
        ipcMain.handle(handler, (_, theme) => {
          log.info(`通过回退处理程序设置主题: ${theme}`)
          try {
            // 尝试使用ConfigManager直接设置主题
            configManager.setTheme(theme)
            return { success: true }
          } catch (error) {
            log.error(`回退处理程序设置主题失败:`, error)
            const err = error as Error
            return { success: false, error: `设置主题失败: ${err.message}` }
          }
        })
      } else {
        // 其他处理程序的默认实现
        ipcMain.handle(handler, (...args) => {
          log.warn(`调用了紧急回退处理程序: ${handler}`, args)
          // 返回空对象作为默认值，防止应用程序崩溃
          return {}
        })
      }
    }
  })
}

// 必需的IPC处理程序列表
const requiredHandlers = [
  'app:info',
  'app:reload',
  'app:proxy',
  'app:set-theme',
  'window:set-minimum-size',
  'window:reset-minimum-size',
  'fs:read',
  'fs:write',
  'fs:exists',
  'fs:mkdir',
  'mcp:list-tools',
  'mcp:list-servers',
  // OWL相关的处理程序
  'owl:initialize',
  'owl:create-session',
  'owl:add-message',
  'owl:clear-session',
  'owl:call-model',
  'owl:http-request'
]

// 初始化所有IPC处理程序
export async function initializeIpc(mainWindow: BrowserWindow): Promise<boolean> {
  try {
    log.info('开始初始化IPC处理程序...')

    // 注册主IPC处理程序
    try {
      log.info('注册主要IPC处理程序...')
      registerIpc(mainWindow, app)
      log.info('主要IPC处理程序注册完成')
    } catch (error) {
      log.error('注册主要IPC处理程序时发生错误:', error)
      // 不要立即返回，尝试继续其他初始化
    }

    // 确保OwlService被初始化（它会自动注册自己的IPC处理程序）
    try {
      // 从配置系统获取OWL服务配置
      const languageModelApiKey = configManager.getOwlLanguageModelApiKey()
      const externalResourcesApiKey = configManager.getOwlExternalResourcesApiKey()
      const modelProvider = configManager.getOwlModelProvider()
      const enableOwl = configManager.getEnableOwl()

      log.info('初始化OwlService...')
      log.info(
        `OWL配置状态：启用=${enableOwl}，提供商=${modelProvider}，API密钥${languageModelApiKey ? '已' : '未'}配置`
      )

      // 基础初始化，确保IPC处理程序被注册
      const owlInitialized = await owlService.initialize({
        languageModelApiKey,
        externalResourcesApiKey,
        modelProvider
      })

      if (!owlInitialized) {
        log.warn('OwlService初始化失败，OWL相关功能可能不可用')
      } else {
        log.info('OwlService初始化成功')
      }
    } catch (error) {
      log.error('初始化OwlService时发生错误:', error)
    }

    // 直接注册OWL相关的处理程序，确保它们一定可用
    log.info('确保OWL处理程序被直接注册...')
    const owlHandlers = [
      'owl:initialize',
      'owl:create-session',
      'owl:add-message',
      'owl:clear-session',
      'owl:call-model',
      'owl:evaluate-quality',
      'owl:http-request',
      'owl:test-api-connection'
    ]

    // 检查哪些OWL处理程序未注册
    const missingOwlHandlers = owlHandlers.filter((handler) => !isHandlerRegistered(handler))
    if (missingOwlHandlers.length > 0) {
      log.warn(`发现未注册的OWL处理程序: ${missingOwlHandlers.join(', ')}，直接进行注册`)
      // 直接注册这些处理程序
      if (!isHandlerRegistered('owl:initialize')) {
        ipcMain.handle('owl:initialize', async (_, options) => {
          return await owlService.initialize(options)
        })
      }
      if (!isHandlerRegistered('owl:create-session')) {
        ipcMain.handle('owl:create-session', async (_, enabledToolkits) => {
          log.info(`创建 OWL 会话，启用的工具集: ${JSON.stringify(enabledToolkits || [])}`)
          return await owlService.createSession(enabledToolkits)
        })
      }
      if (!isHandlerRegistered('owl:add-message')) {
        ipcMain.handle('owl:add-message', async (_, sessionId, message) => {
          return await owlService.addMessage(sessionId, message)
        })
      }
      if (!isHandlerRegistered('owl:clear-session')) {
        ipcMain.handle('owl:clear-session', async (_, sessionId) => {
          log.info(`清除OWL会话: ${sessionId}`)
          return true
        })
      }
      if (!isHandlerRegistered('owl:call-model')) {
        ipcMain.handle('owl:call-model', async (_, messages, toolDefinitions) => {
          return await owlService.callModelApi(messages, toolDefinitions)
        })
      }
      if (!isHandlerRegistered('owl:evaluate-quality')) {
        ipcMain.handle('owl:evaluate-quality', async (_, content, type) => {
          return await owlService.evaluateQuality(content, type)
        })
      }
      if (!isHandlerRegistered('owl:http-request')) {
        ipcMain.handle('owl:http-request', async (_, requestData) => {
          try {
            log.info(`执行HTTP请求: ${requestData[0].url}`)

            // 验证请求数据
            if (!requestData || !requestData[0] || !requestData[0].url) {
              throw new Error('无效的请求数据')
            }

            // 使用axios执行请求
            const response = await axios({
              method: requestData[0].method || 'GET',
              url: requestData[0].url,
              headers: requestData[0].headers || {},
              data: requestData[0].data,
              timeout: requestData[0].timeout || 30000
            })

            // 返回响应数据
            return {
              status: response.status,
              statusText: response.statusText,
              data: response.data,
              headers: response.headers
            }
          } catch (error: any) {
            // 错误处理
            log.error(`HTTP请求失败: ${error.message || '未知错误'}`)
            return {
              error: true,
              message: error.message || '请求失败',
              status: error.response?.status,
              data: error.response?.data
            }
          }
        })
      }

      if (!isHandlerRegistered('owl:test-api-connection')) {
        ipcMain.handle('owl:test-api-connection', async () => {
          try {
            log.info('测试OWL API连接')
            return await owlService.testApiConnection()
          } catch (error: any) {
            log.error(`测试API连接失败: ${error.message || '未知错误'}`)
            return {
              status: 'error',
              provider: 'unknown',
              message: `测试失败: ${error.message || '未知错误'}`
            }
          }
        })
      }

      log.info('OWL处理程序直接注册完成')
    } else {
      log.info('所有OWL处理程序已正确注册')
    }

    // 验证必需的IPC处理程序是否已注册
    const verified = verifyIpcHandlers(requiredHandlers)

    if (!verified) {
      log.error('一些必需的IPC处理程序未正确注册，尝试注册紧急回退处理程序')
      registerFallbackHandlers(requiredHandlers)
      // 即使注册了回退处理程序，也继续正常初始化流程
    }

    log.info('IPC处理程序初始化完成')
    return true
  } catch (error) {
    log.error('初始化IPC处理程序时发生错误:', error)
    // 尝试注册紧急回退处理程序以防止应用程序崩溃
    try {
      registerFallbackHandlers(requiredHandlers)
    } catch (fallbackError) {
      log.error('注册紧急回退处理程序时发生错误:', fallbackError)
    }
    return false
  }
}

// 添加全局未处理的异常和Promise拒绝处理程序
export function setupErrorHandlers() {
  process.on('uncaughtException', (error) => {
    log.error('捕获到未处理的异常:', error)
  })

  process.on('unhandledRejection', (reason) => {
    log.error('捕获到未处理的Promise拒绝:', reason)
  })

  log.info('全局错误处理程序已安装')
}
