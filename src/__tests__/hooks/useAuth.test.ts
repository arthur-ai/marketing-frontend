import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useAuth } from '@/hooks/useAuth'

jest.mock('next-auth/react')

describe('useAuth', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns user session when authenticated', () => {
    const mockSession = {
      user: {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['admin', 'user'],
      },
      accessToken: 'test-token',
      expires: '2024-12-31',
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.id).toBe('123')
    expect(result.current.user?.roles).toEqual(['admin', 'user'])
  })

  it('returns null when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeUndefined()
  })

  it('handles loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('hasRole returns true when user has role', () => {
    const mockSession = {
      user: {
        id: '123',
        roles: ['admin', 'user'],
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasRole('user')).toBe(true)
    expect(result.current.hasRole('guest')).toBe(false)
  })

  it('hasAnyRole returns true when user has any role', () => {
    const mockSession = {
      user: {
        id: '123',
        roles: ['admin'],
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.hasAnyRole(['admin', 'user'])).toBe(true)
    expect(result.current.hasAnyRole(['guest', 'viewer'])).toBe(false)
  })

  it('hasAllRoles returns true when user has all roles', () => {
    const mockSession = {
      user: {
        id: '123',
        roles: ['admin', 'user', 'editor'],
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.hasAllRoles(['admin', 'user'])).toBe(true)
    expect(result.current.hasAllRoles(['admin', 'guest'])).toBe(false)
  })
})
