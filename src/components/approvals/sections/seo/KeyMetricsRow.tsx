'use client'

import { Box, Chip } from '@mui/material'

interface KeyMetricsRowProps {
  searchIntent?: string
  keywordDifficulty?: string | Record<string, number>
  relevanceScore?: number
  confidenceScore?: number
}

export function KeyMetricsRow({
  searchIntent,
  keywordDifficulty,
  relevanceScore,
  confidenceScore,
}: KeyMetricsRowProps) {
  // Handle keyword_difficulty: can be string (legacy) or dict (new format)
  const getDifficultyDisplay = () => {
    if (!keywordDifficulty) return null
    
    // New format: dictionary of keyword -> score
    if (typeof keywordDifficulty === 'object' && !Array.isArray(keywordDifficulty) && keywordDifficulty !== null) {
      const scores = Object.values(keywordDifficulty) as number[]
      if (scores.length === 0) return null
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      const difficultyLevel = avgScore > 70 ? 'Hard' : avgScore > 40 ? 'Medium' : 'Easy'
      return {
        label: `Avg Difficulty: ${difficultyLevel} (${avgScore.toFixed(0)})`,
        color: avgScore > 70 ? 'error' : avgScore > 40 ? 'warning' : 'success'
      }
    }
    
    // Legacy format: string
    if (typeof keywordDifficulty === 'string') {
      const difficultyStr = keywordDifficulty.charAt(0).toUpperCase() + keywordDifficulty.slice(1)
      const difficultyLower = keywordDifficulty.toLowerCase()
      return {
        label: `Difficulty: ${difficultyStr}`,
        color: difficultyLower === 'easy' ? 'success' : difficultyLower === 'medium' ? 'warning' : 'error'
      }
    }
    
    return null
  }
  
  const difficultyDisplay = getDifficultyDisplay()
  
  // Don't render if no metrics available
  if (!searchIntent && !difficultyDisplay && relevanceScore === undefined && confidenceScore === undefined) {
    return null
  }
  
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {searchIntent && (
        <Chip
          label={`Search Intent: ${searchIntent.charAt(0).toUpperCase() + searchIntent.slice(1)}`}
          color="primary"
          variant="outlined"
        />
      )}
      {difficultyDisplay && (
        <Chip
          label={difficultyDisplay.label}
          color={difficultyDisplay.color as any}
          variant="outlined"
        />
      )}
      {relevanceScore !== null && relevanceScore !== undefined && (
        <Chip
          label={`Relevance: ${relevanceScore.toFixed(1)}%`}
          color={relevanceScore >= 70 ? 'success' : relevanceScore >= 50 ? 'warning' : 'error'}
          variant="outlined"
        />
      )}
      {confidenceScore !== null && confidenceScore !== undefined && (
        <Chip
          label={`Confidence: ${(confidenceScore * 100).toFixed(1)}%`}
          color={confidenceScore >= 0.7 ? 'success' : confidenceScore >= 0.5 ? 'warning' : 'error'}
          variant="outlined"
        />
      )}
    </Box>
  )
}

