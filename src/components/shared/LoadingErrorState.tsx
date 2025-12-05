'use client'

import { Box, Container, Typography, CircularProgress, Alert, Button } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface LoadingErrorStateProps {
  loading: boolean
  error: Error | string | null | undefined
  loadingText?: string
  errorText?: string
  children: ReactNode
  onBack?: () => void
  backPath?: string
  backLabel?: string
}

export function LoadingErrorState({
  loading,
  error,
  loadingText = 'Loading...',
  errorText,
  children,
  onBack,
  backPath,
  backLabel,
}: LoadingErrorStateProps) {
  const router = useRouter()

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>{loadingText}</Typography>
      </Container>
    )
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : error || errorText || 'An error occurred'
    const handleBack = onBack || (backPath ? () => router.push(backPath) : undefined)

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{errorMessage}</Alert>
        {handleBack && (
          <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mt: 2 }}>
            {backLabel || 'Go Back'}
          </Button>
        )}
      </Container>
    )
  }

  return <>{children}</>
}
