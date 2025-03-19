import { useAppSelector } from '@renderer/store'
import { MCPServer } from '@renderer/types'
import { Form, Input, Modal, Radio, Switch } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ShowParams {
  server?: MCPServer
  create?: boolean
}

interface Props extends ShowParams {
  resolve: (data: any) => void
  visible: boolean
  onCancel: () => void
  onSubmit: (serverData: MCPServer) => void
}

interface MCPFormValues {
  name: string
  description?: string
  serverType: 'sse' | 'stdio'
  baseUrl?: string
  command?: string
  args?: string
  env?: string
  isActive: boolean
}

const AddMcpServerPopup: FC<Props> = ({ server, create, resolve, visible, onCancel, onSubmit }) => {
  const [open, setOpen] = useState(visible)
  const { t } = useTranslation()
  const [serverType, setServerType] = useState<'sse' | 'stdio'>('stdio')
  const mcpServers = useAppSelector((state) => state.mcp.servers)
  const [form] = Form.useForm<MCPFormValues>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setOpen(visible)
  }, [visible])

  useEffect(() => {
    if (server) {
      const type = server.baseUrl ? 'sse' : 'stdio'
      setServerType(type)

      form.setFieldsValue({
        name: server.name,
        description: server.description,
        serverType: type,
        baseUrl: server.baseUrl || '',
        command: server.command || '',
        args: server.args ? server.args.join('\n') : '',
        env: server.env
          ? Object.entries(server.env)
              .map(([key, value]) => `${key}=${value}`)
              .join('\n')
          : '',
        isActive: server.isActive
      })
    }
  }, [server, form])

  useEffect(() => {
    const type = form.getFieldValue('serverType')
    type && setServerType(type)
  }, [form])

  const onOK = async () => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      const mcpServer: MCPServer = {
        name: values.name,
        description: values.description,
        isActive: values.isActive
      }

      if (values.serverType === 'sse') {
        mcpServer.baseUrl = values.baseUrl
      } else {
        mcpServer.command = values.command
        mcpServer.args = values.args ? values.args.split('\n').filter((arg) => arg.trim() !== '') : []

        const env: Record<string, string> = {}
        if (values.env) {
          values.env.split('\n').forEach((line) => {
            if (line.trim()) {
              const [key, ...chunks] = line.split('=')
              const value = chunks.join('=')
              if (key && value) {
                env[key.trim()] = value.trim()
              }
            }
          })
        }
        mcpServer.env = Object.keys(env).length > 0 ? env : undefined
      }

      if (server && !create) {
        try {
          await window.api.mcp.updateServer(mcpServer)
          window.message.success(t('settings.mcp.updateSuccess'))
          setLoading(false)
          setOpen(false)
          form.resetFields()
          onSubmit(mcpServer)
        } catch (error: any) {
          window.message.error(`${t('settings.mcp.updateError')}: ${error.message}`)
          setLoading(false)
        }
      } else {
        // Check for duplicate name
        if (mcpServers.some((server: MCPServer) => server.name === mcpServer.name)) {
          window.message.error(t('settings.mcp.duplicateName'))
          setLoading(false)
          return
        }

        try {
          await window.api.mcp.addServer(mcpServer)
          window.message.success(t('settings.mcp.addSuccess'))
          setLoading(false)
          setOpen(false)
          form.resetFields()
          onSubmit(mcpServer)
        } catch (error: any) {
          window.message.error(`${t('settings.mcp.addError')}: ${error.message}`)
          setLoading(false)
        }
      }
    } catch (error: any) {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setOpen(false)
    onCancel()
  }

  const onClose = () => {
    resolve({})
  }

  return (
    <Modal
      title={server ? t('settings.mcp.editServer') : t('settings.mcp.addServer')}
      open={open}
      onOk={onOK}
      onCancel={handleCancel}
      afterClose={onClose}
      confirmLoading={loading}
      maskClosable={false}
      width={600}
      transitionName="ant-move-down"
      centered>
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t('settings.mcp.name')}
          rules={[{ required: true, message: t('settings.mcp.nameRequired') }]}>
          <Input disabled={!!server} placeholder={t('common.name')} />
        </Form.Item>

        <Form.Item name="description" label={t('settings.mcp.description')}>
          <TextArea rows={2} placeholder={t('common.description')} />
        </Form.Item>

        <Form.Item name="serverType" label={t('settings.mcp.type')} rules={[{ required: true }]} initialValue="stdio">
          <Radio.Group
            onChange={(e) => setServerType(e.target.value)}
            options={[
              { label: 'SSE (Server-Sent Events)', value: 'sse' },
              { label: 'STDIO (Standard Input/Output)', value: 'stdio' }
            ]}
          />
        </Form.Item>

        {serverType === 'sse' && (
          <Form.Item
            name="baseUrl"
            label={t('settings.mcp.url')}
            rules={[{ required: serverType === 'sse', message: t('settings.mcp.baseUrlRequired') }]}
            tooltip={t('settings.mcp.baseUrlTooltip')}>
            <Input placeholder="http://localhost:3000/sse" />
          </Form.Item>
        )}

        {serverType === 'stdio' && (
          <>
            <Form.Item
              name="command"
              label={t('settings.mcp.command')}
              rules={[{ required: serverType === 'stdio', message: t('settings.mcp.commandRequired') }]}>
              <Input placeholder="uvx or npx" />
            </Form.Item>

            <Form.Item name="args" label={t('settings.mcp.args')} tooltip={t('settings.mcp.argsTooltip')}>
              <TextArea rows={3} placeholder={`arg1\narg2`} style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </>
        )}

        <Form.Item name="isActive" label={t('settings.mcp.active')} valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AddMcpServerPopup
