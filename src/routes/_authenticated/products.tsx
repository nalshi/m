import { createFileRoute } from '@tanstack/react-router'
import { Products } from '@/features/products'

export const Route = createFileRoute('/_authenticated/products')({
  validateSearch: (search: Record<string, unknown>) =>
    ({
      create:
        search.create === true || search.create === 'true' ? true : undefined,
      manageCategories:
        search.manageCategories === true || search.manageCategories === 'true'
          ? true
          : undefined,
    }) as {
      create?: true
      manageCategories?: true
    },
  component: Products,
})
