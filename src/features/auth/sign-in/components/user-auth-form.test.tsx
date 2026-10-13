import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { useAuthFlowStore } from '@/stores/auth-flow-store'
import { UserAuthForm } from './user-auth-form'

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

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
    Link: ({
      children,
      to,
      ...rest
    }: {
      children?: React.ReactNode
      to: string
    }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  }
})

describe('UserAuthForm', () => {
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
    apiRequestMock.mockImplementation(async (action: string) =>
      action === 'check_phone'
        ? { status: 'user_found', name: 'متجر الاختبار' }
        : {
            status: 'success',
            token: `head.${btoa(JSON.stringify({ exp: 2000000000 }))}.sig`,
          }
    )
  })

  it('advances from phone lookup to password after finding an account', async () => {
    const screen = await render(<UserAuthForm />)
    const identifier = screen.getByRole('textbox', {
      name: 'رقم الجوال أو اسم المستخدم',
    })
    expect(identifier).toHaveAttribute('aria-required', 'true')
    await userEvent.fill(identifier, '771234567')
    await userEvent.click(screen.getByRole('button', { name: 'متابعة' }))

    await expect
      .element(screen.getByLabelText(/كلمة المرور لـ متجر الاختبار/))
      .toBeInTheDocument()
    expect(apiRequestMock).toHaveBeenCalledWith('check_phone', {
      phone: '771234567',
    })
  })

  it('authenticates and redirects to the default route', async () => {
    const screen = await render(<UserAuthForm />)
    await userEvent.fill(
      screen.getByRole('textbox', { name: 'رقم الجوال أو اسم المستخدم' }),
      '771234567'
    )
    await userEvent.click(screen.getByRole('button', { name: 'متابعة' }))
    await userEvent.fill(
      screen.getByLabelText(/كلمة المرور لـ متجر الاختبار/),
      'secret'
    )
    await userEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }))

    await vi.waitFor(() =>
      expect(apiRequestMock).toHaveBeenCalledWith('login', {
        phone: '771234567',
        password: 'secret',
        remember: true,
      })
    )
    expect(completeAuthSessionMock).toHaveBeenCalledOnce()
    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true })
    )
  })

  it('sends an unknown phone number to store registration', async () => {
    apiRequestMock.mockResolvedValueOnce({ status: 'user_not_found' })
    const screen = await render(<UserAuthForm />)
    await userEvent.fill(
      screen.getByRole('textbox', { name: 'رقم الجوال أو اسم المستخدم' }),
      '771234567'
    )
    await userEvent.click(screen.getByRole('button', { name: 'متابعة' }))

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/sign-up',
        search: { phone: '771234567' },
      })
    )
  })

  it('returns to a requested local page after direct login', async () => {
    apiRequestMock.mockImplementation(async (action: string) =>
      action === 'check_phone'
        ? { status: 'user_found', name: 'متجر الاختبار' }
        : {
            status: 'success',
            token: `head.${btoa(JSON.stringify({ exp: 2000000000 }))}.sig`,
            redirect: 'https://external.example/',
          }
    )
    const screen = await render(<UserAuthForm redirectTo='/store-settings' />)
    await userEvent.fill(
      screen.getByRole('textbox', { name: 'رقم الجوال أو اسم المستخدم' }),
      '771234567'
    )
    await userEvent.click(screen.getByRole('button', { name: 'متابعة' }))
    await userEvent.fill(
      screen.getByLabelText(/كلمة المرور لـ متجر الاختبار/),
      'secret'
    )
    await userEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }))

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/store-settings',
        replace: true,
      })
    )
  })

  it('keeps the requested page while asking for new-device verification', async () => {
    apiRequestMock.mockImplementation(async (action: string) =>
      action === 'check_phone'
        ? { status: 'user_found' }
        : {
            status: 'new_device_otp_required',
            state_token: 'device-state',
          }
    )
    const screen = await render(<UserAuthForm redirectTo='/orders' />)
    await userEvent.fill(
      screen.getByRole('textbox', { name: 'رقم الجوال أو اسم المستخدم' }),
      '771234567'
    )
    await userEvent.click(screen.getByRole('button', { name: 'متابعة' }))
    await userEvent.fill(screen.getByLabelText(/كلمة المرور/), 'secret')
    await userEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }))

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/otp' })
    )
    expect(useAuthFlowStore.getState().redirectTo).toBe('/orders')
  })
})
