'use client'

import { Typography } from '@mui/material'
import { Link } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextField } from '../../editors/shared/EditableTextField'

interface SlugSectionProps {
  slug: string
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string) => void
}

export function SlugSection({
  slug,
  isEditing = false,
  onEdit,
  onChange,
}: SlugSectionProps) {
  if (!isEditing && !slug) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Link />}
      title="Slug"
      color="info"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextField
          label="URL Slug"
          value={slug || ''}
          onChange={onChange || (() => {})}
          fullWidth
          placeholder="Enter URL-friendly slug"
        />
      ) : (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {slug}
        </Typography>
      )}
    </CategoryCard>
  )
}

