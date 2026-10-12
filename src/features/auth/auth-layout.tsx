import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <div
      dir='rtl'
      className='relative container grid min-h-svh max-w-none items-center justify-center py-8 font-[Cairo]'
    >
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='absolute end-4 top-4'
        aria-label={
          resolvedTheme === 'dark'
            ? 'التبديل إلى الوضع الفاتح'
            : 'التبديل إلى الوضع الداكن'
        }
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
      </Button>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:p-8'>
        <div className='mb-4 flex flex-col items-center justify-center text-primary'>
          <span className='text-4xl leading-none font-black'>نالش</span>
          <span className='mt-1 text-xs font-bold tracking-[0.35em]'>
            NALSH
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
