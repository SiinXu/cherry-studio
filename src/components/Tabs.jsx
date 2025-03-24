import './Tabs.css'

import PropTypes from 'prop-types'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const Tabs = ({
  defaultActiveKey,
  activeKey,
  onChange,
  type = 'line',
  centered = false,
  size = 'medium',
  children,
  className = '',
  ...props
}) => {
  const [currentActiveKey, setCurrentActiveKey] = useState(activeKey || defaultActiveKey)
  const [inkStyle, setInkStyle] = useState({})
  const tabsNavRef = useRef(null)
  const activeTabRef = useRef(null)

  // 获取所有有效的 TabPane 子组件
  const items = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type.displayName === 'TabPane'
  )

  // 更新下划线样式
  const updateInkStyle = useCallback(() => {
    if (type === 'line' && activeTabRef.current && tabsNavRef.current) {
      const { offsetLeft, offsetWidth } = activeTabRef.current
      setInkStyle({
        left: offsetLeft,
        width: offsetWidth
      })
    }
  }, [type])

  // 监听活动选项卡变化
  useEffect(() => {
    if (activeKey !== undefined) {
      setCurrentActiveKey(activeKey)
    }
  }, [activeKey])

  // 更新下划线位置
  useEffect(() => {
    updateInkStyle()
  }, [currentActiveKey, items, updateInkStyle])

  // 监听窗口大小变化
  useEffect(() => {
    window.addEventListener('resize', updateInkStyle)
    return () => {
      window.removeEventListener('resize', updateInkStyle)
    }
  }, [updateInkStyle])

  // 处理选项卡点击
  const handleTabClick = (key) => {
    if (activeKey === undefined) {
      setCurrentActiveKey(key)
    }

    if (onChange) {
      onChange(key)
    }
  }

  // 尺寸映射
  const sizeClassMap = {
    small: 'rb-tabs-sm',
    medium: 'rb-tabs-md',
    large: 'rb-tabs-lg'
  }

  // 组合类名
  const tabsClasses = [
    'rb-tabs',
    `rb-tabs-${type}`,
    centered ? 'rb-tabs-centered' : '',
    sizeClassMap[size] || 'rb-tabs-md',
    className
  ]
    .filter(Boolean)
    .join(' ')

  // 渲染选项卡头部
  const renderTabNav = () => {
    return (
      <div className="rb-tabs-nav-wrap" ref={tabsNavRef}>
        <div className="rb-tabs-nav">
          {items.map((item) => {
            const isActive = item.props.tabKey === currentActiveKey

            return (
              <div
                key={item.props.tabKey}
                ref={isActive ? activeTabRef : null}
                className={`rb-tabs-tab ${isActive ? 'rb-tabs-tab-active' : ''} ${item.props.disabled ? 'rb-tabs-tab-disabled' : ''}`}
                onClick={() => !item.props.disabled && handleTabClick(item.props.tabKey)}>
                {item.props.tab}
              </div>
            )
          })}

          {type === 'line' && <div className="rb-tabs-ink-bar" style={inkStyle} />}
        </div>
      </div>
    )
  }

  // 渲染内容区域
  const renderTabContent = () => {
    return (
      <div className="rb-tabs-content">
        {items.map((item) => {
          const isActive = item.props.tabKey === currentActiveKey

          return (
            <div
              key={item.props.tabKey}
              className={`rb-tabs-tabpane ${isActive ? 'rb-tabs-tabpane-active' : 'rb-tabs-tabpane-inactive'}`}>
              {isActive && item.props.children}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={tabsClasses} {...props}>
      {renderTabNav()}
      {renderTabContent()}
    </div>
  )
}

// TabPane 组件
const TabPane = ({ children }) => {
  return children
}

TabPane.displayName = 'TabPane'

TabPane.propTypes = {
  tabKey: PropTypes.string.isRequired,
  tab: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.node
}

Tabs.TabPane = TabPane

Tabs.propTypes = {
  defaultActiveKey: PropTypes.string,
  activeKey: PropTypes.string,
  onChange: PropTypes.func,
  type: PropTypes.oneOf(['line', 'card', 'editable-card']),
  centered: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  children: PropTypes.node,
  className: PropTypes.string
}

export default Tabs
