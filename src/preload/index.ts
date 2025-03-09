import { electronAPI } from '@electron-toolkit/preload'
import { FileType, KnowledgeBaseParams, KnowledgeItem, MCPServer, Shortcut, WebDavConfig } from '@types'
import { contextBridge, ipcRenderer, OpenDialogOptions, shell } from 'electron'

// Custom APIs for renderer
const api = {
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  reload: () => ipcRenderer.invoke('app:reload'),
  setProxy: (proxy: string) => ipcRenderer.invoke('app:proxy', proxy),
  checkForUpdate: () => ipcRenderer.invoke('app:check-for-update'),
  showUpdateDialog: () => ipcRenderer.invoke('app:show-update-dialog'),
  setLanguage: (lang: string) => ipcRenderer.invoke('app:set-language', lang),
  setTray: (isActive: boolean) => ipcRenderer.invoke('app:set-tray', isActive),
  restartTray: () => ipcRenderer.invoke('app:restart-tray'),
  setTheme: (theme: 'light' | 'dark') => ipcRenderer.invoke('app:set-theme', theme),
  openWebsite: (url: string) => ipcRenderer.invoke('open:website', url),
  minApp: (url: string) => ipcRenderer.invoke('minapp', url),
  clearCache: () => ipcRenderer.invoke('app:clear-cache'),
  zip: {
    compress: (text: string) => ipcRenderer.invoke('zip:compress', text),
    decompress: (text: Buffer) => ipcRenderer.invoke('zip:decompress', text)
  },
  backup: {
    backup: (fileName: string, data: string, destinationPath?: string) =>
      ipcRenderer.invoke('backup:backup', fileName, data, destinationPath),
    restore: (backupPath: string) => ipcRenderer.invoke('backup:restore', backupPath),
    backupToWebdav: (data: string, webdavConfig: WebDavConfig) =>
      ipcRenderer.invoke('backup:backupToWebdav', data, webdavConfig),
    restoreFromWebdav: (webdavConfig: WebDavConfig) => ipcRenderer.invoke('backup:restoreFromWebdav', webdavConfig)
  },
  file: {
    select: (options?: OpenDialogOptions) => ipcRenderer.invoke('file:select', options),
    upload: (filePath: string) => ipcRenderer.invoke('file:upload', filePath),
    delete: (fileId: string) => ipcRenderer.invoke('file:delete', fileId),
    read: (fileId: string) => ipcRenderer.invoke('file:read', fileId),
    clear: () => ipcRenderer.invoke('file:clear'),
    get: (filePath: string) => ipcRenderer.invoke('file:get', filePath),
    create: (fileName: string) => ipcRenderer.invoke('file:create', fileName),
    write: (filePath: string, data: Uint8Array | string) => ipcRenderer.invoke('file:write', filePath, data),
    open: (options?: { decompress: boolean }) => ipcRenderer.invoke('file:open', options),
    openPath: (path: string) => ipcRenderer.invoke('file:openPath', path),
    save: (path: string, content: string, options?: { compress: boolean }) =>
      ipcRenderer.invoke('file:save', path, content, options),
    selectFolder: () => ipcRenderer.invoke('file:selectFolder'),
    saveImage: (name: string, data: string) => ipcRenderer.invoke('file:saveImage', name, data),
    base64Image: (fileId: string) => ipcRenderer.invoke('file:base64Image', fileId),
    download: (url: string) => ipcRenderer.invoke('file:download', url),
    copy: (fileId: string, destPath: string) => ipcRenderer.invoke('file:copy', fileId, destPath),
    binaryFile: (fileId: string) => ipcRenderer.invoke('file:binaryFile', fileId)
  },
  fs: {
    read: (path: string) => ipcRenderer.invoke('fs:read', path),
    write: (path: string, data: string) => ipcRenderer.invoke('fs:write', path, data),
    exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
    mkdir: (path: string) => ipcRenderer.invoke('fs:mkdir', path)
  },
  export: {
    toWord: (markdown: string, fileName: string) => ipcRenderer.invoke('export:word', markdown, fileName)
  },
  openPath: (path: string) => ipcRenderer.invoke('open:path', path),
  shortcuts: {
    update: (shortcuts: Shortcut[]) => ipcRenderer.invoke('shortcuts:update', shortcuts)
  },
  knowledgeBase: {
    create: ({ id, model, apiKey, baseURL }: KnowledgeBaseParams) =>
      ipcRenderer.invoke('knowledge-base:create', { id, model, apiKey, baseURL }),
    reset: ({ base }: { base: KnowledgeBaseParams }) => ipcRenderer.invoke('knowledge-base:reset', { base }),
    delete: (id: string) => ipcRenderer.invoke('knowledge-base:delete', id),
    add: ({
      base,
      item,
      forceReload = false
    }: {
      base: KnowledgeBaseParams
      item: KnowledgeItem
      forceReload?: boolean
    }) => ipcRenderer.invoke('knowledge-base:add', { base, item, forceReload }),
    remove: ({ uniqueId, uniqueIds, base }: { uniqueId: string; uniqueIds: string[]; base: KnowledgeBaseParams }) =>
      ipcRenderer.invoke('knowledge-base:remove', { uniqueId, uniqueIds, base }),
    search: ({ search, base }: { search: string; base: KnowledgeBaseParams }) =>
      ipcRenderer.invoke('knowledge-base:search', { search, base })
  },
  window: {
    setMinimumSize: (width: number, height: number) => ipcRenderer.invoke('window:set-minimum-size', width, height),
    resetMinimumSize: () => ipcRenderer.invoke('window:reset-minimum-size')
  },
  gemini: {
    uploadFile: (file: FileType, apiKey: string) => ipcRenderer.invoke('gemini:upload-file', file, apiKey),
    base64File: (file: FileType) => ipcRenderer.invoke('gemini:base64-file', file),
    retrieveFile: (file: FileType, apiKey: string) => ipcRenderer.invoke('gemini:retrieve-file', file, apiKey),
    listFiles: (apiKey: string) => ipcRenderer.invoke('gemini:list-files', apiKey),
    deleteFile: (apiKey: string, fileId: string) => ipcRenderer.invoke('gemini:delete-file', apiKey, fileId)
  },
  selectionMenu: {
    action: (action: string) => ipcRenderer.invoke('selection-menu:action', action)
  },
  config: {
    set: (key: string, value: any) => ipcRenderer.invoke('config:set', key, value),
    get: (key: string) => ipcRenderer.invoke('config:get', key)
  },
  miniWindow: {
    show: () => ipcRenderer.invoke('miniwindow:show'),
    hide: () => ipcRenderer.invoke('miniwindow:hide'),
    close: () => ipcRenderer.invoke('miniwindow:close'),
    toggle: () => ipcRenderer.invoke('miniwindow:toggle')
  },
  aes: {
    encrypt: (text: string, secretKey: string, iv: string) => ipcRenderer.invoke('aes:encrypt', text, secretKey, iv),
    decrypt: (encryptedData: string, iv: string, secretKey: string) =>
      ipcRenderer.invoke('aes:decrypt', encryptedData, iv, secretKey)
  },
  mcp: {
    listServers: () => ipcRenderer.invoke('mcp:list-servers'),
    addServer: (server: MCPServer) => ipcRenderer.invoke('mcp:add-server', server),
    updateServer: (server: MCPServer) => ipcRenderer.invoke('mcp:update-server', server),
    deleteServer: (serverName: string) => ipcRenderer.invoke('mcp:delete-server', serverName),
    setServerActive: (name: string, isActive: boolean) =>
      ipcRenderer.invoke('mcp:set-server-active', { name, isActive }),
    listTools: (serverName?: string) => ipcRenderer.invoke('mcp:list-tools', serverName),
    callTool: (params: { client: string; name: string; args: any }) => ipcRenderer.invoke('mcp:call-tool', params),
    cleanup: () => ipcRenderer.invoke('mcp:cleanup')
  },
  shell: {
    openExternal: shell.openExternal
  },

  owl: {
    // 会话管理
    createSession: (options?: any) => ipcRenderer.invoke('owl:create-session', options),
    getSession: (sessionId: string) => ipcRenderer.invoke('owl:get-session', sessionId),
    deleteSession: (sessionId: string) => ipcRenderer.invoke('owl:delete-session', sessionId),
    listSessions: () => ipcRenderer.invoke('owl:list-sessions'),

    // 消息处理
    sendMessage: (sessionId: string, message: any) => ipcRenderer.invoke('owl:send-message', sessionId, message),
    getMessages: (sessionId: string) => ipcRenderer.invoke('owl:get-messages', sessionId),

    // 工具处理
    executeTool: (sessionId: string, tool: any) => ipcRenderer.invoke('owl:execute-tool', sessionId, tool),
    getToolResults: (sessionId: string) => ipcRenderer.invoke('owl:get-tool-results', sessionId),

    // 配置管理
    updateApiKey: (keyType: string, apiKey: string) => ipcRenderer.invoke('owl:update-api-key', keyType, apiKey),
    getConfig: () => ipcRenderer.invoke('owl:get-config'),
    updateConfig: (config: any) => ipcRenderer.invoke('owl:update-config', config),

    // 初始化与验证
    initialize: () => ipcRenderer.invoke('owl:initialize'),
    validateApiKey: (apiKey: string, provider?: string) => ipcRenderer.invoke('owl:validate-api-key', apiKey, provider),

    // 质量评估
    evaluateQuality: (content: string, type: 'content' | 'code' | 'design') =>
      ipcRenderer.invoke('owl:evaluate-quality', content, type)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
