import { InfoCircleOutlined } from '@ant-design/icons'
import { useSettings } from '@renderer/hooks/useSettings'
import { RootState, useAppDispatch } from '@renderer/store'
import {
  setEnableOWL,
  setOwlChunkrApiKey,
  setOwlFirecrawlApiKey,
  setOwlGoogleApiKey,
  setOwlHfToken,
  setOwlLogLevel,
  setOwlModelProvider,
  setOwlSandboxBrowserMode,
  setOwlSearchEngineId,
  setOwlToolkits
} from '@renderer/store/settings'
import { safeFilter, safeMap } from '@renderer/utils/safeArrayUtils'
import { Checkbox, Collapse, Divider, Input, Select, Switch, Tooltip } from 'antd'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import { SettingContainer, SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingTitle } from '..'

const OwlSettings: FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  // 获取所有模型提供商和模型列表
  const providers = useSelector((state: RootState) => state.llm.providers)
  const allModels = useMemo(() => {
    return safeFilter(providers, (provider) => provider.enabled).flatMap((provider) =>
      safeMap(provider.models, (model) => ({
        ...model,
        providerName: provider.name,
        providerId: provider.id
      }))
    )
  }, [providers])

  const {
    theme,
    advancedFeatures,
    enableOWL,
    owlSandboxBrowserMode,
    owlModelProvider,
    owlToolkits,
    owlLogLevel,
    owlGoogleApiKey,
    owlSearchEngineId,
    owlHfToken,
    owlChunkrApiKey,
    owlFirecrawlApiKey
  } = useSettings()

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
          <Select
            placeholder={t('owl.select_model')}
            value={owlModelProvider}
            onChange={(value) => dispatch(setOwlModelProvider(value))}
            style={{ width: '250px' }}
            disabled={!enableOWL}
            options={[
              {
                label: t('owl.model_provider_groups.openai'),
                options: allModels
                  .filter((model) => model.providerId === 'openai' || model.providerId === 'azure-openai')
                  .map((model) => ({
                    label: `${model.name} (${model.providerName})`,
                    value: model.id
                  }))
              },
              {
                label: t('owl.model_provider_groups.anthropic'),
                options: allModels
                  .filter((model) => model.providerId === 'anthropic')
                  .map((model) => ({
                    label: `${model.name} (${model.providerName})`,
                    value: model.id
                  }))
              },
              {
                label: t('owl.model_provider_groups.google'),
                options: allModels
                  .filter((model) => model.providerId === 'gemini')
                  .map((model) => ({
                    label: `${model.name} (${model.providerName})`,
                    value: model.id
                  }))
              },
              {
                label: t('owl.model_provider_groups.local'),
                options: allModels
                  .filter((model) => ['ollama', 'lmstudio'].includes(model.providerId))
                  .map((model) => ({
                    label: `${model.name} (${model.providerName})`,
                    value: model.id
                  }))
              },
              {
                label: t('owl.model_provider_groups.other'),
                options: allModels
                  .filter(
                    (model) =>
                      !['openai', 'azure-openai', 'anthropic', 'gemini', 'ollama', 'lmstudio'].includes(
                        model.providerId
                      )
                  )
                  .map((model) => ({
                    label: `${model.name} (${model.providerName})`,
                    value: model.id
                  }))
              }
            ]}
          />
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
                <Checkbox value="document_processing">{t('owl.toolkit.document_processing')}</Checkbox>
                <Checkbox value="image_analysis">{t('owl.toolkit.image_analysis')}</Checkbox>
                <Checkbox value="video_analysis">{t('owl.toolkit.video_analysis')}</Checkbox>
                <Checkbox value="audio_analysis">{t('owl.toolkit.audio_analysis')}</Checkbox>
                <Checkbox value="data_analysis">{t('owl.toolkit.data_analysis')}</Checkbox>
                <Checkbox value="excel_toolkit">{t('owl.toolkit.excel_toolkit')}</Checkbox>
                <Checkbox value="quality_evaluation">{t('owl.toolkit.quality_evaluation')}</Checkbox>
                <Checkbox value="gaia_role_playing">{t('owl.toolkit.gaia_role_playing')}</Checkbox>
                <Checkbox value="autonomous_agent">{t('owl.toolkit.autonomous_agent')}</Checkbox>
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
        <SettingTitle>{t('owl.service_api_keys')}</SettingTitle>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            {t('owl.google_api_key')}
            <Tooltip title={t('owl.google_api_key_hint')}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-3)' }} />
            </Tooltip>
          </SettingRowTitle>
          <Input.Password
            placeholder={t('owl.api_key_placeholder')}
            value={owlGoogleApiKey}
            onChange={(e) => dispatch(setOwlGoogleApiKey(e.target.value))}
            style={{ width: '300px' }}
            disabled={!enableOWL}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            {t('owl.search_engine_id')}
            <Tooltip title={t('owl.search_engine_id_hint')}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-3)' }} />
            </Tooltip>
          </SettingRowTitle>
          <Input
            placeholder={t('owl.search_engine_id_placeholder')}
            value={owlSearchEngineId}
            onChange={(e) => dispatch(setOwlSearchEngineId(e.target.value))}
            style={{ width: '300px' }}
            disabled={!enableOWL}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            {t('owl.huggingface_token')}
            <Tooltip title={t('owl.huggingface_token_hint')}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-3)' }} />
            </Tooltip>
          </SettingRowTitle>
          <Input.Password
            placeholder={t('owl.api_key_placeholder')}
            value={owlHfToken}
            onChange={(e) => dispatch(setOwlHfToken(e.target.value))}
            style={{ width: '300px' }}
            disabled={!enableOWL}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            {t('owl.chunkr_api_key')}
            <Tooltip title={t('owl.chunkr_api_key_hint')}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-3)' }} />
            </Tooltip>
          </SettingRowTitle>
          <Input.Password
            placeholder={t('owl.api_key_placeholder')}
            value={owlChunkrApiKey}
            onChange={(e) => dispatch(setOwlChunkrApiKey(e.target.value))}
            style={{ width: '300px' }}
            disabled={!enableOWL}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            {t('owl.firecrawl_api_key')}
            <Tooltip title={t('owl.firecrawl_api_key_hint')}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--color-text-3)' }} />
            </Tooltip>
          </SettingRowTitle>
          <Input.Password
            placeholder={t('owl.api_key_placeholder')}
            value={owlFirecrawlApiKey}
            onChange={(e) => dispatch(setOwlFirecrawlApiKey(e.target.value))}
            style={{ width: '300px' }}
            disabled={!enableOWL}
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
