'use client'

import { Box, Stack, Typography, Divider } from '@mui/material'
import { Share } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableList } from '../../editors/shared/EditableList'

interface DistributionChannelsSectionProps {
  items: string[]
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (items: string[]) => void
}

export function DistributionChannelsSection({
  items,
  isEditing = false,
  onEdit,
  onChange,
}: DistributionChannelsSectionProps) {
  if (!isEditing && (!items || items.length === 0)) {
    return null
  }

  // Process items to handle structured content with categories
  const processItems = (items: string[]) => {
    const processed: Array<{ category?: string; content: string }> = []
    
    items.forEach(item => {
      const trimmed = item.trim()
      // Check if item starts with a category (e.g., "Arthur Blog (Primary):", "LinkedIn:")
      const categoryMatch = trimmed.match(/^([^:]+):\s*(.+)$/)
      if (categoryMatch) {
        processed.push({
          category: categoryMatch[1].trim(),
          content: categoryMatch[2].trim()
        })
      } else {
        processed.push({ content: trimmed })
      }
    })
    
    return processed
  }
  
  return (
    <CategoryCard
      icon={<Share />}
      title="Distribution Channels"
      color="info"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableList
          label="Distribution Channels"
          items={items || []}
          onChange={onChange || (() => {})}
          placeholder="Enter distribution channel"
        />
      ) : (
        <Stack spacing={2}>
          {processItems(items).map((processed, index) => (
            <Box key={index}>
              {processed.category && (
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'primary.main' }}>
                  {processed.category}
                </Typography>
              )}
              <Typography 
                variant="body2" 
                sx={{ 
                  pl: processed.category ? 2 : 0,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {processed.content}
              </Typography>
              {index < processItems(items).length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Stack>
      )}
    </CategoryCard>
  )
}

