import React, { useState } from 'react'

import { motion } from 'framer-motion'
import styled from 'styled-components'

import { SplitText } from '..'
import SpotlightCard from './SpotlightCard'

interface DemoCardProps {
  title: string
  description: string
  color: string
  onClick?: () => void
  size?: number
  hoverScale?: number
}

const SpotlightCardDemo: React.FC = () => {
  const [clickedCard, setClickedCard] = useState<string | null>(null)

  const handleCardClick = (title: string) => {
    setClickedCard(title)
    setTimeout(() => setClickedCard(null), 2000)
  }

  const demoCards: DemoCardProps[] = [
    {
      title: '基础卡片',
      description: '默认样式的基础SpotlightCard',
      color: 'rgba(64, 121, 255, 0.25)',
      onClick: () => handleCardClick('基础卡片')
    },
    {
      title: '大光效',
      description: '使用更大的聚光效果尺寸',
      color: 'rgba(252, 95, 95, 0.25)',
      size: 150,
      onClick: () => handleCardClick('大光效')
    },
    {
      title: '强悬浮',
      description: '悬浮时有更大的缩放效果',
      color: 'rgba(120, 230, 90, 0.25)',
      hoverScale: 1.08,
      onClick: () => handleCardClick('强悬浮')
    },
    {
      title: '多彩卡片',
      description: '使用彩色变化的效果',
      color: 'rgba(200, 100, 240, 0.25)',
      onClick: () => handleCardClick('多彩卡片')
    }
  ]

  return (
    <Container>
      <Title>
        <SplitText animationType="fade" delay={0.1} duration={0.5}>
          SpotlightCard 展示
        </SplitText>
      </Title>
      
      <Description>
        将鼠标悬浮在卡片上查看动画效果，点击卡片可以看到点击效果和水波纹
      </Description>
      
      {clickedCard && (
        <ClickMessage>
          您点击了：{clickedCard}
        </ClickMessage>
      )}
      
      <CardGrid>
        {demoCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.1, 
              duration: 0.5, 
              type: 'spring',
              stiffness: 100,
              damping: 15
            }}
          >
            <SpotlightCard 
              spotlightColor={card.color}
              spotlightSize={card.size || 75}
              hoverScale={card.hoverScale || 1.03}
              initialAnimation={true}
              onClick={card.onClick}
              className="demo-card"
            >
              <CardContent>
                <CardTitle>{card.title}</CardTitle>
                <CardDesc>{card.description}</CardDesc>
              </CardContent>
            </SpotlightCard>
          </motion.div>
        ))}
      </CardGrid>
    </Container>
  )
}

const Container = styled.div`
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
`

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #4079ff, #40c8ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
`

const Description = styled.p`
  text-align: center;
  font-size: 16px;
  color: #666;
  margin-bottom: 40px;
`

const ClickMessage = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(64, 121, 255, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  animation: fadeInOut 2s ease-in-out;
  
  @keyframes fadeInOut {
    0% { 
      opacity: 0; 
      transform: translate(-50%, -20px); 
    }
    15% { 
      opacity: 1; 
      transform: translate(-50%, 0); 
    }
    85% { 
      opacity: 1; 
      transform: translate(-50%, 0); 
    }
    100% { 
      opacity: 0; 
      transform: translate(-50%, -20px); 
    }
  }
`

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
  
  .demo-card {
    height: 180px;
    border-radius: 16px;
    transition: all 0.3s ease;
  }
`

const CardContent = styled.div`
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const CardTitle = styled.h3`
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 10px;
`

const CardDesc = styled.p`
  font-size: 14px;
  opacity: 0.8;
  line-height: 1.5;
`

export default SpotlightCardDemo
