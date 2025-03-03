import { FC, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useHotkeys } from 'react-hotkeys-hook'
import { migrateTopicGroups } from '@renderer/utils/migration'

const NavigationHandler: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // 进行数据迁移
  useEffect(() => {
    // 执行话题分组迁移
    migrateTopicGroups()
  }, [])

  // 处理导航
  useEffect(() => {
    if (location.pathname === '/') {
      return
    }
  }, [location, navigate])

  useHotkeys(
    'meta+, ! ctrl+,',
    function () {
      if (location.pathname.startsWith('/settings')) {
        return
      }
      navigate('/settings/provider')
    },
    { splitKey: '!', enableOnContentEditable: true, enableOnFormTags: true }
  )

  return null
}

export default NavigationHandler
