// 启用OWL Agent功能的脚本
const fs = require('fs')
const path = require('path')
const os = require('os')

// 获取用户数据目录
const userDataDir = path.join(os.homedir(), 'Library/Application Support/cherry-studio')
const reduxDir = path.join(userDataDir, 'redux')

console.log('正在寻找配置文件...')

try {
  // 读取redux持久化状态文件
  const files = fs.readdirSync(reduxDir)
  const persistFile = files.find((file) => file.startsWith('persist:'))

  if (!persistFile) {
    console.log('未找到Redux持久化文件，请先运行应用程序一次')
    process.exit(1)
  }

  const persistPath = path.join(reduxDir, persistFile)
  console.log(`找到配置文件: ${persistPath}`)

  // 读取并解析配置
  const data = fs.readFileSync(persistPath, 'utf8')
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
    if (!config.settings.sidebarIcons.visible.includes('owl')) {
      config.settings.sidebarIcons.visible.push('owl')
      console.log('已添加OWL图标到侧边栏')
    }

    // 设置示例API密钥（需要替换为真实密钥）
    config.settings.owlLanguageModelApiKey = 'your-openai-api-key'
    console.log('已设置语言模型API密钥（示例）')

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

    // 写回配置文件
    fs.writeFileSync(persistPath, JSON.stringify(config, null, 2))
    console.log('配置已成功保存！')
    console.log('\n请重启Cherry Studio应用以应用更改。')
    console.log('启动后，您应该能在侧边栏中看到OWL Agent图标。')
    console.log('请记得在设置中替换为您自己的API密钥。')
  } else {
    console.log('配置文件格式不正确，未找到settings部分')
  }
} catch (error) {
  console.error('发生错误:', error.message)
}
