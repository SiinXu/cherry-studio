// Google API测试脚本
const axios = require('axios')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 请求用户输入API密钥
rl.question('请输入您的Google API密钥: ', async (apiKey) => {
  console.log('正在测试API连接...')

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`
    const testData = {
      contents: [
        {
          role: 'user',
          parts: [{ text: '简单的API测试消息，请回复一个简短的确认' }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 50
      }
    }

    const startTime = Date.now()
    const response = await axios.post(apiUrl, testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000 // 30秒超时
    })
    const endTime = Date.now()

    console.log('API请求成功!')
    console.log('请求耗时:', endTime - startTime, 'ms')
    console.log('响应状态码:', response.status)

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const candidate = response.data.candidates[0]
      if (candidate.content && candidate.content.parts) {
        console.log('模型回复:')
        console.log(candidate.content.parts[0].text)
      } else {
        console.log('未找到响应内容，完整响应:')
        console.log(JSON.stringify(response.data, null, 2))
      }
    } else {
      console.log('未找到有效的响应内容，完整响应:')
      console.log(JSON.stringify(response.data, null, 2))
    }
  } catch (error) {
    console.error('API请求失败!')

    if (error.response) {
      // 服务器返回了错误响应
      console.error('错误状态码:', error.response.status)
      console.error('错误信息:', error.response.data)
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('未收到响应，可能是网络问题或超时')
      console.error(error.message)
    } else {
      // 设置请求时出错
      console.error('请求设置错误:', error.message)
    }
  }

  rl.close()
})
