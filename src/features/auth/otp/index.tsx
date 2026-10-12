import { Link } from '@tanstack/react-router'
import { useAuthFlowStore } from '@/stores/auth-flow-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { OtpForm } from './components/otp-form'

export function Otp() {
  const context = useAuthFlowStore((state) => state.context)

  return (
    <AuthLayout>
      <Card className='max-w-md gap-4 font-[Cairo]'>
        <CardHeader>
          <CardTitle className='text-xl tracking-tight'>
            {context === 'login_otp' ? 'تأكيد الجهاز' : 'رمز التحقق'}
          </CardTitle>
          <CardDescription>
            أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه إلى رقم جوالك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OtpForm />
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            لم يصلك الرمز؟{' '}
            <Link
              to='/sign-in'
              className='font-medium text-primary underline underline-offset-4'
            >
              العودة لتسجيل الدخول
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
