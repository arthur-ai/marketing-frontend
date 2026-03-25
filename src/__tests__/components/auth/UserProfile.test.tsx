import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProfile } from '@/components/auth/UserProfile'
import { useAuth } from '@/hooks/useAuth'
import { authClient } from '@/lib/auth-client'

jest.mock('@/hooks/useAuth')
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}))

describe('UserProfile', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

  beforeEach(() => {
    jest.clearAllMocks()
    ;(authClient.signOut as jest.Mock).mockResolvedValue(undefined)
    // Reset window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
  })

  it('renders nothing when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: undefined,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
      hasAllRoles: jest.fn(),
    })

    const { container } = render(<UserProfile />)
    expect(container.firstChild).toBeNull()
  })

  it('displays user name when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['admin'],
      },
      session: {} as any,
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
      hasAllRoles: jest.fn(),
    })

    render(<UserProfile />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('displays user roles when showRoles is true', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['admin', 'editor'],
      },
      session: {} as any,
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
      hasAllRoles: jest.fn(),
    })

    render(<UserProfile showRoles={true} />)
    expect(screen.getByText('admin, editor')).toBeInTheDocument()
  })

  it('calls authClient.signOut when logout is clicked', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['admin'],
      },
      session: {} as any,
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
      hasAllRoles: jest.fn(),
    })

    render(<UserProfile />)

    // Click on user profile to open menu
    const avatar = screen.getByText('TU')
    await user.click(avatar)

    // Click logout
    const logoutButton = screen.getByText('Logout')
    await user.click(logoutButton)

    expect(authClient.signOut).toHaveBeenCalled()
    expect(window.location.href).toBe('/login')
  })
})
