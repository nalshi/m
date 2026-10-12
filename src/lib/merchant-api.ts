const API_URL = 'https://api.nalsh.dpdns.org/api.php'

export type ApiResult = {
  status: string
  message?: string
  token?: string
  redirect?: string
  state_token?: string
  name?: string
  id?: string | number
  url?: string
  data?: unknown
  products?: unknown
  orders?: unknown
  accounts?: {
    merchant?: { name?: string }
    delivery?: { name?: string }
  }
}

export async function apiRequest(
  action: string,
  payload: Record<string, unknown> | FormData,
  csrfToken: { current: string }
): Promise<ApiResult> {
  const token =
    typeof window === 'undefined'
      ? ''
      : localStorage.getItem('merchant_token') ||
        sessionStorage.getItem('merchant_token') ||
        ''
  const headers: Record<string, string> = {
    'X-CSRF-TOKEN': csrfToken.current,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  let body: BodyInit
  if (payload instanceof FormData) {
    payload.set('action', action)
    if (token) payload.set('auth_token', token)
    body = payload
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify({
      action,
      ...(token ? { auth_token: token } : {}),
      ...payload,
    })
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    credentials: 'include',
    body,
  })

  const newToken = response.headers.get('X-New-CSRF-Token')
  if (newToken) csrfToken.current = newToken

  const rawText = await response.text()
  if (!rawText || rawText.includes('<html')) {
    throw new Error('تعذر الاتصال بخادم نالش.')
  }

  let result: unknown
  try {
    result = JSON.parse(rawText)
  } catch {
    throw new Error('أعاد الخادم استجابة غير صالحة.')
  }

  if (
    typeof result !== 'object' ||
    result === null ||
    !('status' in result) ||
    typeof result.status !== 'string'
  ) {
    throw new Error('أعاد الخادم بيانات غير متوقعة.')
  }

  if (!response.ok && response.status !== 429) {
    const message =
      'message' in result && typeof result.message === 'string'
        ? result.message
        : 'فشل الطلب إلى الخادم.'
    throw new Error(message)
  }

  return result as ApiResult
}
