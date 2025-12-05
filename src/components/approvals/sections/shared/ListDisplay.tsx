'use client'

import { Stack, Typography } from '@mui/material'

interface ListDisplayProps {
  items: (string | number)[]
  ordered?: boolean  // Use numbered list if true
  dense?: boolean    // Tighter spacing
}

export function ListDisplay({ items, ordered = false, dense = false }: ListDisplayProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <Stack spacing={dense ? 0.5 : 1}>
      {items.map((item, index) => {
        const key = typeof item === 'string' && item.length > 0 
          ? `${item}-${index}` 
          : `item-${index}`
        return (
          <Typography 
            key={key}
            variant="body2" 
            sx={{ pl: 2 }}
          >
            {ordered ? `${index + 1}. ` : '• '}{item}
          </Typography>
        )
      })}
    </Stack>
  )
}
