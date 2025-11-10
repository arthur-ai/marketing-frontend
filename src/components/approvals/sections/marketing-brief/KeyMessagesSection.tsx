'use client'

import { Stack, Typography } from '@mui/material'
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
        <Stack spacing={1}>
          {items.map((item: string, index: number) => (
            <Typography key={index} variant="body2" sx={{ pl: 2 }}>
              • {item}
            </Typography>
          ))}
        </Stack>
      )}
    </CategoryCard>
  )
}

