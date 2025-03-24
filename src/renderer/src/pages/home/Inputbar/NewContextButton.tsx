import { PartitionOutlined } from '@ant-design/icons'
import { Button, Tooltip } from '../../../../../../components'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  onNewContext: () => void
  disabled?: boolean
  buttonClass?: string
}

const NewContextButton: FC<Props> = ({ onNewContext, disabled, buttonClass }) => {
  const { t } = useTranslation()

  return (
    <Tooltip placement="top" title={t('chat.input.new_context')}>
      <Button
        className={buttonClass}
        type="text"
        onClick={onNewContext}
        disabled={disabled}
      >
        <PartitionOutlined />
      </Button>
    </Tooltip>
  )
}

export default NewContextButton
