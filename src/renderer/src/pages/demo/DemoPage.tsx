import SpotlightCardDemo from '@renderer/components/ReactBits/SpotlightCard/SpotlightCardDemo'
import React from 'react'
import styled from 'styled-components'

const DemoPage: React.FC = () => {
  return (
    <Container>
      <Header>
        <Title>组件演示页</Title>
        <Subtitle>查看和测试各种交互组件</Subtitle>
      </Header>

      <Section>
        <SpotlightCardDemo />
      </Section>
    </Container>
  )
}

const Container = styled.div`
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  padding: 20px;
  padding-top: 80px;
  background: var(--color-bg);
`

const Header = styled.header`
  margin-bottom: 40px;
  text-align: center;
`

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 10px;
`

const Subtitle = styled.p`
  font-size: 16px;
  color: var(--color-text-secondary);
`

const Section = styled.section`
  margin-bottom: 60px;
`

export default DemoPage
