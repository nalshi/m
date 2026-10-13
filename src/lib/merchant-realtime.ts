import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRealtimeStore, type RealtimeStatus } from '@/stores/realtime-store'
import { clearAuthApiCache } from '@/lib/auth-api'
import {
  normalizeRealtimeCategories,
  normalizeRealtimeMerchant,
  normalizeRealtimeOrders,
  normalizeRealtimeProducts,
  type DashboardData,
  type DashboardOrder,
  type DashboardProduct,
} from '@/features/dashboard/dashboard-data'

declare global {
  interface Window {
    dashboardSocketForceDirect?: boolean
  }
}

type RealtimeMessage = Record<string, unknown> & {
  event?: string
  type?: string
}

const snapshotStorageKey = 'merchant_realtime_snapshot'

function getSessionIdentity(token: string) {
  try {
    const encoded = token.split('.')[1]
    if (!encoded) return ''
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    ) as Record<string, unknown>
    const expiresAt = Number(payload.exp) * 1000
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return ''
    return String(payload.user_id || payload.accountNo || '')
  } catch {
    return ''
  }
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function updateProductList(
  products: DashboardProduct[],
  product: DashboardProduct
) {
  const index = products.findIndex((item) => item.id === product.id)
  if (index < 0) return [product, ...products]
  return products.map((item) => (item.id === product.id ? product : item))
}

function updateOrderList(orders: DashboardOrder[], order: DashboardOrder) {
  const index = orders.findIndex((item) => item.id === order.id)
  if (index < 0) return [order, ...orders]
  return orders.map((item) => (item.id === order.id ? order : item))
}

function syncSnapshot(queryClient: QueryClient, snapshot: RealtimeMessage) {
  clearAuthApiCache()
  void queryClient.cancelQueries({ queryKey: ['merchant-dashboard-home'] })
  void queryClient.cancelQueries({ queryKey: ['merchant-products'] })
  void queryClient.cancelQueries({ queryKey: ['merchant-orders'] })
  void queryClient.cancelQueries({ queryKey: ['merchant-product-categories'] })
  const existing = queryClient.getQueryData<DashboardData>([
    'merchant-dashboard-home',
  ])
  const hasProducts = Array.isArray(snapshot.products)
  const hasActiveOrders = Array.isArray(snapshot.orders)
  const hasArchivedOrders = Array.isArray(snapshot.archivedOrders)
  const hasSettings = Boolean(readRecord(snapshot.settings))
  let dashboardData = existing

  if (hasProducts) {
    const products = normalizeRealtimeProducts(snapshot.products)
    queryClient.setQueryData(['merchant-products'], products)
    queryClient.setQueryData(['merchant-dashboard-products'], products)
    try {
      sessionStorage.setItem(
        'merchant_products_cache',
        JSON.stringify(snapshot.products)
      )
    } catch {
      // Session storage may be disabled or full; the in-memory query cache remains usable.
    }
    dashboardData = {
      ...(dashboardData || {
        storeName: 'متجري',
        username: '',
        phone: '',
        activeOrders: [],
        archivedOrders: [],
      }),
      products,
    }
  }

  if (hasActiveOrders) {
    const orders = normalizeRealtimeOrders(snapshot.orders)
    queryClient.setQueryData(['merchant-orders', 'active'], orders)
    try {
      sessionStorage.setItem(
        'merchant_active_orders_cache',
        JSON.stringify(snapshot.orders)
      )
    } catch {
      // Session storage may be disabled or full; the in-memory query cache remains usable.
    }
    dashboardData = {
      ...(dashboardData || {
        storeName: 'متجري',
        username: '',
        phone: '',
        products: [],
        archivedOrders: [],
      }),
      activeOrders: orders,
    }
  }

  if (hasArchivedOrders) {
    const orders = normalizeRealtimeOrders(snapshot.archivedOrders)
    queryClient.setQueryData(['merchant-orders', 'archived'], orders)
    try {
      sessionStorage.setItem(
        'merchant_archived_orders_cache',
        JSON.stringify(snapshot.archivedOrders)
      )
    } catch {
      // Session storage may be disabled or full; the in-memory query cache remains usable.
    }
    dashboardData = {
      ...(dashboardData || {
        storeName: 'متجري',
        username: '',
        phone: '',
        products: [],
        activeOrders: [],
      }),
      archivedOrders: orders,
    }
  }

  if (hasSettings) {
    const merchant = normalizeRealtimeMerchant(snapshot.settings)
    queryClient.setQueryData(['merchant-store-username'], merchant.username)
    dashboardData = {
      ...(dashboardData || {
        products: [],
        activeOrders: [],
        archivedOrders: [],
      }),
      ...merchant,
    }
    queryClient.invalidateQueries({ queryKey: ['merchant-store-settings'] })
    queryClient.invalidateQueries({ queryKey: ['merchant-storefront-library'] })
    try {
      sessionStorage.setItem(
        'merchant_settings_cache',
        JSON.stringify(snapshot.settings)
      )
    } catch {
      // Session storage may be disabled or full; the in-memory query cache remains usable.
    }
  }

  if (Array.isArray(snapshot.categories)) {
    queryClient.setQueryData(
      ['merchant-product-categories'],
      normalizeRealtimeCategories(snapshot.categories)
    )
  }

  if (dashboardData) {
    queryClient.setQueryData(['merchant-dashboard-home'], dashboardData)
  }

  try {
    sessionStorage.setItem(
      snapshotStorageKey,
      JSON.stringify({
        identity: getSessionIdentityFromStorage(),
        savedAt: Date.now(),
        data: snapshot,
      })
    )
  } catch {
    // Session storage may be disabled or full; the live connection still works.
  }
}

