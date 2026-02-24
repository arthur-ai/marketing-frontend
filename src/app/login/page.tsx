'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { ClientOnly } from '@/components/providers/ClientOnly'
import { resetAuthErrorState } from '@/lib/api'

function LoginContent() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    // Dev bypass: skip Keycloak entirely and go straight to dashboard
    if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true') {
      router.push('/')
      return
    }

    // If already authenticated with a valid user, reset auth error state and redirect to dashboard
    if (session?.user && !error) {
      resetAuthErrorState()
      setTimeout(() => {
        router.push('/')
      }, 100)
    }
  }, [session, router, error])

  const handleLogin = () => {
    authClient.signIn.oauth2({
      providerId: 'keycloak',
      callbackURL: '/',
    })
  }

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (session?.user && !error) {
    return null // Will redirect via useEffect
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
        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error === 'SessionExpired' ? (
              <>
                Your session has expired. Please log in again.
              </>
            ) : error === 'OAuthCallback' ? (
              <>
                Authentication failed. Please check your Keycloak client credentials in .env.local
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  The client secret may be incorrect. Verify it matches your Keycloak client configuration.
                </Typography>
              </>
            ) : (
              <>
                Authentication failed. Please try logging in again.
              </>
            )}
          </Alert>
        )}
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

export default function LoginPage() {
  return (
    <ClientOnly fallback={
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
    }>
      <LoginContent />
    </ClientOnly>
  )
}
