'use client'

import { Typography } from '@mui/material'
import { Title } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextField } from '../../editors/shared/EditableTextField'

interface ArticleTitleSectionProps {
  title: string
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string) => void
}

export function ArticleTitleSection({
  title,
  isEditing = false,
  onEdit,
  onChange,
}: ArticleTitleSectionProps) {
  if (!isEditing && !title) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Title />}
      title="Article Title"
      color="primary"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextField
          label="Article Title"
          value={title || ''}
          onChange={onChange || (() => {})}
          fullWidth
          placeholder="Enter article title"
          required
        />
      ) : (
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>
      )}
    </CategoryCard>
  )
}

