'use client'

import { Box, Paper } from '@mui/material'

interface JsonDisplayProps {
  data: unknown
  maxHeight?: number | string
  title?: string
}

export function JsonDisplay({ data, maxHeight = '600px' }: JsonDisplayProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        bgcolor: 'grey.900',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'auto',
        maxHeight,
      }}
    >
      <Box
        component="pre"
        sx={{
          margin: 0,
          padding: '1.5rem',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: '#abb2bf',
          background: 'transparent',
          lineHeight: 1.6,
        }}
      >
        {JSON.stringify(data, null, 2)}
      </Box>
    </Paper>
  )
}
