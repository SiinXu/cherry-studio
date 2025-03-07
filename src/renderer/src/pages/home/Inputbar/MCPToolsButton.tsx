import { useMCPServers } from '@renderer/hooks/useMCPServers'
import { MCPServer } from '@renderer/types'
import { Dropdown, Switch, Tooltip } from 'antd'
import { FC, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createGlobalStyle } from 'styled-components'

interface Props {
  enabledMCPs: MCPServer[]
  onEnableMCP: (server: MCPServer) => void
  ToolbarButton: any
}

const MCPToolsButton: FC<Props> = ({ enabledMCPs, onEnableMCP, ToolbarButton }) => {
  const { mcpServers } = useMCPServers()
  const [isOpen, setIsOpen] = useState(false)
  const [enableAll, setEnableAll] = useState(true)
  const dropdownRef = useRef<any>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Check if all active servers are enabled
  const activeServers = mcpServers.filter((s) => s.isActive)

  // Enable all active servers by default
  useEffect(() => {
    if (activeServers.length > 0) {
      activeServers.forEach((server) => {
        if (enableAll && !enabledMCPs.includes(server)) {
          onEnableMCP(server)
        }
        if (!enableAll && enabledMCPs.includes(server)) {
          onEnableMCP(server)
        }
      })
    }
  }, [enableAll])

  const menu = (
    <div ref={menuRef} className="ant-dropdown-menu">
      <div className="dropdown-header">
        <div className="header-content">
          <h4>{t('settings.mcp.title')}</h4>
          <div className="enable-all-container">
            {/* <span className="enable-all-label">{t('mcp.enable_all')}</span> */}
            <Switch size="small" checked={enableAll} onChange={setEnableAll} />
          </div>
        </div>
      </div>
      {mcpServers.length > 0 ? (
        mcpServers
          .filter((s) => s.isActive)
          .map((server) => (
            <div key={server.name} className="ant-dropdown-menu-item mcp-server-item">
              <div className="server-info">
                <div className="server-name">{server.name}</div>
                {server.description && (
                  <Tooltip title={server.description} placement="bottom">
                    <div className="server-description">{truncateText(server.description)}</div>
                  </Tooltip>
                )}
                {server.baseUrl && <div className="server-url">{server.baseUrl}</div>}
              </div>
              <Switch size="small" checked={enabledMCPs.includes(server)} onChange={() => onEnableMCP(server)} />
            </div>
          ))
      ) : (
        <div className="ant-dropdown-menu-item-group">
          <div className="ant-dropdown-menu-item no-results">{t('models.no_matches')}</div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <DropdownMenuStyle />
      <Dropdown
        dropdownRender={() => menu}
        trigger={['click']}
        open={isOpen}
        onOpenChange={setIsOpen}
        overlayClassName="mention-models-dropdown">
        <Tooltip placement="top" title="MCP Servers" arrow>
          <ToolbarButton type="text" ref={dropdownRef}>
            <i className="iconfont icon-mcp" style={{ fontSize: 18 }}></i>
          </ToolbarButton>
        </Tooltip>
      </Dropdown>
    </>
  )
}

const DropdownMenuStyle = createGlobalStyle`
  .mention-models-dropdown {
    .ant-dropdown-menu {
      max-height: 400px;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 4px 0;
      margin-bottom: 40px;
      position: relative;

      &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 10px;
        background: var(--color-scrollbar-thumb);

        &:hover {
          background: var(--color-scrollbar-thumb-hover);
        }
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      .no-results {
        padding: 8px 12px;
        color: var(--color-text-3);
        cursor: default;
        font-size: 14px;
        
        &:hover {
          background: none;
        }
      }

      .dropdown-header {
        padding: 8px 12px;
        border-bottom: 1px solid var(--color-border);
        margin-bottom: 4px;
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        h4 {
          margin: 0;
          color: var(--color-text-1);
          font-size: 14px;
          font-weight: 500;
        }
        
        .enable-all-container {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .enable-all-label {
            font-size: 12px;
            color: var(--color-text-3);
          }
        }
      }
      
      .mcp-server-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        
        .server-info {
          flex: 1;
          overflow: hidden;
          
          .server-name {
            font-weight: 500;
            font-size: 14px;
            color: var(--color-text-1);
          }
          
          .server-description {
            font-size: 12px;
            color: var(--color-text-3);
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .server-url {
            font-size: 11px;
            color: var(--color-text-4);
            margin-top: 2px;
          }
        }
      }
    }
  }
`

export default MCPToolsButton
