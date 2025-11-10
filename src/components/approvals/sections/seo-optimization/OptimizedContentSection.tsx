'use client'

import { Typography } from '@mui/material'
import { Search } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextarea } from '../../editors/shared/EditableTextarea'

interface OptimizedContentSectionProps {
  content: string
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string) => void
}

export function OptimizedContentSection({
  content,
  isEditing = false,
  onEdit,
  onChange,
}: OptimizedContentSectionProps) {
  if (!isEditing && !content) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Search />}
      title="Optimized Content"
      color="primary"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextarea
          label="SEO Optimized Content"
          value={content || ''}
          onChange={onChange || (() => {})}
          rows={12}
          showPreview={true}
          placeholder="Enter SEO-optimized content..."
          required
        />
      ) : (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>
          {content}
        </Typography>
      )}
    </CategoryCard>
  )
}

