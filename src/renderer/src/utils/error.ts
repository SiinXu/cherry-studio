export function getErrorDetails(err: any, seen = new WeakSet()): any {
  // Handle circular references
  if (err === null || typeof err !== 'object' || seen.has(err)) {
    return err
  }

  seen.add(err)
  const result: any = {}

  // Get all enumerable properties, including those from the prototype chain
  const allProps = new Set([...Object.getOwnPropertyNames(err), ...Object.keys(err)])

  for (const prop of allProps) {
    try {
      const value = err[prop]
      // Skip function properties
      if (typeof value === 'function') continue
      // Recursively process nested objects
      result[prop] = getErrorDetails(value, seen)
    } catch (e) {
      result[prop] = '<Unable to access property>'
    }
  }

  return result
}

export function formatErrorMessage(error: any): string {
  console.error('Original error:', error)

  try {
    const detailedError = getErrorDetails(error)
    delete detailedError?.headers
    delete detailedError?.stack
    delete detailedError?.request_id
    return '```json\n' + JSON.stringify(detailedError, null, 2) + '\n```'
  } catch (e) {
    try {
      return '```\n' + String(error) + '\n```'
    } catch {
      return 'Error: Unable to format error message'
    }
  }
}

export function formatMessageError(error: any): Record<string, any> {
  try {
    const detailedError = getErrorDetails(error)
    delete detailedError?.headers
    delete detailedError?.stack
    delete detailedError?.request_id
    return detailedError
  } catch (e) {
    try {
      return { message: String(error) }
    } catch {
      return { message: 'Error: Unable to format error message' }
    }
  }
}

/**
 * 专门处理IPC调用错误，提取有用的错误信息
 * @param error 原始IPC错误对象
 * @returns 格式化后的错误信息对象
 */
export function formatIpcError(error: any): Record<string, any> {
  try {
    // 首先尝试使用常规错误处理
    const detailedError = getErrorDetails(error)

    // 移除不必要的字段
    delete detailedError?.headers
    delete detailedError?.stack
    delete detailedError?.request_id

    // 添加IPC特定的错误类型标识
    detailedError.isIpcError = true

    // 确保始终有错误消息
    if (!detailedError.message) {
      detailedError.message = '未知IPC错误'
    }

    return detailedError
  } catch (e) {
    // 如果无法处理错误对象，返回简单错误消息
    return {
      isIpcError: true,
      message: String(error) || '未知IPC错误'
    }
  }
}

export function getErrorMessage(error: any): string {
  return error?.message || error?.toString() || ''
}
