'use client'

import { Alert, Box, Typography } from '@mui/material'

interface ConfidenceScoreProps {
  score: number // 0-1
}

export function ConfidenceScore({ score }: ConfidenceScoreProps) {
  const percentage = (score * 100).toFixed(0)

  return (
    <Alert severity="info" sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Typography variant="body2">
          <strong>Confidence Score:</strong> {percentage}%
        </Typography>
        <Box sx={{ width: 200, height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
          <Box
            sx={{
              width: `${percentage}%`,
              height: '100%',
              bgcolor: 'primary.main',
            }}
          />
        </Box>
      </Box>
    </Alert>
  )
}
