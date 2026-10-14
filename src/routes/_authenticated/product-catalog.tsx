import { createFileRoute } from '@tanstack/react-router'
import { ProductCatalog } from '@/features/products'

export const Route = createFileRoute('/_authenticated/product-catalog')({
  component: ProductCatalog,
})
