// Google API测试脚本 - 自主代理功能测试
const axios = require('axios')
const readline = require('readline')
const fs = require('fs')
const https = require('https')
const dns = require('dns')
const net = require('net')
const { exec } = require('child_process')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 完整HTTP头部集合
const fullHeaders = {
  'content-type': 'application/json',
  accept: '*/*',
  'accept-language': 'zh-CN',
  priority: 'u=1, i',
  referer: 'http://localhost:5173/',
  'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'cross-site',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) cherry-studio/1.0.7 Chrome/126.0.6478.234 Electron/31.7.6 Safari/537.36'
}

// 测试场景定义
const testScenarios = [
  {
    name: '基础API连接测试',
    data: {
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
  },
  {
    name: '自主代理功能测试',
    data: {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: '你是OWL智能助手，一个功能强大的AI代理。你可以使用以下工具集：web_search, code_interpreter, image_generation, web_browser, file_manager, data_analysis, autonomous_agent。当前激活的工具集是：autonomous_agent。请根据用户的问题提供帮助，并在需要时利用这些工具集解决问题。'
            }
          ]
        },
        {
          role: 'user',
          parts: [
            {
              text: '你现在是一个自主代理，需要完成以下目标：撰写关于最新人工智能技术趋势的简短报告。\n请自行分解任务，并按步骤执行，无需用户进一步确认。每完成一个步骤，都应报告进度并自动进行下一步。'
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
        topP: 0.9
      }
    }
  }
]

// 保存响应到文件
async function saveResponseToFile(data, filename) {
  try {
    const dir = './api-responses'
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    fs.writeFileSync(`${dir}/${filename}`, JSON.stringify(data, null, 2))
    console.log(`响应已保存到文件: ${dir}/${filename}`)
  } catch (err) {
    console.error('保存响应失败:', err)
  }
}

// 检查系统代理设置
async function checkProxySettings() {
  console.log('检查系统代理设置...')
  const proxyEnvVars = [
    'http_proxy',
    'HTTP_PROXY',
    'https_proxy',
    'HTTPS_PROXY',
    'all_proxy',
    'ALL_PROXY',
    'no_proxy',
    'NO_PROXY'
  ]

  const proxySettings = {}
  let hasProxy = false

  // 检查环境变量中的代理设置
  proxyEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      proxySettings[varName] = process.env[varName]
      hasProxy = true
    }
  })

  // 如果没有在环境变量中找到代理设置，尝试使用系统命令检查
  if (!hasProxy) {
    try {
      const platformCommands = {
        darwin: "scutil --proxy | grep -i 'http\\|https'",
        win32: 'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" | findstr /i proxy',
        linux: 'env | grep -i proxy'
      }

      const command = platformCommands[process.platform] || 'env | grep -i proxy'
      const { stdout } = await new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
          resolve({ stdout, stderr, error })
        })
      })

      if (stdout && stdout.trim()) {
        proxySettings.systemProxy = stdout.trim()
        hasProxy = true
      }
    } catch (error) {
      console.log('无法检查系统代理设置:', error.message)
    }
  }

  // 输出代理设置信息
  if (hasProxy) {
    console.log('⚠️ 检测到代理设置:', JSON.stringify(proxySettings, null, 2))
    console.log('注意: 代理可能会影响API连接，若连接失败请尝试禁用代理')
    return { hasProxy, proxySettings }
  } else {
    console.log('✓ 未检测到代理设置')
    return { hasProxy: false }
  }
}

// 检查端口连通性
async function testPort(host, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let isResolved = false

    socket.setTimeout(timeoutMs)

    socket.on('connect', () => {
      isResolved = true
      socket.destroy()
      resolve(true)
    })

    socket.on('timeout', () => {
      if (!isResolved) {
        socket.destroy()
        resolve(false)
      }
    })

    socket.on('error', () => {
      if (!isResolved) {
        socket.destroy()
        resolve(false)
      }
    })

    socket.connect(port, host)
  })
}

