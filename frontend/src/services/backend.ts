export type BackendPhoto = {
  id: number
  title: string
  alt: string
  url: string
  publisher: { name?: string; url?: string; id?: number }
  published_at: string | null
  avg_color?: string
  width?: number
  height?: number
  src: { [k: string]: string }
  attribution?: string
}

export type SearchResponse = {
  source: 'pexels'
  total_results: number
  page: number
  per_page: number
  next_page?: string
  photos: BackendPhoto[]
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// note: normalizePexels removed; backend provides normalized shape

export async function searchImages(params: {
  q: string
  per_page?: number
  page?: number
  apiKey?: string
}): Promise<SearchResponse> {
  const url = new URL('/images/search', BASE_URL)
  url.searchParams.set('q', params.q)
  if (params.per_page) url.searchParams.set('per_page', String(params.per_page))
  if (params.page) url.searchParams.set('page', String(params.page))

  const headers: Record<string, string> = {}
  const userId = getUserId()
  if (userId) headers['X-User-Id'] = userId

  try {
    const res = await fetch(url.toString(), { headers })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Backend error ${res.status}`)
    }
    return (await res.json()) as SearchResponse
  } catch (err) {
    throw err
  }
}

export async function suggestTerms(q: string, limit = 3): Promise<string[]> {
  const url = new URL('/suggest', BASE_URL)
  url.searchParams.set('q', q)
  url.searchParams.set('limit', String(limit))
  const headers: Record<string, string> = {}
  const userId = getUserId()
  if (userId) headers['X-User-Id'] = userId
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({ suggestions: [] }))
  return Array.isArray(data?.suggestions) ? data.suggestions : []
}

export async function recommendImages(params?: { per_page?: number; page?: number }): Promise<SearchResponse> {
  const url = new URL('/images/recommend', BASE_URL)
  if (params?.per_page) url.searchParams.set('per_page', String(params.per_page))
  if (params?.page) url.searchParams.set('page', String(params.page))
  const headers: Record<string, string> = {}
  const userId = getUserId()
  if (userId) headers['X-User-Id'] = userId
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Backend error ${res.status}`)
  }
  return (await res.json()) as SearchResponse
}

export async function validateHandle(handle: string): Promise<{ exists: boolean; userId: string | null; handle: string | null }> {
  const url = new URL('/user/validate', BASE_URL)
  url.searchParams.set('handle', handle)
  const res = await fetch(url.toString())
  if (!res.ok) return { exists: false, userId: null, handle: null }
  return await res.json()
}

export async function upsertUser(handle: string): Promise<string> {
  const userId = getUserId() || cryptoRandomId()
  await fetch(new URL('/user/upsert', BASE_URL).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, handle }),
  })
  setUserId(userId)
  return userId
}

export async function savePrefs(prefs: any): Promise<void> {
  const userId = getUserId()
  if (!userId) return
  await fetch(new URL('/prefs', BASE_URL).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify(prefs ?? {}),
  })
}

export async function loadPrefs(): Promise<any> {
  const userId = getUserId()
  if (!userId) return {}
  const res = await fetch(new URL('/prefs', BASE_URL).toString(), { headers: { 'X-User-Id': userId } })
  if (!res.ok) return {}
  return await res.json()
}

function getUserId(): string | null {
  try { return localStorage.getItem('userId') } catch { return null }
}
function setUserId(id: string) {
  try { localStorage.setItem('userId', id) } catch {}
}
function cryptoRandomId(): string {
  try {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}


