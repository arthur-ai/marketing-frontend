'use client'

import { Box, Paper } from '@mui/material'
import ReactMarkdown from 'react-markdown'

interface MarkdownSectionProps {
  content: string
}

export function MarkdownSection({ content }: MarkdownSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: 'grey.50',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'auto',
      }}
    >
      <Box
        sx={{
          '& .prose': { maxWidth: 'none' },
          '& p': { mb: 1.5 },
          '& ul, & ol': { pl: 2, mb: 1.5 },
          '& code': {
            bgcolor: 'grey.200',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.875rem',
            fontFamily: 'monospace',
          },
          '& pre': {
            bgcolor: 'grey.900',
            color: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            '& code': {
              bgcolor: 'transparent',
              color: 'inherit',
              p: 0,
            },
          },
        }}
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </Box>
    </Paper>
  )
}

