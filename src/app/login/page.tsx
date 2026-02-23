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
    console.log('[LoginPage] Session check:', {
      isPending,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
      sessionKeys: session ? Object.keys(session) : [],
      error,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
    })

    // If already authenticated with a valid user, reset auth error state and redirect to dashboard
    // Better Auth stores OAuth tokens separately, so we don't need to check for accessToken here
    // The accessToken will be fetched when needed for API calls
    if (session?.user && !error) {
      console.log('[LoginPage] User authenticated, redirecting to dashboard')
      // Reset auth error state to allow API calls
      resetAuthErrorState()
      // Small delay to ensure state is reset before navigation
      setTimeout(() => {
        console.log('[LoginPage] Executing redirect to /')
        router.push('/')
      }, 100)
      return
    } else {
      console.log('[LoginPage] Not redirecting - session check failed:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasError: !!error,
      })
    }
  }, [session, router, error])

  const handleLogin = () => {
    authClient.signIn.oauth2({
      providerId: 'keycloak',
      callbackURL: '/',
    })
  }

  if (isPending) {
    console.log('[LoginPage] Session is pending, showing loading')
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

  // Only redirect if we have a valid session
  // Don't redirect if there's an error (let user see the error message)
  // Better Auth stores OAuth tokens separately, so we don't need to check for accessToken here
  if (session?.user && !error) {
    console.log('[LoginPage] Rendering null - will redirect via useEffect')
    return null // Will redirect
  }

  console.log('[LoginPage] Rendering login form:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    error,
  })

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
