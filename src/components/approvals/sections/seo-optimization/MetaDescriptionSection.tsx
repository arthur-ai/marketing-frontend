'use client'

import { Typography } from '@mui/material'
import { Description } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextarea } from '../../editors/shared/EditableTextarea'

interface MetaDescriptionSectionProps {
  description: string
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string) => void
}

const getMetaDescStatus = (desc: string) => {
  if (!desc) return { status: 'error' as const, badge: 'Missing' }
  if (desc.length < 150) return { status: 'warning' as const, badge: 'Too Short' }
  if (desc.length > 160) return { status: 'warning' as const, badge: 'Too Long' }
  return { status: 'success' as const, badge: 'Optimal' }
}

export function MetaDescriptionSection({
  description,
  isEditing = false,
  onEdit,
  onChange,
}: MetaDescriptionSectionProps) {
  const metaDescStatus = getMetaDescStatus(description || '')
  
  if (!isEditing && !description) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Description />}
      title="Meta Description"
      color={metaDescStatus.status === 'success' ? 'success' : metaDescStatus.status === 'warning' ? 'warning' : 'error'}
      badge={metaDescStatus.badge}
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextarea
          label="Meta Description"
          value={description || ''}
          onChange={onChange || (() => {})}
          rows={3}
          maxLength={160}
          placeholder="Enter meta description (150-160 characters optimal)"
          required
        />
      ) : (
        <>
          <Typography variant="body2">
            {description || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description?.length || 0} characters (optimal: 150-160)
          </Typography>
        </>
      )}
    </CategoryCard>
  )
}

