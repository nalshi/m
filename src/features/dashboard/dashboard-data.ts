import { authApiRequest } from '@/lib/auth-api'
import type { ApiResult } from '@/lib/merchant-api'

type ApiRecord = Record<string, unknown>

export type ProductOption = {
  id: string
  name: string
  quantityType: 'tracked' | 'unlimited'
  quantity: number
  useMainImage: boolean
  image: string
  customPrice: number | null
}

export type DashboardProduct = {
  id: string
  productNumber: string
  name: string
  description: string
  type: string
  categoryId: string
  image: string
  price: number
  costPrice: number
  discount: number
  currency: string
  createdAt: string
  quantity: number
  quantityType: 'tracked' | 'unlimited'
  isAvailable: boolean
  approvalStatus: string
  options: ProductOption[]
}

export type DashboardCategory = {
  id: string
  name: string
  parentId: string
}

export type DashboardOrder = {
  id: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  deliveryMapUrl: string
  total: number
  deliveryFee: number
  currency: string
  status: string
  createdAt: string
  items: DashboardOrderItem[]
}

export type DashboardOrderItem = {
  id: string
  name: string
  image: string
  quantity: number
  price: number
  costPrice: number
}

export type DashboardData = {
  storeName: string
  username: string
  phone: string
  products: DashboardProduct[]
  activeOrders: DashboardOrder[]
  archivedOrders: DashboardOrder[]
}

function asRecord(value: unknown): ApiRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as ApiRecord)
    : null
}

function readString(...values: unknown[]): string {
  const value = values.find(
    (candidate) => typeof candidate === 'string' && candidate.trim()
  )
  return typeof value === 'string' ? value.trim() : ''
}

function readIdentifier(...values: unknown[]): string {
  const value = values.find(
    (candidate) =>
      (typeof candidate === 'string' && candidate.trim()) ||
      (typeof candidate === 'number' && Number.isFinite(candidate))
  )
  return value === undefined || value === null ? '' : String(value)
}

function readNumber(value: unknown): number {
  const number =
    typeof value === 'number' ? value : Number.parseFloat(String(value))
  return Number.isFinite(number) ? number : 0
}

function readRows(result: ApiResult, action: string): ApiRecord[] {
  if (result.status !== 'success' && result.status !== 'ok') {
    throw new Error(result.message || `تعذر تحميل ${action}.`)
  }

  const data = result.data
  const record = asRecord(data)
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(result.products)
      ? result.products
      : Array.isArray(result.orders)
        ? result.orders
        : Array.isArray(record?.products)
          ? record.products
          : Array.isArray(record?.orders)
            ? record.orders
            : Array.isArray(record?.categories)
              ? record.categories
              : Array.isArray(record?.results)
                ? record.results
                : null

  if (!rows) throw new Error(`صيغة بيانات ${action} غير متوقعة.`)
  return rows.map((row) => {
    const item = asRecord(row)
    if (!item) throw new Error(`تحتوي بيانات ${action} على عنصر غير صالح.`)
    return item
  })
}

function normalizeSettings(result: ApiResult) {
  if (result.status !== 'success' && result.status !== 'ok') {
    throw new Error(result.message || 'تعذر تحميل بيانات المتجر.')
  }

  const merchant = asRecord(result.data)
  if (!merchant) throw new Error('صيغة بيانات المتجر غير متوقعة.')

  let settings = asRecord(merchant.settings)
  if (!settings && typeof merchant.settings === 'string') {
    try {
      settings = asRecord(JSON.parse(merchant.settings) as unknown)
    } catch {
      throw new Error('صيغة إعدادات المتجر غير صالحة.')
    }
  }

  return {
    storeName: readString(merchant.store_name, merchant.name) || 'متجري',
    username: readString(merchant.username, merchant.store_username).replace(
      /^@/,
      ''
    ),
    phone: readString(
      merchant.phone,
      settings?.phone,
      settings?.whatsapp,
      settings?.whatsappNumber
    ),
  }
}

function normalizeOptions(value: unknown): ProductOption[] {
  let options = value
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options) as unknown
    } catch {
      throw new Error('صيغة خيارات أحد المنتجات غير صالحة.')
    }
  }
  if (!Array.isArray(options)) return []

  return options.flatMap((candidate, index) => {
    const option = asRecord(candidate)
    if (!option) return []
    return [
      {
        id: readIdentifier(option.id) || `option-${index}`,
        name: readString(option.name),
        quantityType:
          option.quantity_type === 'unlimited' ? 'unlimited' : 'tracked',
        quantity: readNumber(option.quantity),
        useMainImage:
          option.use_main_image === true ||
          option.use_main_image === 1 ||
          option.use_main_image === '1' ||
          !readString(option.image),
        image: readString(option.image),
        customPrice:
          option.custom_price === null || option.custom_price === undefined
            ? null
            : readNumber(option.custom_price),
      },
    ]
  })
}

