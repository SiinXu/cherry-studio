import { CheckCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { QualityEvaluationResult } from '@renderer/services/OwlService'
import { Button, Card, Progress, Typography } from 'antd'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const { Title, Paragraph } = Typography

interface QualityEvaluationDisplayProps {
  evaluationResult: QualityEvaluationResult
  type: 'content' | 'code' | 'design'
}

const QualityEvaluationDisplay: FC<QualityEvaluationDisplayProps> = ({ evaluationResult, type }) => {
  const { t } = useTranslation()
  const [showDetails, setShowDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<'criteria' | 'suggestions'>('criteria')

  // 评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 8) return '#52c41a' // 绿色，高分
    if (score >= 6) return '#faad14' // 黄色，中分
    return '#f5222d' // 红色，低分
  }

  // 评分等级
  const getScoreLevel = (score: number) => {
    if (score >= 8) return t('owl.quality.excellent') // 优秀
    if (score >= 6) return t('owl.quality.good') // 良好
    return t('owl.quality.poor') // 较差
  }

  // 评估类型名称
  const getTypeName = () => {
    switch (type) {
      case 'content':
        return t('owl.quality.content')
      case 'code':
        return t('owl.quality.code')
      case 'design':
        return t('owl.quality.design')
      default:
        return t('owl.quality.content')
    }
  }

  // 渲染标准详情
  const renderCriteria = () => {
    return evaluationResult.criteria.map((criterion) => (
      <CriterionItem key={criterion.name}>
        <CriterionHeader>
          <CriterionName>{criterion.name}</CriterionName>
          <CriterionScore color={getScoreColor(criterion.score)}>{criterion.score}/10</CriterionScore>
        </CriterionHeader>
        <CriterionBar>
          <Progress
            percent={criterion.score * 10}
            showInfo={false}
            strokeColor={getScoreColor(criterion.score)}
            size="small"
          />
        </CriterionBar>
        <CriterionDescription>{criterion.description}</CriterionDescription>
      </CriterionItem>
    ))
  }

  // 渲染建议
  const renderSuggestions = () => {
    return (
      <SuggestionsList>
        {evaluationResult.suggestions.map((suggestion, index) => (
          <SuggestionItem key={index}>
            <SuggestionIcon />
            {suggestion}
          </SuggestionItem>
        ))}
      </SuggestionsList>
    )
  }

  return (
    <Container>
      <SummaryCard>
        <CardHeader>
          <Title level={4}>
            {getTypeName()}
            {t('owl.quality.evaluation_result')}
          </Title>
          <ScoreBadge color={getScoreColor(evaluationResult.score)}>{evaluationResult.score.toFixed(1)}/10</ScoreBadge>
        </CardHeader>

        <SummaryContent>
          <ScoreProgress>
            <Progress
              type="circle"
              percent={evaluationResult.score * 10}
              format={() => <ScoreValue>{evaluationResult.score.toFixed(1)}</ScoreValue>}
              strokeColor={getScoreColor(evaluationResult.score)}
              width={120}
            />
            <ScoreLevel color={getScoreColor(evaluationResult.score)}>
              {getScoreLevel(evaluationResult.score)}
            </ScoreLevel>
          </ScoreProgress>

          <SummaryText>{evaluationResult.summary}</SummaryText>
        </SummaryContent>

        <DetailsToggle>
          <Button type={showDetails ? 'primary' : 'default'} onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? t('owl.quality.hide_details') : t('owl.quality.show_details')}
          </Button>
        </DetailsToggle>
      </SummaryCard>

      {showDetails && (
        <DetailsCard>
          <TabsContainer>
            <TabButton active={activeTab === 'criteria'} onClick={() => setActiveTab('criteria')}>
              {t('owl.quality.criteria')}
            </TabButton>
            <TabButton active={activeTab === 'suggestions'} onClick={() => setActiveTab('suggestions')}>
              {t('owl.quality.suggestions')}
            </TabButton>
          </TabsContainer>

          <TabContent>{activeTab === 'criteria' ? renderCriteria() : renderSuggestions()}</TabContent>

          <AnalysisTip>
            <QuestionCircleOutlined style={{ marginRight: '8px' }} />
            {t('owl.quality.analysis_tip')}
          </AnalysisTip>
        </DetailsCard>
      )}
    </Container>
  )
}

// 样式定义
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  margin-bottom: 16px;
`

const SummaryCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

const ScoreBadge = styled.div<{ color: string }>`
  background-color: ${(props) => props.color};
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: bold;
  font-size: 18px;
`

const SummaryContent = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 16px;
`

const ScoreProgress = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`

const ScoreValue = styled.div`
  font-size: 24px;
  font-weight: bold;
`

const ScoreLevel = styled.div<{ color: string }>`
  color: ${(props) => props.color};
  font-weight: bold;
  font-size: 16px;
`

const SummaryText = styled(Paragraph)`
  flex: 1;
  font-size: 16px;
  margin-bottom: 0;
`

const DetailsToggle = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 8px;
`

const DetailsCard = styled(Card)`
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 16px;
`

const TabButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-weight: ${(props) => (props.active ? 'bold' : 'normal')};
  color: ${(props) => (props.active ? 'var(--color-primary)' : 'var(--color-text-1)')};
  border-bottom: ${(props) => (props.active ? '2px solid var(--color-primary)' : 'none')};
  transition: all 0.3s;

  &:hover {
    color: var(--color-primary);
  }
`

const TabContent = styled.div`
  padding: 8px 0;
`

const CriterionItem = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  background-color: var(--color-bg-1);
`

const CriterionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`

const CriterionName = styled.div`
  font-weight: bold;
  font-size: 15px;
`

const CriterionScore = styled.div<{ color: string }>`
  color: ${(props) => props.color};
  font-weight: bold;
`

const CriterionBar = styled.div`
  margin-bottom: 8px;
`

const CriterionDescription = styled.div`
  font-size: 13px;
  color: var(--color-text-2);
`

const SuggestionsList = styled.ul`
  padding-left: 16px;
  margin-bottom: 0;
`

const SuggestionItem = styled.li`
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  font-size: 14px;
  line-height: 1.5;
`

const SuggestionIcon = styled(CheckCircleOutlined)`
  color: var(--color-primary);
  margin-right: 8px;
  margin-top: 3px;
`

const AnalysisTip = styled.div`
  margin-top: 16px;
  padding: 12px;
  background-color: var(--color-bg-2);
  border-radius: 6px;
  color: var(--color-text-2);
  font-size: 13px;
  display: flex;
  align-items: center;
`

export default QualityEvaluationDisplay
