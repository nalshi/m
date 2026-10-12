import {
  LayoutDashboard,
  Package,
  Palette,
  Settings,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'التاجر',
    email: 'مساحة التاجر',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'نالش',
      logo: Store,
      plan: 'بوابة التاجر',
    },
  ],
  navGroups: [
    {
      title: 'إدارة المتجر',
      items: [
        {
          title: 'الرئيسية',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'المنتجات',
          url: '/products',
          icon: Package,
        },
        {
          title: 'الطلبات',
          url: '/orders',
          icon: ShoppingBag,
        },
        {
          title: 'قوالب المتجر',
          url: '/storefront',
          icon: Palette,
        },
        {
          title: 'الإعدادات',
          url: '/store-settings',
          icon: Settings,
        },
      ],
    },
  ],
}
