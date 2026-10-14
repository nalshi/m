import { createFileRoute } from '@tanstack/react-router'
import { PreviousOrders } from '@/features/orders'

export const Route = createFileRoute('/_authenticated/previous-orders')({
  validateSearch: (search: Record<string, unknown>): { orderId?: string } => ({
    ...(typeof search.orderId === 'string' ? { orderId: search.orderId } : {}),
  }),
  component: PreviousOrders,
})
