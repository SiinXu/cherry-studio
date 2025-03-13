// 话题队列管理工具
// 该文件提供了管理话题队列的功能，防止多个请求同时处理同一个话题

/**
 * 任务队列类，用于管理异步任务
 */
class TaskQueue {
  private tasks: Array<() => Promise<any>> = []
  private running = false

  /**
   * 添加任务到队列
   * @param task 要执行的异步任务
   * @returns 任务执行的Promise
   */
  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.tasks.push(async () => {
        try {
          const result = await task()
          resolve(result)
          return result
        } catch (error) {
          reject(error)
          throw error
        }
      })

      if (!this.running) {
        this.runTasks()
      }
    })
  }

  /**
   * 等待所有任务完成
   * @returns Promise，在所有任务完成时resolve
   */
  async onIdle(): Promise<void> {
    if (this.tasks.length === 0 && !this.running) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.tasks.length === 0 && !this.running) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    })
  }

  private async runTasks(): Promise<void> {
    if (this.running) return
    this.running = true

    while (this.tasks.length > 0) {
      const task = this.tasks.shift()
      if (task) {
        try {
          await task()
        } catch (error) {
          console.error('Task error:', error)
        }
      }
    }

    this.running = false
  }
}

// 存储每个话题ID的处理队列
const topicQueues: Record<string, TaskQueue> = {}

/**
 * 获取指定话题的队列
 * @param topicId 话题ID
 * @returns 话题对应的任务队列
 */
export function getTopicQueue(topicId: string): TaskQueue {
  if (!topicQueues[topicId]) {
    topicQueues[topicId] = new TaskQueue()
  }
  return topicQueues[topicId]
}

/**
 * 等待话题队列处理完成
 * @param topicId 话题ID
 * @returns Promise，在话题可以处理时resolve
 */
export function waitForTopicQueue(topicId: string): Promise<void> {
  // 获取或创建该话题的队列
  const queue = getTopicQueue(topicId)
  // 返回队列的onIdle Promise
  return queue.onIdle()
}

/**
 * 清除指定话题的队列状态
 * @param topicId 话题ID
 */
export function clearTopicQueue(topicId: string): void {
  // 从队列存储中移除该话题的队列
  delete topicQueues[topicId]
}

/**
 * 清除所有话题的队列状态
 */
export function clearAllTopicQueues(): void {
  // 重置所有话题队列
  Object.keys(topicQueues).forEach((topicId) => {
    delete topicQueues[topicId]
  })
}
