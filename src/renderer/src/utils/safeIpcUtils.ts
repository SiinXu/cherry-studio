import log from 'electron-log'

/**
 * 安全的IPC调用函数，当IPC调用失败时提供优雅的错误处理
 * @param method 要调用的IPC方法名
 * @param args 传递给方法的参数
 * @param defaultValue 当调用失败时返回的默认值
 * @param silent 是否静默处理错误（不记录日志）
 * @returns Promise 解析为调用结果或默认值
 */
export async function safeIpcInvoke<T = any>(
  method: string,
  args?: any[],
  defaultValue?: T,
  silent: boolean = false
): Promise<T> {
  try {
    // 确保IPC渲染器接口可用
    if (!window.electron?.ipcRenderer) {
      if (!silent) {
        log.warn(`IPC接口不可用，无法调用方法: ${method}`)
      }
      return defaultValue as T
    }

    // 使用扩展操作符展开参数数组
    return (await window.electron.ipcRenderer.invoke(method, ...(args || []))) as T
  } catch (error) {
    if (!silent) {
      log.error(`IPC调用失败 [${method}]:`, error)
    }
    return defaultValue as T
  }
}

/**
 * 带重试机制的安全IPC调用函数，适用于主进程可能尚未准备好的情况
 * @param method 要调用的IPC方法名
 * @param args 传递给方法的参数
 * @param defaultValue 当调用失败时返回的默认值
 * @param retries 最大重试次数
 * @param delay 重试间隔（毫秒）
 * @returns Promise 解析为调用结果或默认值
 */
export async function safeIpcInvokeWithRetry<T = any>(
  method: string,
  args?: any[],
  defaultValue?: T,
  retries: number = 3,
  delay: number = 500
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (!window.electron?.ipcRenderer) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      return (await window.electron.ipcRenderer.invoke(method, ...(args || []))) as T
    } catch (error) {
      // 最后一次尝试失败
      if (attempt === retries) {
        log.error(`IPC调用失败 [${method}] 经过 ${retries} 次重试:`, error)
        break
      }

      // 等待指定时间后重试
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return defaultValue as T
}

/**
 * 批量安全执行多个IPC调用，任何单个失败都不会影响其他调用
 * @param calls IPC调用配置数组
 * @returns 包含所有调用结果的对象（按提供的键值映射）
 */
export async function batchSafeIpcInvoke<T extends Record<string, any> = Record<string, any>>(
  calls: Array<{
    key: string
    method: string
    args?: any[]
    defaultValue?: any
  }>
): Promise<T> {
  const results: Record<string, any> = {}

  await Promise.all(
    calls.map(async ({ key, method, args, defaultValue }) => {
      results[key] = await safeIpcInvoke(method, args, defaultValue, true)
    })
  )

  return results as T
}
