import { FC, ReactNode } from 'react'
import styled from 'styled-components'

interface PageContainerProps {
  children: ReactNode
}

/**
 * 通用页面容器组件
 * 提供基本的页面布局结构和样式
 */
const PageContainer: FC<PageContainerProps> = ({ children }) => {
  return <Container>{children}</Container>
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  padding: 0;
  overflow-y: auto;
  background-color: #000;
`

export default PageContainer
