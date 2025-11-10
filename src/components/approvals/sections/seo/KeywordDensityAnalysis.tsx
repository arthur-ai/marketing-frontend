'use client'

import { Box, Typography, Paper } from '@mui/material'

interface KeywordDensityAnalysisItem {
  keyword: string
  current_density?: number
  optimal_density?: number
  occurrences?: number
  placement_locations?: string[]
}

interface KeywordDensityAnalysisProps {
  analyses: KeywordDensityAnalysisItem[]
}

export function KeywordDensityAnalysis({ analyses }: KeywordDensityAnalysisProps) {
  if (!analyses || analyses.length === 0) {
    return null
  }
  
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        Keyword Density Analysis
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {analyses.map((analysis, index) => (
          <Paper key={index} elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {analysis.keyword}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Current Density
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {analysis.current_density?.toFixed(2)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Optimal Density
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {analysis.optimal_density?.toFixed(2)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Occurrences
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {analysis.occurrences}
                </Typography>
              </Box>
              {analysis.placement_locations && analysis.placement_locations.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Locations
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {analysis.placement_locations.join(', ')}
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

