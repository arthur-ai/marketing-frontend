'use client'

import { Typography } from '@mui/material'
import { Description } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextarea } from '../../editors/shared/EditableTextarea'

interface ContentStrategySectionProps {
  content: string
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string) => void
}

export function ContentStrategySection({
  content,
  isEditing = false,
  onEdit,
  onChange,
}: ContentStrategySectionProps) {
  if (!isEditing && !content) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Description />}
      title="Content Strategy"
      color="success"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextarea
          label="Content Strategy"
          value={content || ''}
          onChange={onChange || (() => {})}
          rows={6}
          placeholder="Enter content strategy..."
          required
        />
      ) : (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {content || 'N/A'}
        </Typography>
      )}
    </CategoryCard>
  )
}

