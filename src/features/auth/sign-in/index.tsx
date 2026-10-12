import { useEffect } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { restoreAuthSession } from '@/lib/complete-auth-session'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { TermsDialog } from '../terms-dialog'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })
  const navigate = useNavigate()

  useEffect(() => {
    const localToken = localStorage.getItem('merchant_token')
    const sessionToken = sessionStorage.getItem('merchant_token')
    const token = localToken || sessionToken
    if (!token) return

    if (restoreAuthSession(token, Boolean(localToken))) {
      void navigate({ to: redirect || '/', replace: true })
    } else {
      localStorage.removeItem('merchant_token')
      sessionStorage.removeItem('merchant_token')
      useAuthStore.getState().auth.reset()
    }
  }, [navigate, redirect])

  return (
    <AuthLayout>
      <Card className='w-full max-w-md gap-4 font-[Cairo]'>
        <CardHeader>
          <CardTitle className='text-xl tracking-tight'>بوابة التاجر</CardTitle>
          <CardDescription>
            سجّل الدخول لإدارة متجرك وطلباتك. ليس لديك متجر؟{' '}
            <Link
              to='/sign-up'
              className='font-semibold text-primary underline underline-offset-4'
            >
              أنشئ متجرك الآن
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter>
          <p className='w-full text-center text-xs text-muted-foreground'>
            باستخدامك المنصة فإنك توافق على <TermsDialog />.
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
