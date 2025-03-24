import { ApiOutlined } from '@ant-design/icons'
import { useMCPServers } from '@renderer/hooks/useMCPServers'
import { MCPServer } from '@renderer/types'
import { Button, Tooltip } from '../../../../../../components'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  enabledMCPs: MCPServer[]
  toggelEnableMCP: (mcp: MCPServer) => void
  buttonClass?: string
  disabled?: boolean
}

const MCPToolsButton: FC<Props> = ({ enabledMCPs, toggelEnableMCP, buttonClass, disabled }) => {
  const { t } = useTranslation()

  return (
    <Tooltip placement="top" title={t('chat.input.mcp_tools')}>
      <Button
        className={`${buttonClass} ${enabledMCPs.length ? 'active' : ''}`}
        type="text"
        disabled={disabled}
      >
        <ApiOutlined />
      </Button>
    </Tooltip>
  )
}

export default MCPToolsButton
