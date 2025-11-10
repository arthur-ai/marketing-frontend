'use client'

import { Typography } from '@mui/material'
import { Title } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextField } from '../../editors/shared/EditableTextField'

interface MetaTitleSectionProps {
  title: string
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string) => void
}

const getMetaTitleStatus = (title: string) => {
  if (!title) return { status: 'error' as const, badge: 'Missing' }
  if (title.length < 50) return { status: 'warning' as const, badge: 'Too Short' }
  if (title.length > 60) return { status: 'warning' as const, badge: 'Too Long' }
  return { status: 'success' as const, badge: 'Optimal' }
}

export function MetaTitleSection({
  title,
  isEditing = false,
  onEdit,
  onChange,
}: MetaTitleSectionProps) {
  const metaTitleStatus = getMetaTitleStatus(title || '')
  
  if (!isEditing && !title) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Title />}
      title="Meta Title"
      color={metaTitleStatus.status === 'success' ? 'success' : metaTitleStatus.status === 'warning' ? 'warning' : 'error'}
      badge={metaTitleStatus.badge}
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextField
          label="Meta Title"
          value={title || ''}
          onChange={onChange || (() => {})}
          fullWidth
          maxLength={60}
          showCounter={true}
          placeholder="Enter meta title (50-60 characters optimal)"
          required
        />
      ) : (
        <>
          <Typography variant="body1" fontWeight="medium">
            {title || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {title?.length || 0} characters (optimal: 50-60)
          </Typography>
        </>
      )}
    </CategoryCard>
  )
}

