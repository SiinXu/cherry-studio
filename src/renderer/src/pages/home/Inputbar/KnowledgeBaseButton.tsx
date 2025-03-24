import { DatabaseOutlined } from '@ant-design/icons'
import { Button, Tooltip, Popover } from '../../../../../../components'
import { useAppSelector } from '@renderer/store'
import { KnowledgeBase } from '@renderer/types'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import './KnowledgeBaseButton.css'

interface Props {
  selectedBases?: KnowledgeBase[]
  onSelect: (bases?: KnowledgeBase[]) => void
  buttonClass?: string
  disabled?: boolean
}

const KnowledgeBaseButton: FC<Props> = ({ selectedBases = [], onSelect, buttonClass, disabled }) => {
  const { t } = useTranslation()

  return (
    <Tooltip placement="top" title={t('chat.input.knowledge_base')}>
      <Button
        className={`${buttonClass} ${selectedBases.length ? 'active' : ''}`}
        type="text"
        disabled={disabled}
      >
        <DatabaseOutlined />
      </Button>
    </Tooltip>
  )
}

export default KnowledgeBaseButton
