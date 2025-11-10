'use client'

import { Typography } from '@mui/material'
import { Description } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextarea } from '../../editors/shared/EditableTextarea'

interface ArticleContentSectionProps {
  content: string
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string) => void
}

export function ArticleContentSection({
  content,
  isEditing = false,
  onEdit,
  onChange,
}: ArticleContentSectionProps) {
  if (!isEditing && !content) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Description />}
      title="Article Content"
      color="success"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextarea
          label="Article Content"
          value={content || ''}
          onChange={onChange || (() => {})}
          rows={12}
          showPreview={true}
          placeholder="Enter article content..."
          required
        />
      ) : (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </Typography>
      )}
    </CategoryCard>
  )
}

