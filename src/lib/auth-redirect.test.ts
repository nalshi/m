import { describe, expect, it } from 'vitest'
import { getSafeAuthRedirect } from './auth-redirect'

describe('getSafeAuthRedirect', () => {
  it('keeps a relative dashboard destination', () => {
    expect(getSafeAuthRedirect('/orders?filter=active#latest')).toBe(
      '/orders?filter=active#latest'
    )
  })

  it('keeps same-origin absolute destinations as local paths', () => {
    expect(
      getSafeAuthRedirect(
        'https://merchant.example/orders',
        'https://merchant.example'
      )
    ).toBe('/orders')
  })

  it('rejects external and protocol-relative destinations', () => {
    expect(
      getSafeAuthRedirect(
        'https://attacker.example',
        'https://merchant.example'
      )
    ).toBe('/')
    expect(
      getSafeAuthRedirect('//attacker.example', 'https://merchant.example')
    ).toBe('/')
  })
})
