import { electronApp, optimizer } from '@electron-toolkit/utils'
import { replaceDevtoolsFont } from '@main/utils/windowUtil'
import { app, session } from 'electron'
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer'
import log from 'electron-log'

// 导入新的IPC初始化模块
import { initializeIpc, setupErrorHandlers } from './ipcInit'
import { registerShortcuts } from './services/ShortcutService'
import { TrayService } from './services/TrayService'
import { windowService } from './services/WindowService'
import { updateUserDataPath } from './utils/upgrade'

// Check for single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.

  // 在启动时只清除样式相关缓存，确保样式更新生效
  if (!app.isPackaged) {
    console.log('开发环境，不清除缓存')
  } else {
    console.log('开始清除样式缓存')
    // 禁用HTTP缓存
    app.commandLine.appendSwitch('disable-http-cache')
    // 禁用GPU缓存
    app.commandLine.appendSwitch('disable-gpu-cache')
    // 强制使用新的渲染版本
    app.commandLine.appendSwitch('disable-gpu-program-cache')
  }

  // 设置全局错误处理程序
  setupErrorHandlers()

  app.whenReady().then(async () => {
    // 设置内容安全策略，在所有环境中应用
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const csp = app.isPackaged
        ? "default-src 'self'; script-src 'self';"
        : "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';"

      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [csp]
        }
      })
    })

    // 在应用准备好后清除样式相关缓存
    if (app.isPackaged) {
      try {
        const sessions = [session.defaultSession, session.fromPartition('persist:webview')]
        for (const sess of sessions) {
          // 只清除缓存，不清除用户存储数据
          await sess.clearCache()
          // 只清除样式相关存储
          await sess.clearStorageData({
            storages: ['shadercache']
          })
        }
        console.log('样式缓存已清除')
      } catch (err) {
        console.error('清除缓存失败', err)
      }
    }

    await updateUserDataPath()

    // Set app user model id for windows
    electronApp.setAppUserModelId(import.meta.env.VITE_MAIN_BUNDLE_ID || 'com.kangfenmao.CherryStudio')

    // 先创建主窗口
    log.info('创建主窗口...')
    const mainWindow = windowService.createMainWindow()

    // 初始化IPC处理程序，直接使用主窗口
    log.info('开始初始化IPC处理程序...')
    const ipcInitialized = await initializeIpc(mainWindow)
    if (!ipcInitialized) {
      log.error('IPC处理程序初始化失败，应用程序可能无法正常工作')
    } else {
      log.info('IPC处理程序初始化完成')
    }
    new TrayService()

    app.on('activate', function () {
      const mainWindow = windowService.getMainWindow()
      if (!mainWindow || mainWindow.isDestroyed()) {
        windowService.createMainWindow()
      } else {
        windowService.showMainWindow()
      }
    })

    // 注册快捷键
    log.info('注册快捷键...')
    registerShortcuts(mainWindow)
    log.info('快捷键注册完成')

    replaceDevtoolsFont(mainWindow)

    if (process.env.NODE_ENV === 'development') {
      installExtension(REDUX_DEVTOOLS)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err))
    }
  })

  // Listen for second instance
  app.on('second-instance', () => {
    windowService.showMainWindow()
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  app.on('before-quit', () => {
    app.isQuitting = true
  })

  // In this file you can include the rest of your app"s specific main process
  // code. You can also put them in separate files and require them here.
}
