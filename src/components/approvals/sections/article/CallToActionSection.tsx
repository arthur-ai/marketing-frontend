'use client'

import { Typography } from '@mui/material'
import { CallToAction } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextarea } from '../../editors/shared/EditableTextarea'

interface CallToActionSectionProps {
  content: string
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string) => void
}

export function CallToActionSection({
  content,
  isEditing = false,
  onEdit,
  onChange,
}: CallToActionSectionProps) {
  if (!isEditing && !content) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<CallToAction />}
      title="Call to Action"
      color="secondary"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextarea
          label="Call to Action"
          value={content || ''}
          onChange={onChange || (() => {})}
          rows={3}
          placeholder="Enter call to action..."
        />
      ) : (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </Typography>
      )}
    </CategoryCard>
  )
}

