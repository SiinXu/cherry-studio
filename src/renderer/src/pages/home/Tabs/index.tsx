import { BarsOutlined, SettingOutlined } from '@ant-design/icons'
import AddAssistantPopup from '@renderer/components/Popups/AddAssistantPopup'
import { useAssistants, useDefaultAssistant } from '@renderer/hooks/useAssistant'
import { useSettings } from '@renderer/hooks/useSettings'
import { useShowTopics } from '@renderer/hooks/useStore'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { Assistant, Topic } from '@renderer/types'
import { uuid } from '@renderer/utils'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layout, Tabs } from '../../../../../../components'
import './Tabs.css'

import Assistants from './AssistantsTab'
import Settings from './SettingsTab'
import Topics from './TopicsTab'

interface Props {
  activeAssistant: Assistant
  activeTopic: Topic
  setActiveAssistant: (assistant: Assistant) => void
  setActiveTopic: (topic: Topic) => void
  position: 'left' | 'right'
}

type Tab = 'assistants' | 'topic' | 'settings'

let _tab: any = ''

const HomeTabs: FC<Props> = ({ activeAssistant, activeTopic, setActiveAssistant, setActiveTopic, position }) => {
  const { addAssistant } = useAssistants()
  const [tab, setTab] = useState<Tab>(position === 'left' ? _tab || 'assistants' : 'topic')
  const { topicPosition } = useSettings()
  const { defaultAssistant } = useDefaultAssistant()
  const { toggleShowTopics } = useShowTopics()

  const { t } = useTranslation()

  const borderStyle = '0.5px solid var(--color-border)'
  const border =
    position === 'left' ? { borderRight: borderStyle } : { borderLeft: borderStyle, borderTopLeftRadius: 0 }

  if (position === 'left' && topicPosition === 'left') {
    _tab = tab
  }

  const showTab = !(position === 'left' && topicPosition === 'right')

  const assistantTab = {
    label: t('assistants.abbr'),
    value: 'assistants',
    icon: <i className="iconfont icon-business-smart-assistant" />
  }

  const onCreateAssistant = async () => {
    const assistant = await AddAssistantPopup.show()
    assistant && setActiveAssistant(assistant)
  }

  const onCreateDefaultAssistant = () => {
    const assistant = { ...defaultAssistant, id: uuid() }
    addAssistant(assistant)
    setActiveAssistant(assistant)
  }

  useEffect(() => {
    const unsubscribes = [
      EventEmitter.on(EVENT_NAMES.SHOW_ASSISTANTS, (): any => {
        showTab && setTab('assistants')
      }),
      EventEmitter.on(EVENT_NAMES.SHOW_TOPIC_SIDEBAR, (): any => {
        showTab && setTab('topic')
      }),
      EventEmitter.on(EVENT_NAMES.SHOW_CHAT_SETTINGS, (): any => {
        showTab && setTab('settings')
      }),
      EventEmitter.on(EVENT_NAMES.SWITCH_TOPIC_SIDEBAR, () => {
        showTab && setTab('topic')
        if (position === 'left' && topicPosition === 'right') {
          toggleShowTopics()
        }
      })
    ]
    return () => unsubscribes.forEach((unsub) => unsub())
  }, [position, showTab, tab, toggleShowTopics, topicPosition])

  useEffect(() => {
    if (position === 'right' && topicPosition === 'right' && tab === 'assistants') {
      setTab('topic')
    }
    if (position === 'left' && topicPosition === 'right' && tab !== 'assistants') {
      setTab('assistants')
    }
  }, [position, tab, topicPosition])

  const items = [
    position === 'left' && topicPosition === 'left' && {
      key: 'assistants',
      label: t('assistants.abbr'),
      icon: <i className="iconfont icon-business-smart-assistant" />,
      children: (
        <Assistants
          activeAssistant={activeAssistant}
          setActiveAssistant={setActiveAssistant}
          onCreateAssistant={onCreateAssistant}
          onCreateDefaultAssistant={onCreateDefaultAssistant}
        />
      )
    },
    {
      key: 'topic',
      label: t('common.topics'),
      icon: <BarsOutlined />,
      children: (
        <Topics 
          assistant={activeAssistant} 
          activeTopic={activeTopic} 
          setActiveTopic={setActiveTopic} 
        />
      )
    },
    {
      key: 'settings',
      label: t('settings.title'),
      icon: <SettingOutlined />,
      children: <Settings assistant={activeAssistant} />
    }
  ].filter(Boolean)

  return (
    <Layout.Aside className="rb-home-tabs" style={border}>
      {showTab && (
        <Tabs
          className="rb-home-tabs-nav"
          activeKey={tab}
          items={items}
          onChange={(key) => setTab(key as Tab)}
          type="card"
        />
      )}
    </Layout.Aside>
  )
}

export default HomeTabs
