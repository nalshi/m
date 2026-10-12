import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { useAuthFlowStore } from '@/stores/auth-flow-store'
import { ForgotPasswordForm } from './forgot-password-form'

const { navigate, apiRequestMock } = vi.hoisted(() => ({
  navigate: vi.fn(),
  apiRequestMock: vi.fn(),
}))

vi.mock('@/lib/auth-api', () => ({ authApiRequest: apiRequestMock }))
vi.mock('@tanstack/react-router', async (orig) => {
  const actual = await orig<typeof import('@tanstack/react-router')>()
  return { ...actual, useNavigate: () => navigate }
})

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthFlowStore.setState({
      identifier: '',
      phone: '',
      context: null,
      stateToken: '',
      remember: true,
      registration: null,
    })
    apiRequestMock.mockResolvedValue({
      status: 'success',
      state_token: 'recover-state',
    })
  })

  it('starts phone-based password recovery and opens OTP verification', async () => {
    const screen = await render(<ForgotPasswordForm />)
    await userEvent.fill(
      screen.getByRole('textbox', { name: 'رقم الجوال' }),
      '+967 77 123 4567'
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'إرسال رمز التحقق' })
    )

    await vi.waitFor(() =>
      expect(apiRequestMock).toHaveBeenCalledWith('recover_init', {
        phone: '771234567',
      })
    )
    expect(useAuthFlowStore.getState().context).toBe('recover')
    expect(navigate).toHaveBeenCalledWith({ to: '/otp' })
  })
})
