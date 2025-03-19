import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export interface SplitTextProps {
  children: string
  className?: string
  style?: React.CSSProperties
  delay?: number // 延迟时间（秒）
  staggerChildren?: number // 文字间的延迟时间（秒）
  animationType?:
    | 'fade'
    | 'up'
    | 'down'
    | 'left'
    | 'right'
    | 'scale'
    | 'rotate'
    | 'slide'
    | 'bounce'
    | 'wave'
    | 'glitch'
    | 'blur'
  duration?: number // 动画持续时间（秒）
  ease?: string // 缓动函数
  once?: boolean // 是否只动画一次
  letterSpacing?: number // 字母间距
  fontSize?: string // 字体大小
  color?: string // 文字颜色
  animateExit?: boolean // 是否有退出动画
  overflow?: string // 溢出处理方式
}

const SplitText: React.FC<SplitTextProps> = ({
  children,
  className = '',
  style = {},
  delay = 0,
  staggerChildren = 0.02,
  animationType = 'fade',
  duration = 0.5,
  ease = 'easeOut',
  once = true,
  letterSpacing = 0,
  fontSize,
  color,
  animateExit = false,
  overflow = 'hidden'
}) => {
  const [text, setText] = useState<string>(children)

  useEffect(() => {
    setText(children)
  }, [children])

  // 动画初始和结束状态的配置
  const animations = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    up: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    down: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 }
    },
    left: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    },
    right: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 }
    },
    rotate: {
      initial: { opacity: 0, rotate: -5 },
      animate: { opacity: 1, rotate: 0 },
      exit: { opacity: 0, rotate: 5 }
    },
    slide: {
      initial: { opacity: 0, y: 30, x: -10 },
      animate: { opacity: 1, y: 0, x: 0 },
      exit: { opacity: 0, y: -30, x: 10 }
    },
    bounce: {
      initial: { opacity: 0, scale: 0.6, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 10 } },
      exit: { opacity: 0, scale: 0.6, y: 20 }
    },
    wave: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 8 } },
      exit: { opacity: 0, y: -20 }
    },
    glitch: {
      initial: { opacity: 0, x: -5, y: -5, scale: 0.95, skewX: 5 },
      animate: { opacity: 1, x: 0, y: 0, scale: 1, skewX: 0 },
      exit: { opacity: 0, x: 5, y: 5, scale: 0.95, skewX: -5 }
    },
    blur: {
      initial: { opacity: 0, filter: 'blur(10px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(10px)' }
    }
  }

  const container = {
    hidden: { opacity: 0 },
    visible: () => ({
      opacity: 1,
      transition: {
        staggerChildren: staggerChildren,
        delayChildren: delay,
        ease: ease,
        duration: duration
      }
    })
  }

  // 根据选择的动画类型获取配置
  const { initial, animate } = animations[animationType]

  // 文字样式
  const textStyle = {
    ...style,
    letterSpacing: `${letterSpacing}px`,
    fontSize: fontSize,
    color: color,
    display: 'inline-block'
  }

  return (
    <motion.div
      className={`split-text ${className}`}
      variants={container}
      initial="hidden"
      whileInView="visible"
      exit={animateExit ? 'hidden' : undefined}
      viewport={{ once }}
      style={{ display: 'inline-block', overflow: overflow }}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { ...initial },
            visible: {
              ...animate,
              transition: {
                duration: duration,
                ease: ease
              }
            }
          }}
          style={textStyle}>
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  )
}

export default SplitText