// 测试网络连接
async function testNetwork(host) {
  console.log(`测试与 ${host} 的网络连接...`)

  // 检查代理设置
  const { hasProxy } = await checkProxySettings()

  // 测试 DNS 解析
  const dnsPromise = new Promise((resolve) => {
    dns.lookup(host, (err, address) => {
      if (err) {
        console.error('✗ DNS解析失败:', err.message)
        resolve({ success: false, message: 'DNS解析失败' })
      } else {
        console.log('✓ DNS解析成功:', address)
        resolve({ success: true, address })
      }
    })
  })

  const dnsResult = await dnsPromise
  if (!dnsResult.success) return false

  // 测试 TCP 端口连通性
  console.log(`测试与 ${host}:443 的TCP连接...`)
  const tcpConnected = await testPort(host, 443, 5000)
  if (tcpConnected) {
    console.log('✓ TCP连接成功')
  } else {
    console.error(`✗ TCP连接失败`)
    if (hasProxy) {
      console.log('⚠️ 可能是代理问题，尝试临时禁用代理后再测试')
    }
  }

  // 测试 HTTPS 连接
  const httpsPromise = new Promise((resolve) => {
    const req = https.request(
      {
        host,
        port: 443,
        method: 'HEAD',
        path: '/',
        timeout: 5000,
        rejectUnauthorized: false // 忽略SSL证书错误以测试连接
      },
      (res) => {
        console.log(`✓ HTTPS连接成功: 状态码 ${res.statusCode}`)
        resolve(true)
      }
    )

    req.on('error', (err) => {
      console.error('✗ HTTPS连接失败:', err.message)
      if (err.message.includes('certificate') || err.message.includes('SSL')) {
        console.log('  可能是SSL证书问题，但HTTPS连接基础可行')
        resolve(true) // 证书问题但连接基础可行
      } else {
        resolve(false)
      }
    })

    req.on('timeout', () => {
      console.error('✗ HTTPS连接超时')
      req.destroy()
      resolve(false)
    })

    req.end()
  })

  const httpsConnected = await httpsPromise
  return tcpConnected || httpsConnected // 如果两者之一成功即可
}

// 测试API密钥格式
function validateApiKey(key) {
  if (!key) return { valid: false, message: 'API密钥不能为空' }

  // 检查Google API密钥的基本格式 (通常以39个字符开头)
  if (!/^AIza[0-9A-Za-z_-]{35}/.test(key)) {
    return { valid: false, message: 'API密钥格式不正确，应以"AIza"开头并同39个字符' }
  }

  return { valid: true }
}

// 执行API测试
async function runApiTest(apiKey, scenarioIndex) {
  const scenario = testScenarios[scenarioIndex]
  console.log(`\n执行测试场景: ${scenario.name}`)

  try {
    // 验证API密钥
    const keyValidation = validateApiKey(apiKey)
    if (!keyValidation.valid) {
      throw new Error(keyValidation.message)
    }

    // 测试与 Google API 的网络连接
    const host = 'generativelanguage.googleapis.com'
    const networkOk = await testNetwork(host)
    if (!networkOk) {
      console.log('网络测试失败，但仍尝试发送请求...')
    } else {
      console.log('网络连接测试成功！')
    }

    const apiUrl = `https://${host}/v1beta/models/gemini-pro:generateContent?key=${apiKey}`

    console.log('\n发送请求...')
    console.log('请求URL:', apiUrl.substring(0, apiUrl.indexOf('?')) + '?key=...')
    console.log('请求数据结构:', JSON.stringify(scenario.data, null, 2).substring(0, 500) + '...')

    // 显示头部信息(安全地移除敏感信息)
    const safeHeaders = { ...fullHeaders }
    console.log('请求头部:', JSON.stringify(safeHeaders, null, 2))

    // 尝试减少数据量以加快测试
    if (scenario.name === '基础API连接测试') {
      scenario.data.generationConfig.maxOutputTokens = 10 // 非常小的输出量
    }

    // 使用更可靠的Axios配置
    const axiosConfig = {
      headers: fullHeaders,
      timeout: 20000, // 增加超时时间到20秒
      validateStatus: function () {
        // 允许任何状态码都返回，以便我们可以自己处理
        return true
      },
      maxContentLength: 50 * 1024 * 1024, // 50MB
      maxBodyLength: 50 * 1024 * 1024, // 50MB
      decompress: true, // 启用自动解压缩
      // 重试选项
      retry: 3,
      retryDelay: 1000
    }

    // 添加自定义代理处理
    if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
      console.log('使用系统代理设置...')
      // Axios会自动使用环境变量中的代理
    }

    // 实现请求重试逻辑
    let retries = 0
    const maxRetries = 3
    let response
    const startTime = Date.now()
    while (retries <= maxRetries) {
      try {
        if (retries > 0) {
          console.log(`请求失败，正在尝试第 ${retries} 次重试...`)
          await new Promise((r) => setTimeout(r, 1000 * retries)) // 指数退避
        }
        response = await axios.post(apiUrl, scenario.data, axiosConfig)
        // 如果请求成功，跳出循环
        break
      } catch (error) {
        retries++
        console.error(`请求错误 (尝试 ${retries}/${maxRetries}):`, error.message)
        // 判断错误类型
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          console.log('连接超时，可能是网络问题。')
        } else if (error.code === 'ECONNREFUSED') {
          console.log('连接被拒绝，可能是服务器问题或防火墙拦截。')
        } else if (error.code === 'ENOTFOUND') {
          console.log('无法解析域名，可能是DNS问题。')
        }
        // 如果已达到最大重试次数，则抛出错误
        if (retries > maxRetries) {
          throw error
        }
      }
    }
    const endTime = Date.now()

    console.log('API请求成功!')
    console.log('请求耗时:', endTime - startTime, 'ms')
    console.log('响应状态码:', response.status)

    // 保存原始响应到文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    await saveResponseToFile(response.data, `${scenario.name.replace(/\s+/g, '-')}-${timestamp}.json`)

    // 分析响应结构
    console.log('\n响应结构分析:')
    console.log('响应字段:', Object.keys(response.data).join(', '))

    // 使用安全的对象和数组访问模式
    const candidates = response.data?.candidates || []
    console.log('候选项数量:', candidates.length)

    if (candidates.length > 0) {
      const candidate = candidates[0]
      const parts = candidate.content?.parts || []

      if (parts.length > 0 && parts[0].text) {
        // 常规文本响应
        console.log('\n模型回复 (前200字符):')
        console.log(parts[0].text.substring(0, 200) + '...')

        // 检查是否有工具调用 (使用安全访问模式)
        const hasFunctionCall = parts.some((part) => part.functionCall)
        const hasToolUse = parts.some((part) => part.toolUse || part.toolCalls)

        if (hasFunctionCall) {
          console.log('\n检测到函数调用:')
          parts.forEach((part) => {
            if (part.functionCall) {
              const fnName = part.functionCall.name || '未知函数'
              const fnArgs = part.functionCall.args || {}
              console.log('- 函数名称:', fnName)
              console.log('- 函数参数:', JSON.stringify(fnArgs).substring(0, 100) + '...')
            }
          })
        }

        if (hasToolUse) {
          console.log('\n检测到工具使用:')
          parts.forEach((part) => {
            const toolData = part.toolUse || part.toolCalls
            if (toolData) {
              if (Array.isArray(toolData)) {
                toolData.forEach((tool) => {
                  const toolName = tool.name || tool.type || 'autonomous_agent'
                  const toolArgs = tool.args || tool.arguments || tool.input || {}
                  console.log('- 工具名称:', toolName)
                  console.log('- 工具参数类型:', typeof toolArgs)
                  console.log('- 工具参数内容:', JSON.stringify(toolArgs).substring(0, 50) + '...')
                })
              } else {
                const toolName = toolData.name || toolData.type || 'autonomous_agent'
                const toolArgs = toolData.args || toolData.arguments || toolData.input || {}
                console.log('- 工具名称:', toolName)
                console.log('- 工具参数类型:', typeof toolArgs)
                console.log('- 工具参数内容:', JSON.stringify(toolArgs).substring(0, 50) + '...')
              }
            }
          })
        }
      } else {
        console.log('未找到标准响应内容结构')
        console.log(JSON.stringify(candidate, null, 2))
      }
    } else {
      console.log('未找到有效的候选项')
      console.log(JSON.stringify(response.data, null, 2))
    }

    // 返回测试结果状态
    return true
  } catch (error) {
    console.error('API请求失败!')

    if (error.response) {
      // 服务器返回了错误响应
      console.error('错误状态码:', error.response.status)
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2))
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('未收到响应，可能是网络问题或超时')
      console.error(error.message)
    } else {
      // 设置请求时出错
      console.error('请求设置错误:', error.message)
    }

    // 返回测试结果状态
    return false
  }
}

