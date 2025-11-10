'use client'

import { Box, Typography, Paper } from '@mui/material'

interface SearchVolumeSummaryProps {
  summary: Record<string, number>
}

export function SearchVolumeSummary({ summary }: SearchVolumeSummaryProps) {
  if (!summary || typeof summary !== 'object' || Object.keys(summary).length === 0) {
    return null
  }
  
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        Search Volume Summary
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {Object.entries(summary).map(([category, volume]) => (
          <Paper key={category} elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5} sx={{ textTransform: 'capitalize' }}>
              {category.replace(/_/g, ' ')} Keywords
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {volume.toLocaleString()}/mo
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  )
}

