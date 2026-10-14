import { useEffect } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { getSafeAuthRedirect } from '@/lib/auth-redirect'
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
      void navigate({
        to: getSafeAuthRedirect(redirect),
        replace: true,
      })
    } else {
      localStorage.removeItem('merchant_token')
      sessionStorage.removeItem('merchant_token')
      useAuthStore.getState().auth.reset()
    }
  }, [navigate, redirect])

  return (
    <AuthLayout>
      <Card className='mx-auto w-full max-w-xl gap-0 overflow-hidden py-0 font-[Cairo]'>
        <CardHeader className='gap-2 px-5 pt-6 pb-4 sm:px-7 sm:pt-8 sm:pb-5'>
          <CardTitle className='text-2xl tracking-tight sm:text-3xl'>
            مرحبًا بعودتك
          </CardTitle>
          <CardDescription className='text-sm leading-7'>
            سجّل الدخول لمتابعة متجرك وطلباته. ليس لديك متجر بعد؟{' '}
            <Link
              to='/sign-up'
              className='font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary'
            >
              أنشئ متجرًا جديدًا
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className='px-5 pb-6 sm:px-7 sm:pb-7'>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter className='border-t bg-muted/20 px-5 py-4 sm:px-7 sm:py-5'>
          <p className='w-full text-center text-xs leading-6 text-muted-foreground'>
            باستخدامك المنصة فإنك توافق على <TermsDialog />.
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