// 主测试流程
async function main() {
  try {
    console.log('欢迎使用Google API测试工具!')
    console.log('====================================')
    console.log('此工具将测试Cherry Studio的OWL自主代理功能')
    console.log('测试环境信息:')
    console.log('Node.js版本:', process.version)
    console.log('系统平台:', process.platform)
    console.log('====================================')

    // 获取API密钥
    let apiKey = process.env.GOOGLE_API_KEY || ''

    if (!apiKey) {
      apiKey = await new Promise((resolve) => {
        rl.question('请输入您的Google API密钥: ', (key) => resolve(key))
      })
    } else {
      console.log('使用环境变量中的API密钥')
    }

    if (!apiKey) {
      console.error('错误: API密钥不能为空')
      rl.close()
      return
    }

    // 显示测试场景列表
    console.log('\n可用测试场景:')
    testScenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario.name}`)
    })

    // 获取用户选择的测试场景
    const scenarioChoice = await new Promise((resolve) => {
      rl.question('\n请选择测试场景编号 (或输入 "all" 运行所有测试): ', (choice) => resolve(choice))
    })

    if (scenarioChoice.toLowerCase() === 'all') {
      // 运行所有测试场景
      console.log('\n运行所有测试场景...')
      for (let i = 0; i < testScenarios.length; i++) {
        await runApiTest(apiKey, i)
      }
    } else {
      // 运行单个测试场景
      const scenarioIndex = parseInt(scenarioChoice) - 1
      if (isNaN(scenarioIndex) || scenarioIndex < 0 || scenarioIndex >= testScenarios.length) {
        console.error('错误: 无效的测试场景编号')
      } else {
        await runApiTest(apiKey, scenarioIndex)
      }
    }
  } catch (error) {
    console.error('测试执行错误:', error)
  } finally {
    rl.close()
  }
}

// 启动测试
main()
