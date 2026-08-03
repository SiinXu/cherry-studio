import ProviderApiKeyListDrawer from '@renderer/pages/settings/ProviderSettings/ConnectionSettings/ProviderApiKeyListDrawer'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { updateApiKeysMock, toastErrorMock, toastWarningMock } = vi.hoisted(() => ({
  updateApiKeysMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastWarningMock: vi.fn()
}))

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<object>()

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key
    })
  }
})

vi.mock('@logger', () => ({
  loggerService: {
    withContext: () => ({
      error: vi.fn()
    })
  }
}))

vi.mock('@renderer/services/toast', () => ({
  toast: {
    error: toastErrorMock,
    warning: toastWarningMock
  }
}))

vi.mock('@renderer/hooks/useProvider', () => ({
  useProviderApiKeys: () => ({
    data: { keys: [] }
  }),
  useProviderMutations: () => ({
    updateApiKeys: updateApiKeysMock
  })
}))

vi.mock('../../primitives/ProviderSettingsDrawer', () => ({
  default: ({ children, footer, open }: any) =>
    open ? (
      <div>
        {children}
        {footer}
      </div>
    ) : null
}))

describe('ProviderApiKeyListDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateApiKeysMock.mockResolvedValue(undefined)
  })

  it('saves new API key drafts as enabled by default', async () => {
    const user = userEvent.setup()
    render(<ProviderApiKeyListDrawer providerId="openai" open onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'common.add' }))
    await user.type(screen.getByPlaceholderText('settings.provider.api.key.new_key.placeholder'), ' sk-new ')
    await user.click(screen.getByRole('button', { name: 'common.save' }))

    await waitFor(() => {
      expect(updateApiKeysMock).toHaveBeenCalledWith([
        expect.objectContaining({
          key: 'sk-new',
          isEnabled: true
        })
      ])
    })
  })

  it('does not persist API key drafts that cannot be used in HTTP headers', async () => {
    const user = userEvent.setup()
    render(<ProviderApiKeyListDrawer providerId="openai" open onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'common.add' }))
    await user.type(screen.getByPlaceholderText('settings.provider.api.key.new_key.placeholder'), 'sk-密钥')
    await user.click(screen.getByRole('button', { name: 'common.save' }))

    await waitFor(() => {
      expect(toastWarningMock).toHaveBeenCalled()
    })
    expect(updateApiKeysMock).not.toHaveBeenCalled()
  })
})
