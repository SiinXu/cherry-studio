import './Card.css'

import PropTypes from 'prop-types'

const Card = ({
  children,
  title,
  extra,
  bordered = true,
  hoverable = false,
  shadow = false,
  className = '',
  ...props
}) => {
  const cardClasses = [
    'rb-card',
    bordered ? 'rb-card-bordered' : '',
    hoverable ? 'rb-card-hoverable' : '',
    shadow ? 'rb-card-shadow' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClasses} {...props}>
      {(title || extra) && (
        <div className="rb-card-head">
          {title && <div className="rb-card-head-title">{title}</div>}
          {extra && <div className="rb-card-head-extra">{extra}</div>}
        </div>
      )}
      <div className="rb-card-body">{children}</div>
    </div>
  )
}

// 卡片头部组件
const CardHeader = ({ title, subtitle, avatar, action, className = '', ...props }) => {
  const headerClasses = ['rb-card-header', className].filter(Boolean).join(' ')

  return (
    <div className={headerClasses} {...props}>
      {avatar && <div className="rb-card-avatar">{avatar}</div>}
      <div className="rb-card-header-content">
        {title && <div className="rb-card-title">{title}</div>}
        {subtitle && <div className="rb-card-subtitle">{subtitle}</div>}
      </div>
      {action && <div className="rb-card-action">{action}</div>}
    </div>
  )
}

// 卡片内容组件
const CardContent = ({ children, className = '', ...props }) => {
  const contentClasses = ['rb-card-content', className].filter(Boolean).join(' ')

  return (
    <div className={contentClasses} {...props}>
      {children}
    </div>
  )
}

// 卡片操作组件
const CardActions = ({ children, className = '', ...props }) => {
  const actionsClasses = ['rb-card-actions', className].filter(Boolean).join(' ')

  return (
    <div className={actionsClasses} {...props}>
      {children}
    </div>
  )
}

// 卡片媒体组件
const CardMedia = ({ image, title, height, className = '', ...props }) => {
  const mediaClasses = ['rb-card-media', className].filter(Boolean).join(' ')

  const mediaStyle = {
    backgroundImage: image ? `url(${image})` : undefined,
    height
  }

  return (
    <div className={mediaClasses} style={mediaStyle} {...props}>
      {title && <div className="rb-card-media-title">{title}</div>}
    </div>
  )
}

// 设置组件显示名
CardHeader.displayName = 'CardHeader'
CardContent.displayName = 'CardContent'
CardActions.displayName = 'CardActions'
CardMedia.displayName = 'CardMedia'

// 绑定子组件
Card.Header = CardHeader
Card.Content = CardContent
Card.Actions = CardActions
Card.Media = CardMedia

Card.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
  extra: PropTypes.node,
  bordered: PropTypes.bool,
  hoverable: PropTypes.bool,
  shadow: PropTypes.bool,
  className: PropTypes.string
}

CardHeader.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  avatar: PropTypes.node,
  action: PropTypes.node,
  className: PropTypes.string
}

CardContent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
}

CardActions.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
}

CardMedia.propTypes = {
  image: PropTypes.string,
  title: PropTypes.node,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string
}

export default Card
