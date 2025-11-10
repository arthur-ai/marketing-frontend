'use client'

import { Typography } from '@mui/material'
import { Link } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextField } from '../../editors/shared/EditableTextField'

interface CanonicalUrlSectionProps {
  url: string
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string) => void
}

export function CanonicalUrlSection({
  url,
  isEditing = false,
  onEdit,
  onChange,
}: CanonicalUrlSectionProps) {
  if (!isEditing && !url) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Link />}
      title="Canonical URL"
      color="info"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextField
          label="Canonical URL"
          value={url || ''}
          onChange={onChange || (() => {})}
          fullWidth
          placeholder="Enter canonical URL"
        />
      ) : (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {url}
        </Typography>
      )}
    </CategoryCard>
  )
}

