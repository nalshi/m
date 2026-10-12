import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ForgotPasswordForm } from './components/forgot-password-form'

export function ForgotPassword() {
  return (
    <AuthLayout>
      <Card className='max-w-md gap-4 font-[Cairo]'>
        <CardHeader>
          <CardTitle className='text-xl tracking-tight'>
            استعادة كلمة المرور
          </CardTitle>
          <CardDescription>
            أدخل رقم الجوال المسجل في حسابك لإرسال رمز التحقق.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter>
          <p className='mx-auto px-8 text-center text-sm text-balance text-muted-foreground'>
            ليس لديك متجر؟{' '}
            <Link
              to='/sign-up'
              className='underline underline-offset-4 hover:text-primary'
            >
              أنشئ متجرك
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
