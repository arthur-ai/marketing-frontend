'use client'

import { Box, Typography, Paper, Stack, Chip } from '@mui/material'

interface KeywordDensityLegacyProps {
  keywordDensity: Record<string, number>
  primaryKeywords: string[]
  mainKeyword?: string
}

export function KeywordDensityLegacy({
  keywordDensity,
  primaryKeywords,
  mainKeyword,
}: KeywordDensityLegacyProps) {
  if (Object.keys(keywordDensity).length === 0) {
    return null
  }
  
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        Keyword Density Analysis (Legacy)
      </Typography>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          {primaryKeywords.map((keyword: string) => {
            const density = keywordDensity[keyword]
            if (density === null || density === undefined) return null
            return (
              <Box
                key={keyword}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5
                }}
              >
                <Typography variant="body2" component="span" sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {keyword}
                  {mainKeyword === keyword && (
                    <Chip
                      label="Main"
                      size="small"
                      color="primary"
                      sx={{ height: 20 }}
                    />
                  )}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, ml: 2 }}>
                  <Box
                    sx={{
                      flex: 1,
                      height: 6,
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                      overflow: 'hidden',
                      mr: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: `${Math.min(density * 10, 100)}%`,
                        height: '100%',
                        bgcolor: density >= 2 ? 'success.main' : density >= 1 ? 'warning.main' : 'info.main'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50, textAlign: 'right' }}>
                    {density.toFixed(2)}%
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Optimal density: 1-2% per keyword. Higher density may indicate keyword stuffing.
        </Typography>
      </Paper>
    </Box>
  )
}