function normalizeProducts(result: ApiResult): DashboardProduct[] {
  return readRows(result, 'المنتجات')
    .map((product) => ({
      id: readIdentifier(
        product.id,
        product.global_product_id,
        product.product_id
      ),
      productNumber: readIdentifier(product.product_number),
      name: readString(product.name, product.product_name) || 'منتج بدون اسم',
      description: readString(product.description, product.mainDescription),
      type:
        readString(product.type, product.category_name, product.category) ||
        'عام',
      categoryId: readIdentifier(product.category_id),
      image: readString(product.image, product.image_url, product.imageUrl),
      price: readNumber(product.price),
      costPrice: readNumber(product.cost_price),
      discount: readNumber(product.discount),
      currency: readString(product.currency) || 'YER',
      createdAt: readString(
        product.created_at,
        product.createdAt,
        product.updated_at,
        product.updatedAt
      ),
      quantity:
        product.quantity_type === 'unlimited'
          ? 9999
          : readNumber(product.quantity),
      quantityType:
        product.quantity_type === 'unlimited'
          ? ('unlimited' as const)
          : ('tracked' as const),
      isAvailable:
        product.is_available === true ||
        product.is_available === 1 ||
        product.is_available === '1' ||
        product.isAvailable === true ||
        product.isAvailable === 1 ||
        product.isAvailable === '1' ||
        (product.is_available === undefined &&
          product.isAvailable === undefined),
      approvalStatus: readString(product.approval_status) || 'approved',
      options: normalizeOptions(product.options),
    }))
    .filter((product) => product.id)
    .sort(
      (left, right) =>
        (Date.parse(right.createdAt) || 0) - (Date.parse(left.createdAt) || 0)
    )
}

function normalizeOrders(result: ApiResult): DashboardOrder[] {
  return readRows(result, 'الطلبات')
    .map((order) => ({
      id: readIdentifier(order.id, order.ticket_id),
      customerName:
        readString(order.customer_name, order.customerName) || 'عميل',
      customerPhone: readString(order.customer_phone, order.phone),
      deliveryAddress: readString(
        order.delivery_address_text,
        order.delivery_address,
        order.address
      ),
      deliveryMapUrl: readString(
        order.delivery_gps_link,
        order.delivery_map_url,
        order.map_url
      ),
      total: readNumber(order.total_amount ?? order.total),
      deliveryFee: readNumber(order.delivery_fee),
      currency: readString(order.currency) || 'YER',
      status: readString(order.status),
      createdAt: readString(
        order.created_at,
        order.createdAt,
        order.updated_at
      ),
      items: normalizeOrderItems(order.items),
    }))
    .filter((order) => order.id)
    .sort(
      (left, right) =>
        (Date.parse(right.createdAt) || 0) - (Date.parse(left.createdAt) || 0)
    )
}

function normalizeOrderItems(value: unknown): DashboardOrderItem[] {
  let items = value
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items) as unknown
    } catch {
      throw new Error('صيغة منتجات أحد الطلبات غير صالحة.')
    }
  }
  if (items === undefined || items === null) return []
  if (!Array.isArray(items))
    throw new Error('صيغة منتجات أحد الطلبات غير صالحة.')
  return items.flatMap((candidate, index) => {
    const item = asRecord(candidate)
    if (!item) return []
    return [
      {
        id: readIdentifier(item.id, item.product_id) || `item-${index}`,
        name: readString(item.product_name, item.name) || 'منتج',
        image: readString(item.image, item.image_url),
        quantity: Math.max(1, readNumber(item.quantity) || 1),
        price: readNumber(item.price),
        costPrice: readNumber(item.cost_price),
      },
    ]
  })
}

function normalizeCategories(result: ApiResult): DashboardCategory[] {
  return readRows(result, 'الفئات')
    .map((category) => ({
      id: readIdentifier(category.id),
      name: readString(category.name),
      parentId:
        readIdentifier(category.parent_id) === '0'
          ? ''
          : readIdentifier(category.parent_id),
    }))
    .filter((category) => category.id && category.name)
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [
    settingsResult,
    productsResult,
    activeOrdersResult,
    archivedOrdersResult,
  ] = await Promise.all([
    authApiRequest('get_merchant_settings', {}),
    authApiRequest('list_products', { page: 1, limit: 1000, term: '' }),
    authApiRequest('get_orders', { filter: 'active' }),
    authApiRequest('get_orders', { filter: 'archived' }),
  ])

  return {
    ...normalizeSettings(settingsResult),
    products: normalizeProducts(productsResult),
    activeOrders: normalizeOrders(activeOrdersResult),
    archivedOrders: normalizeOrders(archivedOrdersResult),
  }
}

export async function fetchDashboardProducts(): Promise<DashboardProduct[]> {
  const result = await authApiRequest('list_products', {
    page: 1,
    limit: 1000,
    term: '',
  })
  return normalizeProducts(result)
}

