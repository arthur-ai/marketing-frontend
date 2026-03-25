import { renderHook, waitFor } from '@testing-library/react'
import { authClient } from '@/lib/auth-client'
import { useAuth } from '@/hooks/useAuth'

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: jest.fn(),
    getAccessToken: jest.fn().mockResolvedValue(null),
  },
}))

// Create a JWT with realm_access.roles claim for testing role extraction
function makeJWT(roles: string[]): string {
  const payloadJson = JSON.stringify({ realm_access: { roles } })
  const b64 = Buffer.from(payloadJson)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `eyJhbGciOiJSUzI1NiJ9.${b64}.fakesignature`
}

describe('useAuth', () => {
  const mockUseSession = authClient.useSession as jest.MockedFunction<typeof authClient.useSession>
  const mockGetAccessToken = authClient.getAccessToken as jest.MockedFunction<typeof authClient.getAccessToken>

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAccessToken.mockResolvedValue(null)
  })

  it('returns isAuthenticated true when session exists', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '123', name: 'Test User', email: 'test@example.com' } } as any,
      isPending: false,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.id).toBe('123')
  })

  it('returns isAuthenticated false when session is null', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeUndefined()
  })

  it('handles loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('loads roles from access token JWT', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '123' } } as any,
      isPending: false,
    })
    mockGetAccessToken.mockResolvedValue(makeJWT(['admin', 'user']) as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.user?.roles).toEqual(['admin', 'user'])
    })
  })

  it('hasRole returns true when user has role', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '123' } } as any,
      isPending: false,
    })
    mockGetAccessToken.mockResolvedValue(makeJWT(['admin', 'user']) as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.hasRole('admin')).toBe(true)
    })
    expect(result.current.hasRole('user')).toBe(true)
    expect(result.current.hasRole('guest')).toBe(false)
  })

  it('hasAnyRole returns true when user has any role', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '123' } } as any,
      isPending: false,
    })
    mockGetAccessToken.mockResolvedValue(makeJWT(['admin']) as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.hasAnyRole(['admin', 'user'])).toBe(true)
    })
    expect(result.current.hasAnyRole(['guest', 'viewer'])).toBe(false)
  })

  it('hasAllRoles returns true when user has all roles', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '123' } } as any,
      isPending: false,
    })
    mockGetAccessToken.mockResolvedValue(makeJWT(['admin', 'user', 'editor']) as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.hasAllRoles(['admin', 'user'])).toBe(true)
    })
    expect(result.current.hasAllRoles(['admin', 'guest'])).toBe(false)
  })
})
