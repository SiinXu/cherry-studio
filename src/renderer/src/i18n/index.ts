import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import deDE from './locales/de-de.json'
import enUS from './locales/en-US.json'
import esES from './locales/es-es.json'
import frFR from './locales/fr-fr.json'
import jaJP from './locales/ja-jp.json'
import koKR from './locales/ko-kr.json'
import ruRU from './locales/ru-ru.json'
import zhCN from './locales/zh-CN.json'
import zhHK from './locales/zh-hk.json'
import zhTW from './locales/zh-tw.json'

const resources = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'zh-HK': zhHK,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  'ru-RU': ruRU,
  'de-DE': deDE,
  'es-ES': esES,
  'fr-FR': frFR
}

export const getLanguage = () => {
  return localStorage.getItem('language') || navigator.language || 'en-US'
}

export const getLanguageCode = () => {
  return getLanguage().split('-')[0]
}

i18n.use(initReactI18next).init({
  resources,
  lng: getLanguage(),
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false
  }
})

export default i18n
