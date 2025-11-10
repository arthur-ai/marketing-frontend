'use client'

import { Box, Typography, Chip } from '@mui/material'

interface LongTailKeywordsProps {
  keywords: string[]
}

export function LongTailKeywords({ keywords }: LongTailKeywordsProps) {
  if (!keywords || keywords.length === 0) {
    return null
  }
  
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        Long-tail Keywords ({keywords.length})
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {keywords.map((keyword: string) => (
          <Chip
            key={keyword}
            label={keyword}
            sx={{ bgcolor: 'success.100', color: 'success.dark', fontWeight: 500 }}
            size="small"
          />
        ))}
      </Box>
    </Box>
  )
}

