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
      <Card className='mx-auto w-full max-w-2xl gap-5 font-[Cairo]'>
        <CardHeader>
          <CardTitle className='text-2xl tracking-tight sm:text-3xl'>
            أنشئ متجرك
          </CardTitle>
          <CardDescription className='text-sm leading-7'>
            أدخل بيانات المتجر ورقم جوالك للبدء. لديك متجر بالفعل؟{' '}
            <Link
              to='/sign-in'
              className='font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary'
            >
              تسجيل الدخول
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm initialPhone={phone} />
        </CardContent>
        <CardFooter className='border-t pt-4'>
          <p className='w-full text-center text-xs leading-6 text-muted-foreground'>
            لن يُنشأ المتجر حتى يتم تأكيد رقم الجوال برمز التحقق.
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
