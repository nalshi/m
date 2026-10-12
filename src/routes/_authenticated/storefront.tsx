import { createFileRoute } from '@tanstack/react-router'
import { Storefront } from '@/features/storefront'

export const Route = createFileRoute('/_authenticated/storefront')({
  component: Storefront,
})
