'use client'

import { IconButton, Tooltip } from '@mui/material'
import { ContentCopy } from '@mui/icons-material'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

interface CopyButtonProps {
  text: string
  label?: string
  size?: 'small' | 'medium' | 'large'
}

export function CopyButton({ text, label = 'Content', size = 'small' }: CopyButtonProps) {
  const { copy, copied } = useCopyToClipboard()

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
      <IconButton
        size={size}
        onClick={() => copy(text, label)}
        sx={{ color: copied ? 'success.main' : 'inherit' }}
      >
        <ContentCopy fontSize={size} />
      </IconButton>
    </Tooltip>
  )
}
