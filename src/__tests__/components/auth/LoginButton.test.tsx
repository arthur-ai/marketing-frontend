import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { authClient } from '@/lib/auth-client'
import { LoginButton } from '@/components/auth/LoginButton'

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      oauth2: jest.fn(),
    },
  },
}))

describe('LoginButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login button', () => {
    render(<LoginButton />)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('calls signIn.oauth2 when clicked', async () => {
    const user = userEvent.setup()
    render(<LoginButton />)

    const button = screen.getByText('Sign In')
    await user.click(button)

    expect(authClient.signIn.oauth2).toHaveBeenCalledWith({
      providerId: 'keycloak',
      callbackURL: '/',
    })
  })

  it('renders with custom variant', () => {
    render(<LoginButton variant="outlined" />)
    const button = screen.getByText('Sign In')
    expect(button).toHaveClass('MuiButton-outlined')
  })

  it('renders with custom size', () => {
    render(<LoginButton size="large" />)
    const button = screen.getByText('Sign In')
    expect(button).toHaveClass('MuiButton-sizeLarge')
  })
})