function getSessionIdentityFromStorage() {
  return (
    localStorage.getItem('merchant_token') ||
    sessionStorage.getItem('merchant_token') ||
    ''
  )
}

function syncEvent(queryClient: QueryClient, message: RealtimeMessage) {
  const product = readRecord(message.product)
  const order = readRecord(message.order)

  if (message.event === 'product_updated' && product) {
    const [normalized] = normalizeRealtimeProducts([product])
    if (!normalized) return
    const products =
      queryClient.getQueryData<DashboardProduct[]>(['merchant-products']) || []
    const nextProducts = updateProductList(products, normalized)
    queryClient.setQueryData(['merchant-products'], nextProducts)
    queryClient.setQueryData(['merchant-dashboard-products'], nextProducts)
    queryClient.setQueryData<DashboardData>(
      ['merchant-dashboard-home'],
      (current) => (current ? { ...current, products: nextProducts } : current)
    )
    return
  }

  if (message.event === 'product_removed' && message.product_id !== undefined) {
    const productId = String(message.product_id)
    const products =
      queryClient.getQueryData<DashboardProduct[]>(['merchant-products']) || []
    const nextProducts = products.filter((item) => item.id !== productId)
    queryClient.setQueryData(['merchant-products'], nextProducts)
    queryClient.setQueryData(['merchant-dashboard-products'], nextProducts)
    queryClient.setQueryData<DashboardData>(
      ['merchant-dashboard-home'],
      (current) => (current ? { ...current, products: nextProducts } : current)
    )
    return
  }

  if (message.event === 'order_updated' && order) {
    const [normalized] = normalizeRealtimeOrders([order])
    if (!normalized) return
    const active =
      queryClient.getQueryData<DashboardOrder[]>([
        'merchant-orders',
        'active',
      ]) || []
    const archived =
      queryClient.getQueryData<DashboardOrder[]>([
        'merchant-orders',
        'archived',
      ]) || []
    const isArchived =
      normalized.status === 'completed' || normalized.status === 'cancelled'
    const wasKnown = [...active, ...archived].some(
      (item) => item.id === normalized.id
    )
    const nextActive = isArchived
      ? active.filter((item) => item.id !== normalized.id)
      : updateOrderList(active, normalized)
    const nextArchived = isArchived
      ? updateOrderList(archived, normalized)
      : archived.filter((item) => item.id !== normalized.id)

    queryClient.setQueryData(['merchant-orders', 'active'], nextActive)
    queryClient.setQueryData(['merchant-orders', 'archived'], nextArchived)
    queryClient.setQueryData<DashboardData>(
      ['merchant-dashboard-home'],
      (current) =>
        current
          ? {
              ...current,
              activeOrders: nextActive,
              archivedOrders: nextArchived,
            }
          : current
    )

    if (!wasKnown && normalized.status === 'pending_merchant_approval') {
      toast.info(`وصل طلب جديد من ${normalized.customerName}.`, {
        duration: 8_000,
      })
    }
    return
  }

  if (message.event === 'settings_updated') {
    clearAuthApiCache()
    queryClient.invalidateQueries({ queryKey: ['merchant-store-settings'] })
    queryClient.invalidateQueries({ queryKey: ['merchant-dashboard-home'] })
    queryClient.invalidateQueries({ queryKey: ['merchant-storefront-library'] })
    return
  }

  if (message.event === 'merchant_message') {
    const incoming = readRecord(message.message)
    if (incoming) {
      const customerName =
        typeof incoming.customer_name === 'string'
          ? incoming.customer_name
          : 'عميل'
      toast.info(`رسالة واتساب جديدة من ${customerName}.`)
    }
  }
}

