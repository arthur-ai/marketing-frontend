'use client'

import { Stack, Typography } from '@mui/material'
import { Lightbulb } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableList } from '../../editors/shared/EditableList'

interface KeyTakeawaysSectionProps {
  items: string[]
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (items: string[]) => void
}

export function KeyTakeawaysSection({
  items,
  isEditing = false,
  onEdit,
  onChange,
}: KeyTakeawaysSectionProps) {
  if (!isEditing && (!items || items.length === 0)) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Lightbulb />}
      title="Key Takeaways"
      color="warning"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableList
          label="Key Takeaways"
          items={items || []}
          onChange={onChange || (() => {})}
          placeholder="Enter key takeaway"
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

