'use client'

import { Box, Typography, Paper } from '@mui/material'

interface PrimaryKeywordMetadata {
  keyword: string
  search_volume?: number
  difficulty_score?: number
  relevance_score?: number
  trend_direction?: string
  trend_percentage?: number
}

interface PrimaryKeywordsMetadataProps {
  metadata: PrimaryKeywordMetadata[]
}

export function PrimaryKeywordsMetadata({ metadata }: PrimaryKeywordsMetadataProps) {
  if (!metadata || metadata.length === 0) {
    return null
  }
  
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        Primary Keywords Metadata
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {metadata.map((meta, index) => (
          <Paper key={index} elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {meta.keyword}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              {meta.search_volume !== undefined && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Search Volume
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {meta.search_volume.toLocaleString()}/mo
                  </Typography>
                </Box>
              )}
              {meta.difficulty_score !== undefined && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Difficulty
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: meta.difficulty_score > 70 ? 'error.main' : meta.difficulty_score > 40 ? 'warning.main' : 'success.main' }}>
                    {meta.difficulty_score.toFixed(0)}/100
                  </Typography>
                </Box>
              )}
              {meta.relevance_score !== undefined && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Relevance
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {meta.relevance_score.toFixed(0)}%
                  </Typography>
                </Box>
              )}
              {meta.trend_direction && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Trend
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: meta.trend_direction === 'rising' ? 'success.main' : meta.trend_direction === 'declining' ? 'error.main' : 'text.secondary' }}>
                    {meta.trend_direction}
                    {meta.trend_percentage !== undefined && ` (${meta.trend_percentage > 0 ? '+' : ''}${meta.trend_percentage.toFixed(1)}%)`}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  )
}

