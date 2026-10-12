import { Link, useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { SignUpForm } from './components/sign-up-form'

export function SignUp() {
  const { phone } = useSearch({ from: '/(auth)/sign-up' })

  return (
    <AuthLayout>
      <Card className='w-full max-w-2xl gap-4 font-[Cairo]'>
        <CardHeader>
          <CardTitle className='text-xl tracking-tight'>
            إنشاء متجر جديد
          </CardTitle>
          <CardDescription>
            أكمل البيانات لإطلاق متجرك الإلكتروني. لديك متجر بالفعل؟{' '}
            <Link
              to='/sign-in'
              className='font-semibold text-primary underline underline-offset-4'
            >
              تسجيل الدخول
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm initialPhone={phone} />
        </CardContent>
        <CardFooter>
          <p className='w-full text-center text-xs text-muted-foreground'>
            لن يُنشأ المتجر حتى يتم تأكيد رقم الجوال برمز التحقق.
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
