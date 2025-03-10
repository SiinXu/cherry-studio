import { InfoCircleOutlined } from '@ant-design/icons'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAppDispatch } from '@renderer/store'
import {
  setEnableOWL,
  setOwlExternalResourcesApiKey,
  setOwlLanguageModelApiKey,
  setOwlLogLevel,
  setOwlModelProvider,
  setOwlSandboxBrowserMode,
  setOwlToolkits
} from '@renderer/store/settings'
import { Checkbox, Collapse, Divider, Input, Radio, Select, Space, Switch, Tooltip } from 'antd'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { SettingContainer, SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingTitle } from '..'

const OwlSettings: FC = () => {
  const {
    theme,
    advancedFeatures,
    enableOWL,
    owlLanguageModelApiKey,
    owlExternalResourcesApiKey,
    owlSandboxBrowserMode,
    owlModelProvider,
    owlToolkits,
    owlLogLevel
  } = useSettings()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  // 如果高级功能未启用，则不显示OWL设置
  if (!advancedFeatures) {
    return (
      <SettingContainer theme={theme}>
        <EmptyMessage>{t('owl.advanced_features_disabled')}</EmptyMessage>
      </SettingContainer>
    )
  }

  return (
    <SettingContainer theme={theme}>
      <SettingGroup theme={theme}>
        <SettingTitle>{t('owl.settings_title')}</SettingTitle>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>{t('owl.enable')}</SettingRowTitle>
          <Switch checked={enableOWL} onChange={(checked) => dispatch(setEnableOWL(checked))} />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            {t('owl.language_model_api_key')}
            <Tooltip title={t('owl.language_model_api_key_hint')}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-3)' }} />
            </Tooltip>
          </SettingRowTitle>
          <Input.Password
            placeholder={t('owl.api_key_placeholder')}
            value={owlLanguageModelApiKey}
            onChange={(e) => dispatch(setOwlLanguageModelApiKey(e.target.value))}
            style={{ width: '300px' }}
            disabled={!enableOWL}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            {t('owl.external_resources_api_key')}
            <Tooltip title={t('owl.external_resources_api_key_hint')}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-3)' }} />
            </Tooltip>
          </SettingRowTitle>
          <Input.Password
            placeholder={t('owl.api_key_placeholder')}
            value={owlExternalResourcesApiKey}
            onChange={(e) => dispatch(setOwlExternalResourcesApiKey(e.target.value))}
            style={{ width: '300px' }}
            disabled={!enableOWL}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            {t('owl.sandbox_browser_mode')}
            <Tooltip title={t('owl.sandbox_browser_mode_hint')}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-3)' }} />
            </Tooltip>
          </SettingRowTitle>
          <Select
            value={owlSandboxBrowserMode}
            onChange={(value) => dispatch(setOwlSandboxBrowserMode(value))}
            style={{ width: '200px' }}
            disabled={!enableOWL}
            options={[
              {
                value: 'iframe',
                label: t('owl.sandbox_mode.iframe')
              },
              {
                value: 'window',
                label: t('owl.sandbox_mode.window')
              },
              {
                value: 'tab',
                label: t('owl.sandbox_mode.tab')
              }
            ]}
          />
        </SettingRow>
      </SettingGroup>

      <SettingGroup theme={theme}>
        <SettingTitle>{t('owl.model_title')}</SettingTitle>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            {t('owl.model_provider')}
            <Tooltip title={t('owl.model_provider_hint')}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-3)' }} />
            </Tooltip>
          </SettingRowTitle>
          <Radio.Group
            value={owlModelProvider}
            onChange={(e) => dispatch(setOwlModelProvider(e.target.value))}
            disabled={!enableOWL}>
            <Space direction="vertical">
              <Radio value="openai">OpenAI (GPT-4)</Radio>
              <Radio value="anthropic">Anthropic (Claude)</Radio>
              <Radio value="google">Google (Gemini)</Radio>
              <Radio value="local">{t('owl.local_model')}</Radio>
            </Space>
          </Radio.Group>
        </SettingRow>
      </SettingGroup>

      <SettingGroup theme={theme}>
        <SettingTitle>{t('owl.toolkits_title')}</SettingTitle>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            {t('owl.enabled_toolkits')}
            <Tooltip title={t('owl.toolkits_description')}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-3)' }} />
            </Tooltip>
          </SettingRowTitle>
          <div>
            <Checkbox.Group
              value={owlToolkits}
              onChange={(values) => dispatch(setOwlToolkits(values))}
              disabled={!enableOWL}>
              <ToolkitOptions>
                <Checkbox value="web_search">{t('owl.toolkit.web_search')}</Checkbox>
                <Checkbox value="web_browser">{t('owl.toolkit.web_browser')}</Checkbox>
                <Checkbox value="code_interpreter">{t('owl.toolkit.code_interpreter')}</Checkbox>
                <Checkbox value="file_manager">{t('owl.toolkit.file_manager')}</Checkbox>
                <Checkbox value="image_generation">{t('owl.toolkit.image_generation')}</Checkbox>
                <Checkbox value="data_analysis">{t('owl.toolkit.data_analysis')}</Checkbox>
              </ToolkitOptions>
            </Checkbox.Group>
          </div>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            {t('owl.log_level')}
            <Tooltip title={t('owl.log_level_hint')}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-3)' }} />
            </Tooltip>
          </SettingRowTitle>
          <Select
            value={owlLogLevel}
            onChange={(value) => dispatch(setOwlLogLevel(value))}
            style={{ width: '200px' }}
            disabled={!enableOWL}
            options={[
              { value: 'debug', label: 'Debug' },
              { value: 'info', label: 'Info' },
              { value: 'warning', label: 'Warning' },
              { value: 'error', label: 'Error' }
            ]}
          />
        </SettingRow>
      </SettingGroup>

      <SettingGroup theme={theme}>
        <SettingTitle>{t('owl.advanced_options')}</SettingTitle>
        <SettingDivider />
        <Collapse ghost>
          <Collapse.Panel header={t('owl.advanced_configuration')} key="1" disabled={!enableOWL}>
            <AdvancedOptionsContent>
              <p>{t('owl.advanced_hint')}</p>
              <Divider plain>{t('owl.agent_behavior')}</Divider>
              <SettingRow>
                <SettingRowTitle>{t('owl.timeout_seconds')}</SettingRowTitle>
                <Input type="number" defaultValue="60" style={{ width: '100px' }} disabled={!enableOWL} />
              </SettingRow>
              <SettingRow>
                <SettingRowTitle>{t('owl.max_steps')}</SettingRowTitle>
                <Input type="number" defaultValue="20" style={{ width: '100px' }} disabled={!enableOWL} />
              </SettingRow>
            </AdvancedOptionsContent>
          </Collapse.Panel>
        </Collapse>
      </SettingGroup>

      <SettingGroup theme={theme}>
        <SettingTitle>{t('owl.security_title')}</SettingTitle>
        <SettingDivider />
        <SecurityNote>{t('owl.security_note')}</SecurityNote>
      </SettingGroup>
    </SettingContainer>
  )
}

const EmptyMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: var(--color-text-2);
`

// 已移除未使用的Hint组件

const ToolkitOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 10px;
  margin-bottom: 8px;
`

const AdvancedOptionsContent = styled.div`
  padding: 0 10px;
`

const SecurityNote = styled.div`
  padding: 10px;
  margin: 10px 0;
  background-color: var(--color-background-soft);
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-1);
`

export default OwlSettings
