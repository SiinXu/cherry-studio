import fs from 'node:fs'

import log from 'electron-log'

/**
 * 文件服务类 - 处理文件读写操作
 */
class FileService {
  constructor() {
    log.info('文件服务已初始化')
  }

  /**
   * 读取文件内容
   */
  public async readFile(_: Electron.IpcMainInvokeEvent, path: string) {
    try {
      log.info(`读取文件: ${path}`)
      return fs.readFileSync(path, 'utf8')
    } catch (error) {
      log.error(`读取文件失败: ${path}`, error)
      throw error
    }
  }

  /**
   * 写入文件内容
   */
  public async writeFile(_: Electron.IpcMainInvokeEvent, filePath: string, data: string) {
    try {
      log.info(`写入文件: ${filePath}`)
      fs.writeFileSync(filePath, data, 'utf8')
      return { success: true }
    } catch (error) {
      log.error(`写入文件失败: ${filePath}`, error)
      throw error
    }
  }

  /**
   * 检查文件或目录是否存在
   */
  public async exists(_: Electron.IpcMainInvokeEvent, filePath: string) {
    try {
      log.info(`检查路径是否存在: ${filePath}`)
      return fs.existsSync(filePath)
    } catch (error) {
      log.error(`检查路径失败: ${filePath}`, error)
      return false
    }
  }

  /**
   * 创建目录（如果不存在）
   */
  public async mkdir(_: Electron.IpcMainInvokeEvent, dirPath: string) {
    try {
      log.info(`创建目录: ${dirPath}`)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
      return { success: true }
    } catch (error) {
      log.error(`创建目录失败: ${dirPath}`, error)
      throw error
    }
  }
}

// 导出单例实例
export const fileService = new FileService()
export default fileService
