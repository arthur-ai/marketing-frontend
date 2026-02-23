'use client'

import { authClient } from '@/lib/auth-client'
import Button from '@mui/material/Button'

interface LoginButtonProps {
  variant?: 'text' | 'outlined' | 'contained'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
}

export function LoginButton({
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
}: LoginButtonProps) {
  const handleLogin = () => {
    authClient.signIn.oauth2({
      providerId: 'keycloak',
      callbackURL: '/',
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handleLogin}
    >
      Sign In
    </Button>
  )
}
