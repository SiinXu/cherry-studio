#!/usr/bin/env node

/**
 * 该脚本用于在开发环境中正确启动Cherry Studio应用程序
 * 确保所有IPC处理程序都正确注册
 */

const { spawn } = require('child_process')

// 确保首先运行enable-owl.js脚本
console.log('正在启用OWL功能...')
require('./enable-owl')

// 然后正常启动应用程序
console.log('正在启动Cherry Studio开发服务器...')

// 启动主进程(Electron)
const electronProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
})

electronProcess.on('close', (code) => {
  console.log(`Electron进程已退出，退出码: ${code}`)
})

console.log('Cherry Studio开发服务器已启动，请等待应用窗口打开...')
console.log('提示: 如果遇到IPC处理程序未注册的错误，请尝试重新启动应用程序。')
