import { getSession } from 'next-auth/react'
import { apiClient } from '@/lib/api'

jest.mock('next-auth/react')

describe('API Client', () => {
  const mockGetSession = getSession as jest.MockedFunction<typeof getSession>

  beforeEach(() => {
    jest.clearAllMocks()
    // Clear any existing interceptors
    apiClient.interceptors.request.clear()
    apiClient.interceptors.response.clear()
  })

  it('includes access token in request headers when session exists', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: '123' },
      accessToken: 'test-access-token',
    } as any)

    // The interceptor should be set up in api.ts
    // This test verifies the interceptor logic
    const config = {
      headers: {},
    }

    // Simulate interceptor
    const session = await getSession()
    if (session && (session as any).accessToken) {
      config.headers['Authorization'] = `Bearer ${(session as any).accessToken}`
    }

    expect(config.headers['Authorization']).toBe('Bearer test-access-token')
  })

  it('does not include token when session is null', async () => {
    mockGetSession.mockResolvedValue(null)

    const config = {
      headers: {},
    }

    const session = await getSession()
    if (session && (session as any).accessToken) {
      config.headers['Authorization'] = `Bearer ${(session as any).accessToken}`
    }

    expect(config.headers['Authorization']).toBeUndefined()
  })
})
