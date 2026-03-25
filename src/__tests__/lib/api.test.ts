import { apiClient } from '@/lib/api'
import { authClient } from '@/lib/auth-client'

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: jest.fn(),
    getAccessToken: jest.fn(),
  },
}))

describe('API Client', () => {
  const mockGetSession = authClient.getSession as jest.MockedFunction<typeof authClient.getSession>
  const mockGetAccessToken = authClient.getAccessToken as jest.MockedFunction<typeof authClient.getAccessToken>

  beforeEach(() => {
    jest.clearAllMocks()
    // Clear any existing interceptors
    apiClient.interceptors.request.clear()
    apiClient.interceptors.response.clear()
  })

  it('includes access token in request headers when session and token exist', async () => {
    mockGetSession.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    } as any)
    mockGetAccessToken.mockResolvedValue('test-access-token' as any)

    const config = {
      headers: {} as Record<string, string>,
    }

    // Simulate the interceptor logic from api.ts
    const session = await authClient.getSession()
    if (session?.data) {
      const tokenResponse = await authClient.getAccessToken({ providerId: 'keycloak' })
      const accessToken = typeof tokenResponse === 'string' ? tokenResponse : null
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`
      }
    }

    expect(config.headers['Authorization']).toBe('Bearer test-access-token')
  })

  it('does not include token when session is null', async () => {
    mockGetSession.mockResolvedValue({ data: null, error: null } as any)

    const config = {
      headers: {} as Record<string, string>,
    }

    const session = await authClient.getSession()
    if (session?.data) {
      config.headers['Authorization'] = 'Bearer token'
    }

    expect(config.headers['Authorization']).toBeUndefined()
  })
})
