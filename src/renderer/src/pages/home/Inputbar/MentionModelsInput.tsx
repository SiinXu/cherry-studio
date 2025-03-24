import { useProviders } from '@renderer/hooks/useProvider'
import { getModelUniqId } from '@renderer/services/ModelService'
import { Model } from '@renderer/types'
import { Flex, Tag } from '../../../../../../components'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import './MentionModelsInput.css'

const MentionModelsInput: FC<{
  selectedModels: Model[]
  onRemoveModel: (model: Model) => void
  onSelect?: (model: Model) => void
  onClose?: () => void
}> = ({ selectedModels, onRemoveModel, onSelect, onClose }) => {
  const { providers } = useProviders()
  const { t } = useTranslation()

  const getProviderName = (model: Model) => {
    const provider = providers.find((p) => p.id === model?.provider)
    return provider ? (provider.isSystem ? t(`provider.${provider.id}`) : provider.name) : ''
  }

  return (
    <Flex className="rb-mention-models-input" gap="4px 0" wrap>
      {selectedModels.map((model) => (
        <Tag
          bordered={false}
          color="processing"
          key={getModelUniqId(model)}
          closable
          onClose={() => onRemoveModel(model)}>
          @{model.name} ({getProviderName(model)})
        </Tag>
      ))}
    </Flex>
  )
}

export default MentionModelsInput
