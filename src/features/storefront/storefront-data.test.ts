import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authApiRequest } from '@/lib/auth-api'
import {
  fetchStorefrontLibrary,
  loadStorefrontThemeConfig,
  mergeStorefrontConfig,
  saveStorefrontConfig,
} from './storefront-data'

vi.mock('@/lib/auth-api', () => ({
  authApiRequest: vi.fn(),
}))

const mockedAuthApiRequest = vi.mocked(authApiRequest)

describe('storefront data', () => {
  beforeEach(() => {
    mockedAuthApiRequest.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads themes and the saved merchant selection', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'summer-shop',
              name: 'الصيفي',
              description: 'واجهة مشرقة',
              category: 'عصري',
              sourceFile: '/templates/themes/summer-shop.json',
              preview: { primary: '#123456' },
            },
          ],
        }),
      })
    )
    mockedAuthApiRequest.mockImplementation(async (action) => {
      if (action === 'get_storefront_config') {
        return {
          status: 'success',
          data: {
            config: {
              theme_name: 'summer-shop',
              default_theme_mode: 'dark',
            },
          },
        }
      }
      if (action === 'get_merchant_settings') {
        return {
          status: 'success',
          data: {
            username: '@my_store',
            store_name: 'متجري',
            settings: { whatsapp: '+967 700 000 000' },
          },
        }
      }
      return { status: 'error', message: 'طلب غير معروف' }
    })

    await expect(fetchStorefrontLibrary()).resolves.toMatchObject({
      username: 'my_store',
      storeName: 'متجري',
      phone: '+967 700 000 000',
      selectedThemeId: 'summer-shop',
      selectedMode: 'dark',
      themes: [
        {
          id: 'summer-shop',
          name: 'الصيفي',
          preview: { primary: '#123456' },
        },
      ],
    })
  })

  it('falls back to the storefront themes API when the static catalog is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 })
    )
    mockedAuthApiRequest.mockImplementation(async (action) => {
      if (action === 'get_storefront_themes') {
        return {
          status: 'success',
          data: {
            themes: [
              {
                id: 'api-theme',
                name: 'قالب المنصة',
                config: { theme_name: 'api-theme' },
              },
            ],
          },
        }
      }
      if (action === 'get_storefront_config') {
        return { status: 'success', data: { config: {} } }
      }
      if (action === 'get_merchant_settings') {
        return { status: 'success', data: { username: 'merchant' } }
      }
      return { status: 'error', message: 'طلب غير معروف' }
    })

    await expect(fetchStorefrontLibrary()).resolves.toMatchObject({
      username: 'merchant',
      themes: [{ id: 'api-theme', name: 'قالب المنصة' }],
    })
    expect(mockedAuthApiRequest).toHaveBeenCalledWith(
      'get_storefront_themes',
      {}
    )
  })

  it('loads a theme configuration only from its validated matching file', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'summer-shop',
        config: { light_theme: { colors: { primary: '#123456' } } },
      }),
    })
    vi.stubGlobal('fetch', fetch)

    const theme = {
      id: 'summer-shop',
      name: 'الصيفي',
      description: '',
      category: '',
      sourceFile: '/templates/themes/summer-shop.json',
      preview: {
        primary: '#123456',
        accent: '#06B6D4',
        background: '#F8FAFC',
        dark: {
          primary: '#6D28D9',
          accent: '#0891B2',
          background: '#111827',
        },
      },
    }

    await expect(loadStorefrontThemeConfig(theme)).resolves.toEqual({
      light_theme: { colors: { primary: '#123456' } },
    })
    expect(fetch).toHaveBeenCalledWith(
      '/templates/themes/summer-shop.json',
      expect.objectContaining({ credentials: 'same-origin' })
    )
    await expect(
      loadStorefrontThemeConfig({ ...theme, sourceFile: '/private.json' })
    ).rejects.toThrow('ملف إعدادات القالب غير متوفر.')
  })

  it('merges nested config while retaining unrelated base storefront settings', () => {
    const base = {
      store_identity: { store_name: 'متجري', slogan: 'أهلاً' },
      light_theme: { colors: { primary: '#111111', accent: '#222222' } },
    }

    expect(
      mergeStorefrontConfig(base, {
        light_theme: { colors: { primary: '#abcdef' } },
      })
    ).toEqual({
      store_identity: { store_name: 'متجري', slogan: 'أهلاً' },
      light_theme: { colors: { primary: '#abcdef', accent: '#222222' } },
    })
  })

  it('saves the selected storefront configuration using the legacy API payload', async () => {
    mockedAuthApiRequest.mockResolvedValueOnce({
      status: 'success',
      message: 'تم النشر',
    })
    const config = { theme_name: 'summer-shop', default_theme_mode: 'dark' }

    await expect(saveStorefrontConfig('my_store', config)).resolves.toBe(
      'تم النشر'
    )
    expect(mockedAuthApiRequest).toHaveBeenCalledWith(
      'save_storefront_config',
      { config, merchant_username: 'my_store' }
    )
  })
})
