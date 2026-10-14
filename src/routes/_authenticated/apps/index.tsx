import z from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/apps/')({
  validateSearch: z.object({
    type: z
      .enum(['all', 'connected', 'notConnected'])
      .optional()
      .catch(undefined),
    filter: z.string().optional().catch(''),
    sort: z.enum(['asc', 'desc']).optional().catch(undefined),
  }),
  beforeLoad: () => {
    throw redirect({ to: '/store-settings', replace: true })
  },
})
