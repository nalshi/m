import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'relative z-40 h-14 w-full sm:h-16',
        fixed && 'header-fixed peer/header sticky top-0',
        className
      )}
      {...props}
    >
      <div className='flex h-full min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-5 lg:px-7'>
        <SidebarTrigger
          variant='outline'
          className='size-9 shrink-0 rounded-lg sm:size-10'
        />
        <Separator orientation='vertical' className='h-5 shrink-0 sm:h-6' />
        {children}
      </div>
    </header>
  )
}
