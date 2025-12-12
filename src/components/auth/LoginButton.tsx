'use client'

import { signIn } from 'next-auth/react'
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
    signIn('keycloak', { callbackUrl: '/' })
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
