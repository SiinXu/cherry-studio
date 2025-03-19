import './SpotlightCard.css'

import { motion } from 'framer-motion'
import React, { ReactNode, useEffect, useRef, useState } from 'react'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  spotlightColor?: string
  spotlightSize?: number
  style?: React.CSSProperties
  enableHoverEffect?: boolean
  hoverScale?: number
  animationDuration?: number
  onClick?: () => void
  initialAnimation?: boolean
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.25)',
  spotlightSize = 75,
  style = {},
  enableHoverEffect = true,
  hoverScale = 1.02,
  animationDuration = 0.3,
  onClick,
  initialAnimation = true
}) => {
  const divRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(!initialAnimation)

  // Effect for entrance animation
  useEffect(() => {
    if (initialAnimation) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined // 确保所有路径都有返回值
  }, [initialAnimation])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!divRef.current) return

    const rect = divRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Smoothly update position for more natural mouse following
    setPosition({ x, y })

    // Set CSS variables for the spotlight effect
    divRef.current.style.setProperty('--mouse-x', `${x}px`)
    divRef.current.style.setProperty('--mouse-y', `${y}px`)
    divRef.current.style.setProperty('--spotlight-color', spotlightColor)
    divRef.current.style.setProperty('--spotlight-size', `${spotlightSize}%`)
  }

  const handleMouseEnter = (): void => {
    setIsHovered(true)
  }

  const handleMouseLeave = (): void => {
    setIsHovered(false)
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (onClick) {
      // 使用鼠标点击位置创建水波纹效果
      if (divRef.current) {
        // 记录点击位置
        const rect = divRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // 创建点击闪烁效果
        const flashEffect = document.createElement('div')
        flashEffect.className = 'click-flash'
        flashEffect.style.left = `${x}px`
        flashEffect.style.top = `${y}px`
        divRef.current.appendChild(flashEffect)

        // 使用CSS变量设置水波纹起点
        divRef.current.style.setProperty('--ripple-x', `${x}px`)
        divRef.current.style.setProperty('--ripple-y', `${y}px`)

        // 添加脉冲动画类
        divRef.current.classList.add('pulse-effect')

        // 强调点击位置的聚光灯效果
        const prevSpotlightSize = divRef.current.style.getPropertyValue('--spotlight-size') || spotlightSize + '%'
        const prevSpotlightColor = divRef.current.style.getPropertyValue('--spotlight-color') || spotlightColor

        // 临时增强聚光效果
        divRef.current.style.setProperty('--spotlight-size', `${parseInt(prevSpotlightSize as string) * 0.8}%`)
        divRef.current.style.setProperty('--spotlight-color', spotlightColor.replace(/[^,]+(?=\))/, '0.4'))

        // 定时移除效果
        setTimeout(() => {
          if (divRef.current) {
            divRef.current.classList.remove('pulse-effect')
            divRef.current.style.setProperty('--spotlight-size', prevSpotlightSize)
            divRef.current.style.setProperty('--spotlight-color', prevSpotlightColor)

            // 移除闪烁效果元素
            if (flashEffect && flashEffect.parentNode === divRef.current) {
              divRef.current.removeChild(flashEffect)
            }
          }
        }, 1000) // 与水波纹动画时间匹配
      }

      // 调用点击回调
      onClick()
    }
  }

  // Animation variants for framer-motion
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1 },
    hover: { scale: hoverScale, y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.12)' },
    tap: { scale: 0.98, y: 0, boxShadow: '0 5px 10px rgba(0,0,0,0.15)' },
    exit: { opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.2 } }
  }

  return (
    <motion.div
      ref={divRef}
      initial={initialAnimation ? 'hidden' : 'visible'}
      animate={isVisible ? (isHovered && enableHoverEffect ? 'hover' : 'visible') : 'hidden'}
      whileTap={onClick ? 'tap' : undefined}
      variants={cardVariants}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
        duration: animationDuration,
        opacity: { duration: 0.15 }
      }}
      exit="exit"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`card-spotlight ${enableHoverEffect ? 'hover-effect' : ''} ${className}`}
      style={
        {
          ...style,
          '--spotlight-x': `${position.x}px`,
          '--spotlight-y': `${position.y}px`
        } as React.CSSProperties
      }>
      {children}
    </motion.div>
  )
}

export default SpotlightCard
