import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { SignOutDialog } from './sign-out-dialog'

const { navigate, reset, logoutMerchantMock } = vi.hoisted(() => ({
  navigate: vi.fn(),
  reset: vi.fn(),
  logoutMerchantMock: vi.fn(),
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: { reset },
  }),
}))

vi.mock('@/features/store-settings/store-settings-data', () => ({
  logoutMerchant: logoutMerchantMock,
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

async function renderSignOutDialog(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <SignOutDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>
  )
}

describe('SignOutDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    logoutMerchantMock.mockResolvedValue(undefined)
  })

  it('calls the shared logout API and then clears auth and navigates to sign-in', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await renderSignOutDialog(onOpenChange)

    await userEvent.click(getByRole('button', { name: 'تسجيل الخروج' }))

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/sign-in',
        replace: true,
      })
    )
    expect(logoutMerchantMock).toHaveBeenCalledOnce()
    expect(reset).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not call reset or navigate when Cancel is clicked', async () => {
    const { getByRole } = await renderSignOutDialog()

    await userEvent.click(getByRole('button', { name: 'إلغاء' }))

    expect(reset).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(logoutMerchantMock).not.toHaveBeenCalled()
  })

  it('keeps the local session when the server cannot end it', async () => {
    logoutMerchantMock.mockRejectedValueOnce(new Error('offline'))
    const { getByRole } = await renderSignOutDialog()

    await userEvent.click(getByRole('button', { name: 'تسجيل الخروج' }))
    await vi.waitFor(() => expect(logoutMerchantMock).toHaveBeenCalledOnce())

    expect(reset).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
