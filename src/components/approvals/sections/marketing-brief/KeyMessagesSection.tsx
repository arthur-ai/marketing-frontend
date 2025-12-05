'use client'

import { Box, Stack, Typography } from '@mui/material'
import { Message } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableList } from '../../editors/shared/EditableList'

interface KeyMessagesSectionProps {
  items: string[]
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (items: string[]) => void
}

export function KeyMessagesSection({
  items,
  isEditing = false,
  onEdit,
  onChange,
}: KeyMessagesSectionProps) {
  if (!isEditing && (!items || items.length === 0)) {
    return null
  }

  // Process items: handle case where items might be a single string or array
  // If it's a single string that looks like multiple messages, split it
  let processedItems: string[] = []
  if (items && items.length > 0) {
    if (items.length === 1) {
      const singleItem = items[0]
      // Check if it contains multiple numbered messages (pattern: "1. ", "2. ", etc. followed by capital letter)
      const numberedPattern = /\d+\.\s+[A-Z]/
      if (numberedPattern.test(singleItem)) {
        // Single item that might contain multiple numbered messages
        // Try to split by number pattern (e.g., "1. ", "2. ", etc.)
        const splitItems = singleItem.split(/(?=\d+\.\s+[A-Z])/).filter(item => item.trim().length > 0)
        if (splitItems.length > 1) {
          processedItems = splitItems
        } else {
          processedItems = items
        }
      } else {
        processedItems = items
      }
    } else {
      processedItems = items
    }
  }
  
  return (
    <CategoryCard
      icon={<Message />}
      title="Key Messages"
      color="secondary"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableList
          label="Key Messages"
          items={items || []}
          onChange={onChange || (() => {})}
          placeholder="Enter key message"
          minItems={1}
          required
        />
      ) : (
        <Stack spacing={2}>
          {processedItems.map((item: string, index: number) => {
            // Remove existing numbering if present (e.g., "1. ", "2. ", "1.1. ", etc. at the start)
            let cleanItem = item.trim()
            // Match patterns like "1. ", "2. ", "1.1. ", "1. 1. ", etc. at the start
            // This handles cases like "1. 1. Text" -> "Text"
            cleanItem = cleanItem.replace(/^(\d+\.\s*)+/, '')
            
            return (
              <Box
                key={index}
                sx={{
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: index % 2 === 0 ? 'grey.50' : 'transparent',
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    lineHeight: 1.7,
                    fontWeight: 500,
                  }}
                >
                  {index + 1}. {cleanItem}
                </Typography>
              </Box>
            )
          })}
        </Stack>
      )}
    </CategoryCard>
  )
}

