import './assets/styles/index.scss'
import '@ant-design/v5-patch-for-react-19'

import { createRoot } from 'react-dom/client'

import App from './App'
import MiniApp from './windows/mini/App'

console.log('main.tsx开始执行')

if (location.hash === '#/mini') {
  console.log('准备渲染MiniApp')
  document.getElementById('spinner')?.remove()
  const root = createRoot(document.getElementById('root') as HTMLElement)
  root.render(<MiniApp />)
} else {
  console.log('准备渲染主App')
  const root = createRoot(document.getElementById('root') as HTMLElement)
  root.render(<App />)
}

console.log('main.tsx执行完成')
