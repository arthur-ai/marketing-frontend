'use client'

import { Stack, Typography } from '@mui/material'
import { People } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableList } from '../../editors/shared/EditableList'

interface TargetAudienceSectionProps {
  items: string[]
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (items: string[]) => void
}

export function TargetAudienceSection({
  items,
  isEditing = false,
  onEdit,
  onChange,
}: TargetAudienceSectionProps) {
  if (!isEditing && (!items || items.length === 0)) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<People />}
      title="Target Audience"
      color="primary"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableList
          label="Target Audience"
          items={items || []}
          onChange={onChange || (() => {})}
          placeholder="Enter target audience persona"
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

