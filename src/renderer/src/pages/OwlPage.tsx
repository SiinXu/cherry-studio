import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import OwlAgent from '@renderer/components/OwlAgent/OwlAgent'
import Scrollbar from '@renderer/components/Scrollbar'
import { useSettings } from '@renderer/hooks/useSettings'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const OwlPage: FC = () => {
  const { t } = useTranslation()
  const { advancedFeatures, enableOWL } = useSettings()

  // 检查是否启用了高级功能和OWL
  const showOwlContent = !!advancedFeatures && !!enableOWL

  return (
    <PageContainer>
      <Navbar>
        <NavbarCenter>
          <NavTitle>
            <span>{t('owl.title')}</span>
          </NavTitle>
        </NavbarCenter>
      </Navbar>
      <ContentContainer>
        <Scrollbar>
          <ContentWrapper>
            {!showOwlContent ? (
              <EmptyStateContainer>
                {!advancedFeatures ? (
                  <EmptyStateText>{t('owl.advanced_features_disabled')}</EmptyStateText>
                ) : (
                  <EmptyStateText>{t('owl.enable_owl_first')}</EmptyStateText>
                )}
              </EmptyStateContainer>
            ) : (
              <OwlAgent visible={true} />
            )}
          </ContentWrapper>
        </Scrollbar>
      </ContentContainer>
    </PageContainer>
  )
}

const PageContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  overflow: hidden;
`

const NavTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
`

const ContentContainer = styled.div`
  width: 100%;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
`

const ContentWrapper = styled.div`
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
`

const EmptyStateContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-soft);
  height: 100%;
  width: 100%;
`

const EmptyStateText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: var(--color-text-2);
  max-width: 450px;
  text-align: center;
  padding: 30px;
`

export default OwlPage
