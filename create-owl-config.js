// 创建OWL配置的辅助脚本
const fs = require('fs')
const path = require('path')
const os = require('os')

// 获取用户数据目录
const userDataDir = path.join(os.homedir(), 'Library/Application Support/cherry-studio')
const reduxDir = path.join(userDataDir, 'redux')

console.log('正在检查配置目录...')

// 确保目录存在
if (!fs.existsSync(userDataDir)) {
  console.log(`创建用户数据目录: ${userDataDir}`)
  fs.mkdirSync(userDataDir, { recursive: true })
}

if (!fs.existsSync(reduxDir)) {
  console.log(`创建Redux目录: ${reduxDir}`)
  fs.mkdirSync(reduxDir, { recursive: true })
}

// 检查配置文件是否存在
const persistFile = path.join(reduxDir, 'persist:root')
if (!fs.existsSync(persistFile)) {
  console.log(`创建初始配置文件: ${persistFile}`)

  // 创建带有OWL配置的初始设置
  const initialConfig = {
    settings: {
      advancedFeatures: true,
      enableOWL: true,
      owlLanguageModelApiKey: 'your-openai-api-key',
      owlExternalResourcesApiKey: '',
      sidebarIcons: {
        visible: ['chat', 'agents', 'owl', 'settings']
      },
      owlToolkits: [
        'web_search',
        'web_browser',
        'code_interpreter',
        'file_manager',
        'image_generation',
        'data_analysis'
      ],
      owlModelProvider: 'openai',
      owlLogLevel: 'info',
      owlSandboxBrowserMode: 'iframe'
    },
    _persist: {
      version: 1,
      rehydrated: true
    }
  }

  // 写入配置文件
  fs.writeFileSync(persistFile, JSON.stringify(initialConfig, null, 2))
  console.log('初始配置已创建，已启用OWL功能！')
} else {
  console.log(`配置文件已存在: ${persistFile}`)

  try {
    // 读取并更新现有配置
    const data = fs.readFileSync(persistFile, 'utf8')
    const config = JSON.parse(data)

    // 修改设置
    if (config.settings) {
      // 启用高级功能
      config.settings.advancedFeatures = true
      console.log('已启用高级功能')

      // 启用OWL
      config.settings.enableOWL = true
      console.log('已启用OWL功能')

      // 确保OWL图标在侧边栏可见
      if (!config.settings.sidebarIcons || !config.settings.sidebarIcons.visible) {
        config.settings.sidebarIcons = {
          visible: ['chat', 'agents', 'owl', 'settings']
        }
      } else if (!config.settings.sidebarIcons.visible.includes('owl')) {
        config.settings.sidebarIcons.visible.push('owl')
      }
      console.log('已添加OWL图标到侧边栏')

      // 设置示例API密钥（需要替换为真实密钥）
      config.settings.owlLanguageModelApiKey = config.settings.owlLanguageModelApiKey || 'your-openai-api-key'
      console.log('已设置语言模型API密钥')

      // 启用工具包
      config.settings.owlToolkits = [
        'web_search',
        'web_browser',
        'code_interpreter',
        'file_manager',
        'image_generation',
        'data_analysis'
      ]
      console.log('已启用所有工具包')

      // 添加其他OWL配置
      config.settings.owlModelProvider = config.settings.owlModelProvider || 'openai'
      config.settings.owlLogLevel = config.settings.owlLogLevel || 'info'
      config.settings.owlSandboxBrowserMode = config.settings.owlSandboxBrowserMode || 'iframe'

      // 写回配置文件
      fs.writeFileSync(persistFile, JSON.stringify(config, null, 2))
      console.log('配置已成功更新！')
    } else {
      console.log('配置文件格式不正确，未找到settings部分')
    }
  } catch (error) {
    console.error('发生错误:', error.message)
  }
}

console.log('\n请重启Cherry Studio应用以应用更改。')
console.log('启动后，您应该能在侧边栏中看到OWL Agent图标。')
console.log('请记得在设置中替换为您自己的API密钥。')
