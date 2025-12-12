import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signOut } from 'next-auth/react'
import { UserProfile } from '@/components/auth/UserProfile'
import { useAuth } from '@/hooks/useAuth'

jest.mock('next-auth/react')
jest.mock('@/hooks/useAuth')

describe('UserProfile', () => {
  const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

  beforeEach(() => {
    jest.clearAllMocks()
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

  it('calls signOut when logout is clicked', async () => {
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

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
  })
})
