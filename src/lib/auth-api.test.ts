import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '@/lib/merchant-api'
import { authApiRequest, clearAuthApiCache } from './auth-api'

vi.mock('@/lib/merchant-api', () => ({
  apiRequest: vi.fn(),
}))

const mockedApiRequest = vi.mocked(apiRequest)

describe('authenticated API response cache', () => {
  beforeEach(() => {
    clearAuthApiCache()
    mockedApiRequest.mockReset()
  })

  afterEach(() => {
    clearAuthApiCache()
    vi.useRealTimers()
  })

  it('shares simultaneous and repeated reads of the same data', async () => {
    mockedApiRequest.mockResolvedValue({ status: 'success', data: [1] })

    const first = authApiRequest('get_categories_tree', {})
    const second = authApiRequest('get_categories_tree', {})

    await expect(Promise.all([first, second])).resolves.toEqual([
      { status: 'success', data: [1] },
      { status: 'success', data: [1] },
    ])
    await authApiRequest('get_categories_tree', {})

    expect(mockedApiRequest).toHaveBeenCalledTimes(1)
  })

  it('expires cached order reads after their short freshness window', async () => {
    vi.useFakeTimers()
    mockedApiRequest
      .mockResolvedValueOnce({ status: 'success', data: [] })
      .mockResolvedValueOnce({ status: 'success', data: [{ id: 2 }] })

    await authApiRequest('get_orders', { filter: 'active' })
    await vi.advanceTimersByTimeAsync(15_001)
    await expect(
      authApiRequest('get_orders', { filter: 'active' })
    ).resolves.toEqual({ status: 'success', data: [{ id: 2 }] })

    expect(mockedApiRequest).toHaveBeenCalledTimes(2)
  })

  it('clears cached reads after a successful write', async () => {
    mockedApiRequest
      .mockResolvedValueOnce({ status: 'success', data: [{ name: 'old' }] })
      .mockResolvedValueOnce({ status: 'success' })
      .mockResolvedValueOnce({ status: 'success', data: [{ name: 'new' }] })

    await authApiRequest('get_merchant_settings', {})
    await authApiRequest('save_merchant_settings', {})
    await expect(authApiRequest('get_merchant_settings', {})).resolves.toEqual({
      status: 'success',
      data: [{ name: 'new' }],
    })

    expect(mockedApiRequest).toHaveBeenCalledTimes(3)
  })

  it('does not cache unsuccessful read responses', async () => {
    mockedApiRequest
      .mockResolvedValueOnce({ status: 'error', message: 'try again' })
      .mockResolvedValueOnce({ status: 'success', data: [] })

    await authApiRequest('get_categories_tree', {})
    await expect(authApiRequest('get_categories_tree', {})).resolves.toEqual({
      status: 'success',
      data: [],
    })

    expect(mockedApiRequest).toHaveBeenCalledTimes(2)
  })
})
