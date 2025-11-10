'use client'

import { Typography } from '@mui/material'
import { TrendingUp } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextarea } from '../../editors/shared/EditableTextarea'

interface CompetitiveAngleSectionProps {
  content: string
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string) => void
}

export function CompetitiveAngleSection({
  content,
  isEditing = false,
  onEdit,
  onChange,
}: CompetitiveAngleSectionProps) {
  if (!isEditing && !content) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<TrendingUp />}
      title="Competitive Angle"
      color="secondary"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextarea
          label="Competitive Angle"
          value={content || ''}
          onChange={onChange || (() => {})}
          rows={4}
          placeholder="Enter unique competitive positioning..."
        />
      ) : (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </Typography>
      )}
    </CategoryCard>
  )
}

