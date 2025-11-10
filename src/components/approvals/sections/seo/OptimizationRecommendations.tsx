'use client'

import { Box, Typography } from '@mui/material'

interface OptimizationRecommendationsProps {
  recommendations: string[]
}

export function OptimizationRecommendations({ recommendations }: OptimizationRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return null
  }
  
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        Optimization Recommendations
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {recommendations.map((recommendation, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, bgcolor: 'info.50', borderRadius: 1 }}>
            <Typography sx={{ color: 'info.main', mt: 0.25 }}>•</Typography>
            <Typography variant="body2">{recommendation}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

