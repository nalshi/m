import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'

type TeamSwitcherProps = {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const activeTeam = teams[0]
  if (!activeTeam) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className='flex min-w-0 items-center gap-3 rounded-lg px-2 py-2.5'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground'>
            <activeTeam.logo className='size-5' aria-hidden='true' />
          </span>
          <span className='grid min-w-0 gap-1 text-start'>
            <span className='truncate text-sm font-bold'>
              {activeTeam.name}
            </span>
            <span className='truncate text-xs text-muted-foreground'>
              {activeTeam.plan}
            </span>
          </span>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
