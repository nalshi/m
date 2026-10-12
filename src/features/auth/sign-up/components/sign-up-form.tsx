import { useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, LocateFixed, Map, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAuthFlowStore,
  type MerchantRegistration,
} from '@/stores/auth-flow-store'
import { authApiRequest } from '@/lib/auth-api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { TermsDialog } from '@/features/auth/terms-dialog'

const mapUrlPattern =
  /^(https?:\/\/)?(www\.)?(google\.com\/maps|maps\.google\.com|goo\.gl\/maps|maps\.app\.goo\.gl)\/?.*$/i

const formSchema = z.object({
  phone: z.string().min(1, 'أدخل رقم الجوال.'),
  name: z.string().trim().min(1, 'أدخل اسم المتجر.'),
  username: z
    .string()
    .min(1, 'أدخل اسم المستخدم.')
    .regex(
      /^[a-z0-9_]+$/,
      'استخدم الأحرف الإنجليزية والأرقام والشرطة السفلية فقط.'
    ),
  storeType: z.string().min(1, 'اختر نوع النشاط.'),
  otherStoreType: z.string().optional(),
  location: z
    .string()
    .trim()
    .min(1, 'أدخل رابط موقع المتجر.')
    .regex(mapUrlPattern, 'أدخل رابطًا صحيحًا من خرائط Google.'),
  password: z.string().min(8, 'كلمة المرور يجب ألا تقل عن 8 أحرف.'),
  terms: z.boolean().refine(Boolean, 'يجب الموافقة على الشروط والأحكام.'),
})

type SignUpFormProps = React.HTMLAttributes<HTMLFormElement> & {
  initialPhone?: string
}

export function SignUpForm({
  className,
  initialPhone = '',
  ...props
}: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const navigate = useNavigate()
  const flow = useAuthFlowStore()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: initialPhone,
      name: '',
      username: '',
      storeType: '',
      otherStoreType: '',
      location: '',
      password: '',
      terms: false,
    },
  })

  const storeType = useWatch({
    control: form.control,
    name: 'storeType',
  })
  const username = useWatch({
    control: form.control,
    name: 'username',
  })

  async function locateStore() {
    if (!navigator.geolocation) {
      toast.error('تحديد الموقع غير مدعوم في هذا المتصفح.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue(
          'location',
          `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`,
          { shouldValidate: true }
        )
        setLocating(false)
      },
      () => {
        toast.error('تعذر تحديد موقعك. يمكنك إدخال رابط خرائط Google يدويًا.')
        setLocating(false)
      },
      { enableHighAccuracy: true }
    )
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let phone = values.phone.replace(/\D/g, '')
    if (phone.startsWith('967')) phone = phone.slice(3)
    if (phone.startsWith('0')) phone = phone.slice(1)
    if (phone.length !== 9) {
      form.setError('phone', { message: 'رقم الجوال يجب أن يتكون من 9 أرقام.' })
      return
    }
    const resolvedStoreType =
      values.storeType === 'other'
        ? values.otherStoreType?.trim() || ''
        : values.storeType
    if (!resolvedStoreType) {
      form.setError('otherStoreType', { message: 'اكتب نوع النشاط.' })
      return
    }

    const registration: MerchantRegistration = {
      phone,
      role: 'merchant',
      name: values.name.trim(),
      username: values.username.trim().toLowerCase(),
      password: values.password,
      location: values.location.trim(),
      store_type: resolvedStoreType,
    }
    setIsLoading(true)
    try {
      const response = await authApiRequest('register_init', registration)
      if (response.status !== 'success_otp_sent') {
        throw new Error(response.message || 'تعذر بدء تسجيل المتجر.')
      }
      flow.beginFlow({
        context: 'register',
        phone,
        stateToken: response.state_token || '',
        registration,
      })
      toast.success('أرسلنا رمز التحقق إلى رقم جوالك.')
      await navigate({ to: '/otp' })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'تعذر الاتصال بالخادم.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn('grid gap-3', className)}
          dir='rtl'
          {...props}
        >
          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم الجوال (للواتساب والطلبات)</FormLabel>
                <FormControl>
                  <Input
                    inputMode='tel'
                    autoComplete='tel'
                    placeholder='77XXXXXXX'
                    dir='ltr'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المتجر</FormLabel>
                <FormControl>
                  <Input placeholder='مثال: متجر الأناقة' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المستخدم (رابط المتجر)</FormLabel>
                <FormControl>
                  <Input
                    autoComplete='username'
                    placeholder='mystore_123'
                    dir='ltr'
                    {...field}
                    onChange={(event) => {
                      field.onChange(
                        event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, '')
                      )
                    }}
                  />
                </FormControl>
                {username && (
                  <p className='text-xs text-muted-foreground' dir='ltr'>
                    {window.location.host}/{username}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='storeType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع النشاط</FormLabel>
                <FormControl>
                  <select
                    className='h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
                    {...field}
                  >
                    <option value=''>اختر نوع النشاط</option>
                    <option value='مطاعم ومأكولات'>مطاعم ومأكولات</option>
                    <option value='إلكترونيات وجوالات'>
                      إلكترونيات وجوالات
                    </option>
                    <option value='أزياء وملابس'>أزياء وملابس</option>
                    <option value='سوبر ماركت وبقالة'>سوبر ماركت وبقالة</option>
                    <option value='عطور وتجميل'>عطور وتجميل</option>
                    <option value='صيدليات وأدوية'>صيدليات وأدوية</option>
                    <option value='متنوع'>متنوع</option>
                    <option value='other'>أخرى</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {storeType === 'other' && (
            <FormField
              control={form.control}
              name='otherStoreType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>حدد نوع النشاط</FormLabel>
                  <FormControl>
                    <Input placeholder='اكتب نوع النشاط' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name='location'
            render={({ field }) => (
              <FormItem>
                <FormLabel>موقع المتجر (Google Maps)</FormLabel>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() =>
                      window.open(
                        'https://www.google.com/maps',
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    <Map />
                    الخرائط
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={locateStore}
                    disabled={locating}
                    aria-label='تحديد موقعي'
                  >
                    {locating ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      <LocateFixed />
                    )}
                  </Button>
                </div>
                <FormControl>
                  <Input
                    type='text'
                    inputMode='url'
                    placeholder='https://maps.google.com/...'
                    dir='ltr'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>كلمة المرور (8 أحرف على الأقل)</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete='new-password'
                    placeholder='أدخل كلمة مرور قوية'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='terms'
            render={({ field }) => (
              <FormItem>
                <div className='flex items-start gap-2 rounded-md border p-3'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label='أوافق على الشروط والأحكام'
                    />
                  </FormControl>
                  <div className='text-sm'>
                    <span>أوافق على </span>
                    <TermsDialog triggerClassName='font-semibold text-primary underline underline-offset-4' />
                    <FormMessage />
                  </div>
                </div>
              </FormItem>
            )}
          />
          <Button className='mt-1' disabled={isLoading}>
            {isLoading ? <Loader2 className='animate-spin' /> : <Rocket />}
            إنشاء المتجر
          </Button>
        </form>
      </Form>
    </>
  )
}
