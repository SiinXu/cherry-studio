import { ZOOM_SHORTCUTS } from '@shared/config/constant'
import { LanguageVarious, Shortcut, ThemeMode } from '@types'
import { app } from 'electron'
import Store from 'electron-store'

import { locales } from '../utils/locales'

export class ConfigManager {
  private store: Store
  private subscribers: Map<string, Array<(newValue: any) => void>> = new Map()

  constructor() {
    this.store = new Store()
  }

  getLanguage(): LanguageVarious {
    const locale = Object.keys(locales).includes(app.getLocale()) ? app.getLocale() : 'en-US'
    return this.store.get('language', locale) as LanguageVarious
  }

  setLanguage(theme: LanguageVarious) {
    this.store.set('language', theme)
  }

  getTheme(): ThemeMode {
    return this.store.get('theme', ThemeMode.light) as ThemeMode
  }

  setTheme(theme: ThemeMode) {
    this.store.set('theme', theme)
  }

  getTray(): boolean {
    return !!this.store.get('tray', true)
  }

  setTray(value: boolean) {
    this.store.set('tray', value)
    this.notifySubscribers('tray', value)
  }

  getZoomFactor(): number {
    return this.store.get('zoomFactor', 1) as number
  }

  setZoomFactor(factor: number) {
    this.store.set('zoomFactor', factor)
    this.notifySubscribers('zoomFactor', factor)
  }

  subscribe<T>(key: string, callback: (newValue: T) => void) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, [])
    }
    this.subscribers.get(key)!.push(callback)
  }

  unsubscribe<T>(key: string, callback: (newValue: T) => void) {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      this.subscribers.set(
        key,
        subscribers.filter((subscriber) => subscriber !== callback)
      )
    }
  }

  private notifySubscribers<T>(key: string, newValue: T) {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      subscribers.forEach((subscriber) => subscriber(newValue))
    }
  }

  getShortcuts() {
    return this.store.get('shortcuts', ZOOM_SHORTCUTS) as Shortcut[] | []
  }

  setShortcuts(shortcuts: Shortcut[]) {
    this.store.set(
      'shortcuts',
      shortcuts.filter((shortcut) => shortcut.system)
    )
    this.notifySubscribers('shortcuts', shortcuts)
  }

  getClickTrayToShowQuickAssistant(): boolean {
    return this.store.get('clickTrayToShowQuickAssistant', false) as boolean
  }

  setClickTrayToShowQuickAssistant(value: boolean) {
    this.store.set('clickTrayToShowQuickAssistant', value)
  }

  getEnableQuickAssistant(): boolean {
    return this.store.get('enableQuickAssistant', false) as boolean
  }

  setEnableQuickAssistant(value: boolean) {
    this.store.set('enableQuickAssistant', value)
  }

  // OWL服务配置
  getOwlLanguageModelApiKey(): string {
    // 开发环境中返回测试API密钥，生产环境中保持用户设置
    if (!app.isPackaged) {
      const savedKey = this.store.get('owlLanguageModelApiKey', '') as string
      return savedKey || 'test-api-key-for-development-environment'
    }
    return this.store.get('owlLanguageModelApiKey', '') as string
  }

  setOwlLanguageModelApiKey(apiKey: string) {
    this.store.set('owlLanguageModelApiKey', apiKey)
    this.notifySubscribers('owlLanguageModelApiKey', apiKey)
  }

  getOwlExternalResourcesApiKey(): string {
    // 开发环境中返回测试API密钥，生产环境中保持用户设置
    if (!app.isPackaged) {
      const savedKey = this.store.get('owlExternalResourcesApiKey', '') as string
      return savedKey || 'test-external-resources-key-dev'
    }
    return this.store.get('owlExternalResourcesApiKey', '') as string
  }

  setOwlExternalResourcesApiKey(apiKey: string) {
    this.store.set('owlExternalResourcesApiKey', apiKey)
    this.notifySubscribers('owlExternalResourcesApiKey', apiKey)
  }

  getOwlModelProvider(): 'openai' | 'anthropic' | 'google' | 'local' {
    return this.store.get('owlModelProvider', 'openai') as 'openai' | 'anthropic' | 'google' | 'local'
  }

  setOwlModelProvider(provider: 'openai' | 'anthropic' | 'google' | 'local') {
    this.store.set('owlModelProvider', provider)
    this.notifySubscribers('owlModelProvider', provider)
  }

  getAdvancedSettings(): boolean {
    // 开发环境中默认启用高级设置，方便测试
    if (!app.isPackaged) {
      const saved = this.store.get('advancedSettings', null)
      // 如果用户明确设置了禁用，则尊重用户设置
      if (saved === false) return false
      return true
    }
    return this.store.get('advancedSettings', false) as boolean
  }

  setAdvancedSettings(value: boolean) {
    this.store.set('advancedSettings', value)
    this.notifySubscribers('advancedSettings', value)
  }

  getEnableOwl(): boolean {
    // 开发环境中默认启用OWL，方便测试
    if (!app.isPackaged) {
      const saved = this.store.get('enableOwl', null)
      // 如果用户明确设置了禁用，则尊重用户设置
      if (saved === false) return false
      return true
    }
    return this.store.get('enableOwl', false) as boolean
  }

  setEnableOwl(value: boolean) {
    this.store.set('enableOwl', value)
    this.notifySubscribers('enableOwl', value)
  }

  set(key: string, value: any) {
    this.store.set(key, value)
  }

  get(key: string) {
    return this.store.get(key)
  }
}

export const configManager = new ConfigManager()
