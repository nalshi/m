import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { useAuthFlowStore } from '@/stores/auth-flow-store'
import { OtpForm } from './otp-form'

const { navigate, apiRequestMock, completeAuthSessionMock } = vi.hoisted(
  () => ({
    navigate: vi.fn(),
    apiRequestMock: vi.fn(),
    completeAuthSessionMock: vi.fn(),
  })
)

vi.mock('@/lib/auth-api', () => ({ authApiRequest: apiRequestMock }))
vi.mock('@/lib/complete-auth-session', () => ({
  completeAuthSession: completeAuthSessionMock,
}))
vi.mock('@tanstack/react-router', async (orig) => {
  const actual = await orig<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
    Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
  }
})

describe('OtpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthFlowStore.setState({
      identifier: '',
      phone: '771234567',
      context: 'register',
      stateToken: 'register-state',
      remember: true,
      registration: null,
    })
    apiRequestMock.mockResolvedValue({ status: 'success' })
  })

  it('validates the six-digit code and activates a registered account', async () => {
    const screen = await render(<OtpForm />)
    const otpInput = screen.getByRole('textbox', { name: 'رمز التحقق' })
    const submit = screen.getByRole('button', { name: 'تأكيد الرمز' })

    await userEvent.fill(otpInput, '12345')
    await userEvent.click(submit)
    await expect
      .element(screen.getByText('أدخل رمز التحقق المكوّن من 6 أرقام.'))
      .toBeInTheDocument()

    await userEvent.fill(otpInput, '123456')
    await userEvent.click(submit)
    await vi.waitFor(() =>
      expect(apiRequestMock).toHaveBeenCalledWith('register_verify', {
        otp: '123456',
        state_token: 'register-state',
      })
    )
    expect(navigate).toHaveBeenCalledWith({
      to: '/sign-in',
      replace: true,
    })
    expect(useAuthFlowStore.getState().context).toBeNull()
  })

  it('switches to the new-password step after recovery verification', async () => {
    useAuthFlowStore.setState({
      context: 'recover',
      stateToken: 'recover-state',
    })
    const screen = await render(<OtpForm />)
    await userEvent.fill(
      screen.getByRole('textbox', { name: 'رمز التحقق' }),
      '123456'
    )
    await userEvent.click(screen.getByRole('button', { name: 'تأكيد الرمز' }))

    await expect
      .element(screen.getByLabelText('كلمة المرور الجديدة'))
      .toBeInTheDocument()
    expect(useAuthFlowStore.getState().context).toBe('recover')
  })
})
