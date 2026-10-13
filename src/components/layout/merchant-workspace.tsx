import { Link } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Header } from './header'

export function MerchantWorkspaceHeader() {
  return (
    <Header fixed className='border-b bg-background'>
      <Search
        placeholder='ابحث في لوحة التاجر'
        className='h-9 min-w-0 rounded-lg border-transparent bg-muted/50 sm:h-10'
      />
      <ThemeSwitch />
      <ConfigDrawer />
      <ProfileDropdown />
    </Header>
  )
}

export function MerchantPageHeading({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6'>
      <div className='min-w-0'>
        <nav
          aria-label='مسار التنقل'
          className='mb-2 flex items-center gap-2 text-sm text-muted-foreground'
        >
          <Link
            to='/'
            className='rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring'
          >
            لوحة التاجر
          </Link>
          <span aria-hidden='true'>/</span>
          <span aria-current='page' className='font-medium text-foreground'>
            {title}
          </span>
        </nav>
        <h1 className='text-2xl font-bold tracking-tight sm:text-[1.75rem]'>
          {title}
        </h1>
        {description && (
          <p className='mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[0.9375rem]'>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className='flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end'>
          {actions}
        </div>
      )}
    </div>
  )
}
