import './Alert.css'

import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'

const Alert = ({
  type = 'info',
  title,
  message,
  icon,
  closable = true,
  onClose,
  duration = 0, // 0 表示不自动关闭
  className = '',
  ...props
}) => {
  const [visible, setVisible] = useState(true)

  // 处理自动关闭
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        if (onClose) onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  // 处理关闭
  const handleClose = () => {
    setVisible(false)
    if (onClose) onClose()
  }

  // 如果不可见，则不渲染
  if (!visible) return null

  // 获取默认图标
  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'warning':
        return '⚠'
      case 'error':
        return '✕'
      case 'info':
      default:
        return 'ℹ'
    }
  }

  // 组合类名
  const alertClasses = ['rb-alert', `rb-alert-${type}`, className].filter(Boolean).join(' ')

  return (
    <div className={alertClasses} role="alert" {...props}>
      {icon !== false && <div className="rb-alert-icon">{icon || getTypeIcon()}</div>}

      <div className="rb-alert-content">
        {title && <div className="rb-alert-title">{title}</div>}
        {message && <div className="rb-alert-message">{message}</div>}
      </div>

      {closable && (
        <button type="button" className="rb-alert-close-btn" onClick={handleClose} aria-label="关闭">
          ×
        </button>
      )}
    </div>
  )
}

Alert.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  title: PropTypes.node,
  message: PropTypes.node,
  icon: PropTypes.node,
  closable: PropTypes.bool,
  onClose: PropTypes.func,
  duration: PropTypes.number,
  className: PropTypes.string
}

export default Alert