export async function fetchDashboardCategories(): Promise<DashboardCategory[]> {
  return normalizeCategories(await authApiRequest('get_categories_tree', {}))
}

export async function fetchDashboardOrders(
  filter: 'active' | 'archived'
): Promise<DashboardOrder[]> {
  return normalizeOrders(await authApiRequest('get_orders', { filter }))
}

export async function updateDashboardOrderStatus(
  ticketId: string,
  status: 'confirmed_by_store' | 'out_for_delivery'
): Promise<string> {
  const result = await authApiRequest('update_order_status', {
    ticket_id: ticketId,
    status,
  })
  if (result.status !== 'success') {
    throw new Error(result.message || 'تعذر تحديث حالة الطلب.')
  }
  return result.message || ''
}

export async function cancelDashboardOrder(ticketId: string): Promise<string> {
  const result = await authApiRequest('cancel_order', {
    ticket_id: ticketId,
    reason: 'تم الإلغاء من قبل المتجر',
  })
  if (result.status !== 'success') {
    throw new Error(result.message || 'تعذر إلغاء الطلب.')
  }
  return result.message || ''
}

export async function confirmDashboardOrderDelivery(
  ticketId: string,
  code: string
): Promise<string> {
  if (!/^\d{4}$/.test(code)) {
    throw new Error('أدخل كود تسليم صحيحاً من 4 أرقام.')
  }
  const result = await authApiRequest('confirm_delivery_code', {
    ticket_id: ticketId,
    code,
  })
  if (result.status !== 'success') {
    throw new Error(result.message || 'تعذر تأكيد تسليم الطلب.')
  }
  return result.message || ''
}

export async function fetchDashboardUsername(): Promise<string> {
  const result = await authApiRequest('get_merchant_settings', {})
  if (result.status !== 'success' && result.status !== 'ok') {
    throw new Error(result.message || 'تعذر تحميل رابط المتجر.')
  }
  const merchant = asRecord(result.data)
  const username = readString(
    merchant?.username,
    merchant?.store_username
  ).replace(/^@/, '')
  if (!username) throw new Error('اسم المستخدم للمتجر غير متوفر.')
  return username
}

export async function saveDashboardProduct(payload: FormData): Promise<string> {
  const result = await authApiRequest('save_product', payload)
  if (result.status !== 'success' && result.status !== 'ok') {
    throw new Error(result.message || 'تعذر حفظ المنتج.')
  }
  return readIdentifier(result.id) || String(payload.get('id') || '')
}

export async function deleteDashboardProduct(id: string): Promise<void> {
  const result = await authApiRequest('delete_product', {
    id,
    product_id: id,
  })
  if (result.status !== 'success' && result.status !== 'ok') {
    throw new Error(result.message || 'تعذر حذف المنتج.')
  }
}

export async function updateDashboardAvailability(
  productId: string,
  isAvailable: boolean
): Promise<void> {
  const result = await authApiRequest('toggle_availability', {
    id: productId,
    product_id: productId,
    is_available: isAvailable ? 1 : 0,
    isAvailable: isAvailable ? 1 : 0,
  })
  if (result.status !== 'success' && result.status !== 'ok') {
    throw new Error(result.message || 'تعذر تحديث إتاحة المنتج.')
  }
}

export async function compressDashboardImage(
  file: File,
  quality = 0.8
): Promise<Blob> {
  const signature = await file.slice(0, 12).arrayBuffer()
  const header = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
  const supported =
    header.startsWith('FFD8FF') ||
    header.startsWith('89504E47') ||
    (header.startsWith('52494646') && header.slice(16, 24) === '57454250') ||
    header.startsWith('47494638')
  if (!supported) {
    throw new Error('صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP أو GIF.')
  }

  const image = new Image()
  const objectUrl = URL.createObjectURL(file)
  try {
    image.src = objectUrl
    await image.decode()
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('تعذر تجهيز الصورة.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality)
    )
    if (!blob) throw new Error('تعذر ضغط الصورة.')
    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function uploadDashboardImage(file: File): Promise<string> {
  const webp = await compressDashboardImage(file)
  const payload = new FormData()
  payload.append('image_data', webp, 'product.webp')
  const result = await authApiRequest('upload_image', payload)
  const record = asRecord(result.data)
  const url = readString(result.url, record?.url, record?.image)
  if (result.status !== 'success' || !url) {
    throw new Error(result.message || 'تعذر رفع الصورة.')
  }
  return url
}

export function buildPendingCategoryChain(
  categories: DashboardCategory[],
  leafId: string
) {
  const names: string[] = []
  let currentId = leafId
  const visited = new Set<string>()

  while (currentId.startsWith('NEW:') && !visited.has(currentId)) {
    visited.add(currentId)
    const node = categories.find((category) => category.id === currentId)
    if (!node) break
    names.unshift(node.name)
    currentId = node.parentId
  }

  return {
    names,
    anchorId: currentId && !currentId.startsWith('NEW:') ? currentId : '0',
  }
}
