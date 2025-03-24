import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { HStack } from '@renderer/components/Layout'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useAppSelector } from '@renderer/store'
import { type MCPServer } from '@renderer/types'
import { Button, Space, Switch, Table, Tag, Tooltip, Typography } from 'antd'
import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { SettingContainer, SettingDivider, SettingGroup, SettingTitle } from '..'
import AddMcpServerPopup from './AddMcpServerPopup'

const AnimatedTable = styled(Table as any)`
  .inactive-row {
    opacity: 0.6;
    background-color: rgba(0, 0, 0, 0.05);
  }
`

const MCPSettings = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { Text } = Typography
  const mcpServers: MCPServer[] = useAppSelector((state) => state.mcp.servers)
  const [loadingServer, setLoadingServer] = useState<string | null>(null)

  const handleDelete = useCallback(
    (serverName: string) => {
      window.modal.confirm({
        title: t('settings.mcp.confirmDelete'),
        content: t('settings.mcp.confirmDeleteMessage'),
        onOk: async () => {
          try {
            await window.api.mcp.deleteServer(serverName)
            window.message.success(t('settings.mcp.deleteSuccess'))
          } catch (error) {
            window.message.error(t('settings.mcp.deleteError'))
          }
        }
      })
    },
    [t]
  )

  const handleToggleActive = useCallback(
    async (serverName: string, isActive: boolean) => {
      try {
        setLoadingServer(serverName)
        const updatedServer = mcpServers.find((server) => server.name === serverName)
        if (updatedServer) {
          const updatedServerWithActiveState = { ...updatedServer, isActive }
          await window.api.mcp.updateServer(updatedServerWithActiveState)
          window.message.success(
            isActive
              ? t('settings.mcp.serverActivated', { serverName })
              : t('settings.mcp.serverDeactivated', { serverName })
          )
        }
      } catch (error) {
        window.message.error(t('settings.mcp.toggleServerError', { serverName }))
        console.error('Toggle server active error:', error)
      } finally {
        setLoadingServer(null)
      }
    },
    [t, mcpServers]
  )

  const tableColumns = useMemo(
    () => [
      {
        title: t('settings.mcp.name'),
        dataIndex: 'name',
        key: 'name',
        width: '30%',
        render: (text: string, record: MCPServer) => (
          <Space>
            <Tag color={record.isActive ? 'green' : 'gray'}>
              {record.isActive ? t('settings.mcp.active') : t('settings.mcp.inactive')}
            </Tag>
            <Text strong={record.isActive}>{text}</Text>
          </Space>
        )
      },
      {
        title: t('settings.mcp.type'),
        key: 'type',
        width: '100px',
        render: (_: any, record: MCPServer) => <Tag color="cyan">{record.baseUrl ? 'SSE' : 'STDIO'}</Tag>
      },
      {
        title: t('settings.mcp.description'),
        dataIndex: 'description',
        key: 'description',
        width: 'auto',
        render: (text: string) => {
          if (!text) {
            return (
              <Text type="secondary" italic>
                {t('common.description')}
              </Text>
            )
          }

          return (
            <Typography.Paragraph
              ellipsis={{
                rows: 1,
                expandable: 'collapsible',
                symbol: t('common.more'),
                onExpand: () => {}, // Empty callback required for proper functionality
                tooltip: true
              }}
              style={{ marginBottom: 0 }}>
              {text}
            </Typography.Paragraph>
          )
        }
      },
      {
        title: t('settings.mcp.active'),
        dataIndex: 'isActive',
        key: 'isActive',
        width: '100px',
        render: (isActive: boolean, record: MCPServer) => (
          <Switch
            checked={isActive}
            loading={loadingServer === record.name}
            onChange={(checked) => handleToggleActive(record.name, checked)}
          />
        )
      },
      {
        title: t('settings.mcp.url'),
        dataIndex: 'url',
        key: 'url',
        width: '40%',
        render: (text: string) => (
          <Typography.Paragraph copyable ellipsis={{ tooltip: text }}>
            {text}
          </Typography.Paragraph>
        )
      },
      {
        title: t('settings.mcp.actions'),
        key: 'actions',
        width: '120px',
        render: (_: any, record: MCPServer) => (
          <Space>
            <Tooltip title={t('settings.mcp.edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  // TODO: 实现编辑服务器的逻辑
                }}
              />
            </Tooltip>
            <Tooltip title={t('settings.mcp.delete')}>
              <Button type="text" icon={<DeleteOutlined />} onClick={() => handleDelete(record.name)} />
            </Tooltip>
          </Space>
        )
      }
    ],
    [t, handleToggleActive, handleDelete, loadingServer, Text]
  )

  const [isAddServerModalVisible, setIsAddServerModalVisible] = useState(false)

  const handleAddServer = useCallback((serverData: MCPServer) => {
    window.api.mcp.addServer(serverData)
    setIsAddServerModalVisible(false)
  }, [])

  const rowStyle = useMemo(
    () => ({
      opacity: 0.6,
      backgroundColor: 'rgba(0, 0, 0, 0.05)'
    }),
    []
  )

  const animationVariants = useMemo(
    () => ({
      hidden: { opacity: 0, x: -20 },
      visible: (index: number) => ({
        opacity: 1,
        x: 0,
        transition: {
          delay: index * 0.1,
          duration: 0.3
        }
      })
    }),
    []
  )

  const renderAddServerPopup = () => {
    if (!isAddServerModalVisible) return null

    return (
      <AddMcpServerPopup
        visible={isAddServerModalVisible}
        onCancel={() => setIsAddServerModalVisible(false)}
        onSubmit={handleAddServer}
        server={undefined}
        create={true}
        resolve={() => {}}
      />
    )
  }

  // 在组件挂载时打印 debugInfo
  useEffect(() => {
    const debugInfo = {
      tableColumns: tableColumns.length,
      rowStyleOpacity: rowStyle.opacity,
      animationVariantsKeys: Object.keys(animationVariants)
    }
    console.log('MCP Settings Debug Info:', debugInfo)
  }, [tableColumns, rowStyle, animationVariants])

  return (
    <SettingContainer theme={theme}>
      {renderAddServerPopup()}
      <SettingGroup>
        <SettingTitle>{t('settings.mcp.title')}</SettingTitle>
        <SettingDivider />
        <HStack justifyContent="space-between" alignItems="center" mb={15}>
          <Text>{t('settings.mcp.description')}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddServerModalVisible(true)}>
            {t('settings.mcp.addServer')}
          </Button>
        </HStack>
        <AnimatedTable
          dataSource={mcpServers}
          columns={tableColumns}
          rowKey="name"
          pagination={false}
          size="small"
          locale={{ emptyText: t('settings.mcp.noServers') }}
          rowClassName={(record: MCPServer) => (!record.isActive ? 'inactive-row' : '')}
          onRow={(record: MCPServer, index) => ({
            style: !record.isActive ? rowStyle : {},
            className: 'animated-row',
            variants: animationVariants,
            custom: index,
            initial: 'hidden',
            animate: 'visible'
          })}
          style={{ marginTop: 15 }}
          components={{
            body: {
              row: motion.tr,
              cell: motion.td
            }
          }}
        />
      </SettingGroup>
    </SettingContainer>
  )
}

export default MCPSettings