function updateStoredSnapshot(token: string, message: RealtimeMessage) {
  try {
    const cached = JSON.parse(
      sessionStorage.getItem(snapshotStorageKey) || 'null'
    ) as {
      identity?: string
      savedAt?: number
      data?: RealtimeMessage
    } | null
    if (cached?.identity !== token || !cached.data) return

    const snapshot = cached.data
    if (message.event === 'product_updated' && readRecord(message.product)) {
      const products = Array.isArray(snapshot.products) ? snapshot.products : []
      const updated = readRecord(message.product)!
      const updatedId = String(updated.id ?? updated.product_id ?? '')
      const index = products.findIndex((item) => {
        const record = readRecord(item)
        return String(record?.id ?? record?.product_id ?? '') === updatedId
      })
      if (index < 0) products.unshift(updated)
      else products[index] = updated
      snapshot.products = products
    } else if (
      message.event === 'product_removed' &&
      message.product_id !== undefined &&
      Array.isArray(snapshot.products)
    ) {
      const productId = String(message.product_id)
      snapshot.products = snapshot.products.filter((item) => {
        const record = readRecord(item)
        return String(record?.id ?? record?.product_id ?? '') !== productId
      })
    } else if (message.event === 'order_updated' && readRecord(message.order)) {
      const updated = readRecord(message.order)!
      const updatedId = String(updated.id ?? updated.ticket_id ?? '')
      const isArchived =
        updated.status === 'completed' || updated.status === 'cancelled'
      const active = Array.isArray(snapshot.orders) ? snapshot.orders : []
      const archived = Array.isArray(snapshot.archivedOrders)
        ? snapshot.archivedOrders
        : []
      const withoutOrder = (orders: unknown[]) =>
        orders.filter((item) => {
          const record = readRecord(item)
          return String(record?.id ?? record?.ticket_id ?? '') !== updatedId
        })
      snapshot.orders = isArchived
        ? withoutOrder(active)
        : [updated, ...withoutOrder(active)]
      snapshot.archivedOrders = isArchived
        ? [updated, ...withoutOrder(archived)]
        : withoutOrder(archived)
    } else if (
      message.event === 'settings_updated' &&
      readRecord(message.settings)
    ) {
      snapshot.settings = message.settings
    }

    sessionStorage.setItem(
      snapshotStorageKey,
      JSON.stringify({ ...cached, savedAt: Date.now(), data: snapshot })
    )
  } catch (error) {
    // Persisted snapshots are optional; failures do not affect the live query cache.
    // eslint-disable-next-line no-console
    console.error('تعذر حفظ آخر نسخة من بيانات الاتصال اللحظي.', error)
  }
}

function setStatus(status: RealtimeStatus, detail = '') {
  useRealtimeStore.getState().setStatus(status, detail)
}

