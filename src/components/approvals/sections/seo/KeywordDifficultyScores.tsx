'use client'

import { Box, Typography, Chip } from '@mui/material'

interface KeywordDifficultyScoresProps {
  difficultyScores: Record<string, number>
}

export function KeywordDifficultyScores({ difficultyScores }: KeywordDifficultyScoresProps) {
  if (!difficultyScores || typeof difficultyScores !== 'object' || Array.isArray(difficultyScores) || Object.keys(difficultyScores).length === 0) {
    return null
  }
  
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        Keyword Difficulty Scores
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Object.entries(difficultyScores).map(([keyword, score]) => (
          <Chip
            key={keyword}
            label={`${keyword}: ${score.toFixed(0)}`}
            sx={{ 
              bgcolor: score > 70 ? 'error.50' : score > 40 ? 'warning.50' : 'success.50',
              color: score > 70 ? 'error.dark' : score > 40 ? 'warning.dark' : 'success.dark',
              fontWeight: 500 
            }}
            size="small"
          />
        ))}
      </Box>
    </Box>
  )
}

