import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import { LoginButton } from '@/components/auth/LoginButton'

jest.mock('next-auth/react')

describe('LoginButton', () => {
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login button', () => {
    render(<LoginButton />)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('calls signIn when clicked', async () => {
    const user = userEvent.setup()
    render(<LoginButton />)

    const button = screen.getByText('Sign In')
    await user.click(button)

    expect(mockSignIn).toHaveBeenCalledWith('keycloak', { callbackUrl: '/' })
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
