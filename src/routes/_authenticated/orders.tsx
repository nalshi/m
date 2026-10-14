import { createFileRoute } from '@tanstack/react-router'
import { Orders } from '@/features/orders'

export const Route = createFileRoute('/_authenticated/orders')({
  validateSearch: (
    search: Record<string, unknown>
  ): { orderId?: string; filter?: 'active' | 'archived' } => ({
    ...(typeof search.orderId === 'string' ? { orderId: search.orderId } : {}),
    ...(search.filter === 'archived'
      ? { filter: 'archived' }
      : search.filter === 'active'
        ? { filter: 'active' }
        : {}),
  }),
  component: Orders,
})
