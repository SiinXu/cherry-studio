// 一个简单的IPC测试脚本，可以通过Electron的main进程直接运行

const axios = require('axios')
const log = require('electron-log')

// 模拟owl:http-request处理程序的实现
async function mockHttpRequest(requestData) {
  try {
    log.info(`执行HTTP请求: ${requestData?.[0]?.url || '未知URL'}`)

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
  } catch (error) {
    // 错误处理
    log.error(`HTTP请求失败: ${error.message || '未知错误'}`)
    return {
      error: true,
      message: error.message || '请求失败',
      status: error.response?.status,
      data: error.response?.data
    }
  }
}

// 测试函数
async function runTest() {
  console.log('开始测试HTTP请求实现...')

  // 测试正常GET请求
  try {
    console.log('测试GET请求...')
    const getResult = await mockHttpRequest([
      {
        method: 'GET',
        url: 'https://httpbin.org/get'
      }
    ])
    console.log('GET请求结果:', getResult.status, getResult.statusText)
    console.log('测试GET请求成功')
  } catch (error) {
    console.error('测试GET请求失败:', error)
  }

  // 测试正常POST请求
  try {
    console.log('测试POST请求...')
    const postResult = await mockHttpRequest([
      {
        method: 'POST',
        url: 'https://httpbin.org/post',
        data: { test: 'value' }
      }
    ])
    console.log('POST请求结果:', postResult.status, postResult.statusText)
    console.log('测试POST请求成功')
  } catch (error) {
    console.error('测试POST请求失败:', error)
  }

  // 测试错误处理
  try {
    console.log('测试错误处理...')
    const errorResult = await mockHttpRequest([
      {
        method: 'GET',
        url: 'https://this-domain-does-not-exist-123456789.com',
        timeout: 5000
      }
    ])
    console.log('错误处理结果:', errorResult.error, errorResult.message)
    console.log('测试错误处理成功')
  } catch (error) {
    console.error('测试错误处理失败:', error)
  }

  console.log('测试完成')
}

// 运行测试
runTest().catch(console.error)
