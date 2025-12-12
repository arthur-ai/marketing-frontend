'use client'

import { useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import CircularProgress from '@mui/material/CircularProgress'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (status === 'authenticated' && session) {
      router.push('/')
    }
  }, [status, session, router])

  const handleLogin = () => {
    signIn('keycloak', { callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (status === 'authenticated') {
    return null // Will redirect
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 3,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Marketing Tool
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
          Please sign in to access the marketing tool
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleLogin}
          sx={{ mt: 2 }}
        >
          Sign in with Keycloak
        </Button>
      </Box>
    </Container>
  )
}
