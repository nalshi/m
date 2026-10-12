import { createFileRoute } from '@tanstack/react-router'
import { StoreSettings } from '@/features/store-settings'

export const Route = createFileRoute('/_authenticated/store-settings')({
  component: StoreSettings,
})
