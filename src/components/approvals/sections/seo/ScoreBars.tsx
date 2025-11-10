'use client'

import { Box, Typography } from '@mui/material'

interface ScoreBarsProps {
  relevanceScore?: number
  confidenceScore?: number
}

export function ScoreBars({ relevanceScore, confidenceScore }: ScoreBarsProps) {
  if ((relevanceScore === null || relevanceScore === undefined) && 
      (confidenceScore === null || confidenceScore === undefined)) {
    return null
  }
  
  return (
    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
      {relevanceScore !== null && relevanceScore !== undefined && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" fontWeight="medium">
              Relevance Score
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {relevanceScore.toFixed(1)}%
            </Typography>
          </Box>
          <Box
            sx={{
              width: '100%',
              height: 8,
              bgcolor: 'grey.200',
              borderRadius: 1,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                width: `${relevanceScore}%`,
                height: '100%',
                bgcolor: relevanceScore >= 70 ? 'success.main' : relevanceScore >= 50 ? 'warning.main' : 'error.main',
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
        </Box>
      )}
      {confidenceScore !== null && confidenceScore !== undefined && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" fontWeight="medium">
              Confidence Score
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(confidenceScore * 100).toFixed(1)}%
            </Typography>
          </Box>
          <Box
            sx={{
              width: '100%',
              height: 8,
              bgcolor: 'grey.200',
              borderRadius: 1,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                width: `${confidenceScore * 100}%`,
                height: '100%',
                bgcolor: confidenceScore >= 0.7 ? 'success.main' : confidenceScore >= 0.5 ? 'warning.main' : 'error.main',
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  )
}

