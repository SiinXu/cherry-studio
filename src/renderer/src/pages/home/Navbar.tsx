import { FormOutlined, SearchOutlined } from '@ant-design/icons'
import { Layout, Navigation, Button, Tooltip } from '../../../../../components'
import { HStack } from '@renderer/components/Layout'
import MinAppsPopover from '@renderer/components/Popups/MinAppsPopover'
import SearchPopup from '@renderer/components/Popups/SearchPopup'
import { isMac, isWindows } from '@renderer/config/constant'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { modelGenerating } from '@renderer/hooks/useRuntime'
import { useSettings } from '@renderer/hooks/useSettings'
import { useShortcut } from '@renderer/hooks/useShortcuts'
import { useShowAssistants, useShowTopics } from '@renderer/hooks/useStore'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { useAppDispatch } from '@renderer/store'
import { setNarrowMode } from '@renderer/store/settings'
import { Assistant, Topic } from '@renderer/types'
import { t } from 'i18next'
import { FC } from 'react'
import './Navbar.css'

import SelectModelButton from './components/SelectModelButton'
import UpdateAppButton from './components/UpdateAppButton'

interface Props {
  activeAssistant: Assistant
  activeTopic: Topic
  setActiveTopic: (topic: Topic) => void
}

const HeaderNavbar: FC<Props> = ({ activeAssistant }) => {
  const { assistant } = useAssistant(activeAssistant.id)
  const { showAssistants, toggleShowAssistants } = useShowAssistants()
  const { topicPosition, sidebarIcons, narrowMode } = useSettings()
  const { showTopics, toggleShowTopics } = useShowTopics()
  const dispatch = useAppDispatch()

  useShortcut('toggle_show_assistants', () => {
    toggleShowAssistants()
  })

  useShortcut('toggle_show_topics', () => {
    if (topicPosition === 'right') {
      toggleShowTopics()
    } else {
      EventEmitter.emit(EVENT_NAMES.SHOW_TOPIC_SIDEBAR)
    }
  })

  useShortcut('search_message', () => {
    SearchPopup.show()
  })

  const handleNarrowModeToggle = async () => {
    await modelGenerating()
    dispatch(setNarrowMode(!narrowMode))
  }

  return (
    <Layout.Header className="rb-navbar home-navbar">
      <div className="rb-navbar-container">
        {showAssistants && (
          <div className="rb-navbar-left" style={{ justifyContent: 'space-between', borderRight: 'none', padding: 0 }}>
            <Tooltip title={t('navbar.hide_sidebar')} placement="bottom">
              <Button 
                className="rb-navbar-icon" 
                onClick={toggleShowAssistants} 
                style={{ marginLeft: isMac ? 16 : 0 }}
                type="text"
              >
                <i className="iconfont icon-hide-sidebar" />
              </Button>
            </Tooltip>
            <Tooltip title={t('settings.shortcuts.new_topic')} placement="bottom">
              <Button 
                className="rb-navbar-icon" 
                onClick={() => EventEmitter.emit(EVENT_NAMES.ADD_NEW_TOPIC)}
                type="text"
              >
                <FormOutlined />
              </Button>
            </Tooltip>
          </div>
        )}
        <div 
          className="rb-navbar-right"
          style={{ justifyContent: 'space-between', paddingRight: isWindows ? 140 : 12, flex: 1 }}
        >
          <HStack alignItems="center">
            {!showAssistants && (
              <Tooltip title={t('navbar.show_sidebar')} placement="bottom">
                <Button
                  className="rb-navbar-icon"
                  onClick={() => toggleShowAssistants()}
                  style={{ marginRight: 8, marginLeft: isMac ? 4 : -12 }}
                  type="text"
                >
                  <i className="iconfont icon-show-sidebar" />
                </Button>
              </Tooltip>
            )}
            <SelectModelButton assistant={assistant} />
          </HStack>
          <HStack alignItems="center" gap={8}>
            <UpdateAppButton />
            <Tooltip title={t('chat.assistant.search.placeholder')} placement="bottom">
              <Button className="rb-navbar-icon rb-navbar-narrow-icon" onClick={() => SearchPopup.show()} type="text">
                <SearchOutlined />
              </Button>
            </Tooltip>
            <Tooltip title={t('navbar.expand')} placement="bottom">
              <Button className="rb-navbar-icon rb-navbar-narrow-icon" onClick={handleNarrowModeToggle} type="text">
                <i className="iconfont icon-icon-adaptive-width"></i>
              </Button>
            </Tooltip>
            {sidebarIcons.visible.includes('minapp') && (
              <MinAppsPopover>
                <Tooltip title={t('minapp.title')} placement="bottom">
                  <Button className="rb-navbar-icon rb-navbar-narrow-icon" type="text">
                    <i className="iconfont icon-appstore" />
                  </Button>
                </Tooltip>
              </MinAppsPopover>
            )}
            {topicPosition === 'right' && (
              <Button 
                className="rb-navbar-icon rb-navbar-narrow-icon" 
                onClick={toggleShowTopics}
                type="text"
              >
                <i className={`iconfont icon-${showTopics ? 'show' : 'hide'}-sidebar`} />
              </Button>
            )}
          </HStack>
        </div>
      </div>
    </Layout.Header>
  )
}

export default HeaderNavbar
