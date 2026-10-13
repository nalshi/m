import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRealtimeStore } from '@/stores/realtime-store'
import { startMerchantRealtime } from './merchant-realtime'

class FakeWebSocket extends EventTarget {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  static instances: FakeWebSocket[] = []
  readyState = FakeWebSocket.CONNECTING

  constructor(readonly url: string) {
    super()
    FakeWebSocket.instances.push(this)
  }

  send() {}

  close() {
    this.readyState = FakeWebSocket.CLOSED
    this.dispatchEvent(new CloseEvent('close', { code: 1000 }))
  }

  open() {
    this.readyState = FakeWebSocket.OPEN
    this.dispatchEvent(new Event('open'))
  }

  receive(message: Record<string, unknown>) {
    this.dispatchEvent(
      new MessageEvent('message', { data: JSON.stringify(message) })
    )
  }
}

class FakeMessagePort {
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null
  postMessage = vi.fn()
  start = vi.fn()
  close = vi.fn()

  emit(data: unknown) {
    this.onmessage?.({ data } as MessageEvent<unknown>)
  }
}

class FakeSharedWorker extends EventTarget {
  static instances: FakeSharedWorker[] = []
  readonly port = new FakeMessagePort()

  constructor(
    readonly url: string,
    readonly options?: WorkerOptions
  ) {
    super()
    FakeSharedWorker.instances.push(this)
  }
}

function makeToken() {
  const payload = btoa(JSON.stringify({ exp: 2_000_000_000, user_id: 42 }))
  return `header.${payload}.signature`
}

describe('merchant realtime synchronization', () => {
  let queryClient: QueryClient
  let cleanup: (() => void) | undefined

  beforeEach(() => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.stubGlobal('SharedWorker', undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ticket: 'short-ticket' }), {
          status: 200,
        })
      )
    )
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('merchant_token', makeToken())
    FakeWebSocket.instances = []
    useRealtimeStore.getState().setStatus('connecting')
    queryClient = new QueryClient()
  })

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
    queryClient.clear()
    vi.unstubAllGlobals()
    FakeSharedWorker.instances = []
  })

  it('uses a short-lived ticket and applies snapshots and order updates immediately', async () => {
    cleanup = startMerchantRealtime(queryClient)
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1))

    const socket = FakeWebSocket.instances[0]
    expect(socket.url).toContain('ticket=short-ticket')
    expect(socket.url).toContain('&m=42')
    expect(socket.url).not.toContain(makeToken())

    socket.open()
    socket.receive({
      event: 'initial_load',
      products: [{ id: 9, name: 'منتج', price: 15 }],
      orders: [
        {
          id: 11,
          customer_name: 'عميل',
          status: 'pending_merchant_approval',
        },
      ],
      archivedOrders: [],
      categories: [{ id: 4, name: 'فئة', parent_id: 0 }],
      settings: { store_name: 'المتجر', username: 'shop' },
    })

    expect(queryClient.getQueryData(['merchant-products'])).toMatchObject([
      { id: '9', name: 'منتج', price: 15 },
    ])
    expect(
      queryClient.getQueryData(['merchant-orders', 'active'])
    ).toMatchObject([{ id: '11', customerName: 'عميل' }])
    expect(queryClient.getQueryData(['merchant-store-username'])).toBe('shop')
    expect(useRealtimeStore.getState().status).toBe('connected')

    socket.receive({
      event: 'order_updated',
      order: {
        id: 12,
        customer_name: 'عميل جديد',
        status: 'pending_merchant_approval',
      },
    })
    expect(
      queryClient.getQueryData(['merchant-orders', 'active'])
    ).toMatchObject([{ id: '12' }, { id: '11' }])
  })

  it('falls back to the legacy token URL when ticket provisioning fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    cleanup = startMerchantRealtime(queryClient)
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1))

    expect(FakeWebSocket.instances[0].url).toContain('merchant_id=42')
    expect(FakeWebSocket.instances[0].url).toContain(
      encodeURIComponent(makeToken())
    )
  })

  it('reuses the legacy shared worker and applies its snapshot messages', async () => {
    vi.stubGlobal('SharedWorker', FakeSharedWorker)
    cleanup = startMerchantRealtime(queryClient)
    await vi.waitFor(() =>
      expect(FakeSharedWorker.instances[0]?.port.postMessage).toHaveBeenCalled()
    )

    const worker = FakeSharedWorker.instances[0]
    expect(worker.url).toBe('/js/dashboard/realtime-worker.js')
    expect(worker.options).toEqual({ name: 'nalsh-merchant-realtime' })
    expect(worker.port.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'init',
        merchantId: '42',
        token: '',
        socketUrl: expect.stringContaining('ticket=short-ticket'),
      })
    )

    worker.port.emit(
      JSON.stringify({
        type: 'snapshot',
        data: {
          event: 'initial_load',
          products: [{ id: 25, name: 'منتج لحظي' }],
          orders: [],
          archivedOrders: [],
        },
      })
    )
    expect(queryClient.getQueryData(['merchant-products'])).toMatchObject([
      { id: '25', name: 'منتج لحظي' },
    ])
    expect(useRealtimeStore.getState().status).toBe('connected')

    cleanup?.()
    cleanup = undefined
    expect(worker.port.postMessage).toHaveBeenCalledWith({
      action: 'close_port',
    })
    expect(worker.port.close).toHaveBeenCalledOnce()
  })
})
