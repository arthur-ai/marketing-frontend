'use client'

import { Paper } from '@mui/material'
import { SyntaxHighlighter, vs2015 } from '@/lib/syntax-highlighter'

interface JsonDisplayProps {
  data: unknown
  maxHeight?: number | string
  title?: string
}

export function JsonDisplay({ data, maxHeight = '600px', title }: JsonDisplayProps) {
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
      <SyntaxHighlighter
        language="json"
        style={vs2015}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          padding: '1.5rem',
          background: 'transparent',
        }}
      >
        {JSON.stringify(data, null, 2)}
      </SyntaxHighlighter>
    </Paper>
  )
}
