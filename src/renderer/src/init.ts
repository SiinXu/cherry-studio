import KeyvStorage from '@kangfenmao/keyv-storage'

import { startAutoSync } from './services/BackupService'
import store from './store'

console.log('init.ts开始执行')

function initSpinner() {
  console.log('初始化spinner')
  const spinner = document.getElementById('spinner')
  if (spinner && window.location.hash !== '#/mini') {
    spinner.style.display = 'flex'
  }
}

function initKeyv() {
  console.log('初始化keyv存储')
  window.keyv = new KeyvStorage()
  window.keyv.init()
}

function initAutoSync() {
  console.log('初始化自动同步')
  setTimeout(() => {
    const { webdavAutoSync } = store.getState().settings
    console.log('webdavAutoSync设置:', webdavAutoSync)
    if (webdavAutoSync) {
      startAutoSync()
    }
  }, 2000)
}

initSpinner()
initKeyv()
initAutoSync()

console.log('init.ts执行完成')