export function startMerchantRealtime(queryClient: QueryClient) {
  let stopped = false
  let socket: WebSocket | null = null
  let pingTimer: number | undefined
  let reconnectTimer: number | undefined
  let sharedWorkerTimer: number | undefined
  let sharedPort: MessagePort | null = null
  let sharedWorkerActive = false
  let reconnectAttempt = 0
  const token =
    localStorage.getItem('merchant_token') ||
    sessionStorage.getItem('merchant_token') ||
    ''
  const merchantId = getSessionIdentity(token)

  if (!token || !merchantId) {
    setStatus('disconnected', 'لا تتوفر بيانات جلسة التاجر')
    return () => {}
  }

  const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const socketOrigin = `${scheme}//${window.location.host}`

  function scheduleReconnect() {
    if (stopped || reconnectTimer !== undefined || !navigator.onLine) return
    reconnectAttempt += 1
    const delay = Math.min(
      25_000,
      1_000 * 1.8 ** Math.min(reconnectAttempt - 1, 5)
    )
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = undefined
      void connect()
    }, delay)
  }

  function handleMessage(raw: unknown) {
    if (typeof raw !== 'string') return
    let message: RealtimeMessage
    try {
      message = JSON.parse(raw) as RealtimeMessage
    } catch {
      return
    }

    if (message.type === 'pong') return
    if (message.event === 'initial_load') {
      syncSnapshot(queryClient, message)
      setStatus('connected', 'متصل لحظيًا')
      return
    }
    if (message.event === 'session_resume') {
      try {
        const cached = JSON.parse(
          sessionStorage.getItem(snapshotStorageKey) || 'null'
        ) as {
          identity?: string
          savedAt?: number
          data?: RealtimeMessage
        } | null
        if (
          cached?.identity === token &&
          cached.data &&
          cached.savedAt &&
          Date.now() - cached.savedAt < 10 * 60_000
        ) {
          syncSnapshot(queryClient, cached.data)
        } else {
          queryClient.invalidateQueries({
            queryKey: ['merchant-dashboard-home'],
          })
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? `تعذر استعادة لقطة البيانات: ${error.message}`
            : 'تعذر استعادة لقطة البيانات اللحظية.'
        )
      }
      setStatus('connected', 'تم استئناف الجلسة اللحظية')
      return
    }
    if (message.event === 'error') {
      setStatus(
        'disconnected',
        typeof message.message === 'string'
          ? message.message
          : 'تعذر تجهيز بيانات الاتصال اللحظي'
      )
      return
    }
    syncEvent(queryClient, message)
    updateStoredSnapshot(token, message)
  }

  async function fetchTicket() {
    const response = await fetch('/api/worker/ws/ticket', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) return ''
    const result: unknown = await response.json()
    const ticket = readRecord(result)?.ticket
    return typeof ticket === 'string' ? ticket : ''
  }

  function buildSocketUrl(ticket: string) {
    return ticket
      ? `${socketOrigin}/api/worker/ws?ticket=${encodeURIComponent(ticket)}&m=${encodeURIComponent(merchantId)}`
      : `${socketOrigin}/api/worker/ws?merchant_id=${encodeURIComponent(merchantId)}&token=${encodeURIComponent(token)}`
  }

  function connectSharedWorker() {
    if (
      typeof SharedWorker !== 'function' ||
      window.dashboardSocketForceDirect
    ) {
      return false
    }

    try {
      const sharedWorker = new SharedWorker(
        '/js/dashboard/realtime-worker.js',
        { name: 'nalsh-merchant-realtime' }
      )
      const port = sharedWorker.port
      sharedPort = port
      port.onmessage = (event: MessageEvent<unknown>) => {
        let message: Record<string, unknown> | null
        if (typeof event.data === 'string') {
          try {
            message = JSON.parse(event.data) as Record<string, unknown>
          } catch {
            return
          }
        } else {
          message = readRecord(event.data)
        }
        if (!message) return

        if (sharedWorkerTimer !== undefined) {
          window.clearTimeout(sharedWorkerTimer)
          sharedWorkerTimer = undefined
        }
        sharedWorkerActive = true
        if (message.type === 'status') {
          const status =
            message.status === 'connected'
              ? 'connected'
              : message.status === 'connecting'
                ? 'connecting'
                : navigator.onLine
                  ? 'disconnected'
                  : 'offline'
          setStatus(
            status,
            typeof message.detail === 'string' ? message.detail : ''
          )
          return
        }
        if (message.type === 'snapshot' || message.type === 'session_resume') {
          handleMessage(JSON.stringify(message.data))
          return
        }
        if (message.type === 'event') {
          handleMessage(JSON.stringify(message.data))
          return
        }
        if (message.type === 'error') {
          setStatus(
            'disconnected',
            typeof message.message === 'string'
              ? message.message
              : 'حدث خطأ في الاتصال اللحظي'
          )
        }
      }
      port.start()
      sharedWorker.addEventListener('error', () => {
        if (sharedPort !== port || stopped) return
        sharedWorkerActive = false
        sharedPort = null
        port.close()
        void connect()
      })

      void fetchTicket()
        .catch(() => '')
        .then((ticket) => {
          if (stopped || sharedPort !== port) return
          port.postMessage({
            action: 'init',
            socketUrl: buildSocketUrl(ticket),
            merchantId,
            token: '',
          })
          sharedWorkerTimer = window.setTimeout(() => {
            sharedWorkerTimer = undefined
            if (!sharedWorkerActive && !stopped) {
              sharedPort?.postMessage({ action: 'close_port' })
              sharedPort?.close()
              sharedPort = null
              void connect()
            }
          }, 12_000)
        })

      return true
    } catch {
      sharedPort = null
      sharedWorkerActive = false
      return false
    }
  }

  async function connect() {
    if (stopped || !navigator.onLine) {
      setStatus('offline', 'لا يوجد اتصال بالإنترنت')
      return
    }
    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    setStatus('connecting', 'جاري إنشاء الاتصال اللحظي...')
    try {
      let ticket = ''
      try {
        ticket = await fetchTicket()
      } catch {
        ticket = ''
      }
      if (stopped) return

      const nextSocket = new WebSocket(buildSocketUrl(ticket))
      socket = nextSocket
      nextSocket.addEventListener('open', () => {
        if (socket !== nextSocket || stopped) {
          nextSocket.close(1000, 'اتصال قديم')
          return
        }
        reconnectAttempt = 0
        setStatus('connecting', 'القناة مفتوحة، بانتظار مزامنة البيانات...')
        nextSocket.send(JSON.stringify({ type: 'ping' }))
        if (pingTimer !== undefined) window.clearInterval(pingTimer)
        pingTimer = window.setInterval(() => {
          if (nextSocket.readyState === WebSocket.OPEN) {
            nextSocket.send(JSON.stringify({ type: 'ping' }))
          }
        }, 25_000)
      })
      nextSocket.addEventListener('message', (event) => {
        if (socket === nextSocket) handleMessage(event.data)
      })
      nextSocket.addEventListener('error', () => {
        if (socket === nextSocket) {
          setStatus('disconnected', 'حدث خطأ في الاتصال اللحظي')
        }
      })
      nextSocket.addEventListener('close', (event) => {
        if (socket !== nextSocket) return
        socket = null
        if (pingTimer !== undefined) {
          window.clearInterval(pingTimer)
          pingTimer = undefined
        }
        setStatus(
          navigator.onLine ? 'disconnected' : 'offline',
          event.reason || `انقطع الاتصال اللحظي (${event.code})`
        )
        scheduleReconnect()
      })
    } catch (error) {
      setStatus(
        'disconnected',
        error instanceof Error ? error.message : 'تعذر بدء الاتصال اللحظي'
      )
      scheduleReconnect()
    }
  }

  const onOnline = () => {
    reconnectAttempt = 0
    if (sharedPort) sharedPort.postMessage({ action: 'reconnect' })
    else void connect()
  }
  const onOffline = () => setStatus('offline', 'لا يوجد اتصال بالإنترنت')
  const onVisibility = () => {
    if (document.visibilityState !== 'visible') return
    if (sharedPort) sharedPort.postMessage({ action: 'get_status' })
    else if (!socket) void connect()
  }
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  document.addEventListener('visibilitychange', onVisibility)
  if (!connectSharedWorker()) void connect()

  return () => {
    stopped = true
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    document.removeEventListener('visibilitychange', onVisibility)
    if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer)
    if (sharedWorkerTimer !== undefined) window.clearTimeout(sharedWorkerTimer)
    if (pingTimer !== undefined) window.clearInterval(pingTimer)
    socket?.close(1000, 'تم مغادرة لوحة التاجر')
    socket = null
    if (sharedPort) {
      sharedPort.postMessage({ action: 'close_port' })
      sharedPort.close()
      sharedPort = null
    }
    setStatus('disconnected', 'الاتصال اللحظي متوقف')
  }
}
