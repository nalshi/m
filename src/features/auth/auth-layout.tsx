import {
  ClipboardList,
  Moon,
  PackageCheck,
  Settings2,
  Store,
  Sun,
} from 'lucide-react'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <main
      dir='rtl'
      className='relative min-h-svh bg-background px-4 py-16 font-[Cairo] sm:px-6 sm:py-20 lg:px-8 lg:py-8'
    >
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='absolute end-4 top-4 z-10 size-11 sm:end-6 sm:top-6 lg:end-8 lg:top-8'
        aria-label={
          resolvedTheme === 'dark'
            ? 'التبديل إلى الوضع الفاتح'
            : 'التبديل إلى الوضع الداكن'
        }
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
      </Button>

      <div className='mx-auto grid w-full max-w-6xl gap-6 xl:min-h-[min(760px,calc(100svh-4rem))] xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.82fr)] xl:items-stretch xl:gap-10'>
        <aside className='relative flex min-h-40 flex-col justify-between overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground sm:min-h-44 sm:p-7 xl:sticky xl:top-8 xl:h-[calc(100svh-4rem)] xl:max-h-[760px] xl:min-h-[560px] xl:p-10'>
          <div className='flex items-center gap-3'>
            <span className='flex size-11 items-center justify-center rounded-xl bg-primary-foreground/10'>
              <Store className='size-5' aria-hidden='true' />
            </span>
            <div>
              <p className='text-2xl leading-none font-black'>نالش</p>
              <p
                className='mt-1 text-[10px] font-bold tracking-[0.3em] opacity-75'
                dir='ltr'
              >
                NALSH
              </p>
            </div>
          </div>

          <div className='mt-6 max-w-sm lg:mt-auto lg:pb-10'>
            <h1 className='text-2xl leading-relaxed font-bold text-balance sm:text-3xl'>
              متجرك، وعملياتك اليومية في مكان واحد
            </h1>
            <p className='mt-2 text-sm leading-7 opacity-80 sm:text-base'>
              تابع الطلبات، ونظّم منتجاتك، واضبط واجهة متجرك من لوحة واحدة.
            </p>

            <ul className='mt-6 hidden gap-4 text-sm xl:mt-10 xl:grid'>
              <li className='flex items-center gap-3'>
                <ClipboardList
                  className='size-4 shrink-0 opacity-80'
                  aria-hidden='true'
                />
                <span>الطلبات وحالاتها</span>
              </li>
              <li className='flex items-center gap-3'>
                <PackageCheck
                  className='size-4 shrink-0 opacity-80'
                  aria-hidden='true'
                />
                <span>المنتجات والمخزون</span>
              </li>
              <li className='flex items-center gap-3'>
                <Settings2
                  className='size-4 shrink-0 opacity-80'
                  aria-hidden='true'
                />
                <span>إعدادات المتجر وواجهته</span>
              </li>
            </ul>
          </div>
        </aside>

        <section className='flex min-w-0 items-center justify-center xl:py-8'>
          <div className='w-full min-w-0'>{children}</div>
        </section>
      </div>
    </main>
  )
}
