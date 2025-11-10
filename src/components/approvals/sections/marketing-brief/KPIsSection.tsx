'use client'

import { Stack, Typography } from '@mui/material'
import { TrackChanges } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableList } from '../../editors/shared/EditableList'

interface KPIsSectionProps {
  items: string[]
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (items: string[]) => void
}

export function KPIsSection({
  items,
  isEditing = false,
  onEdit,
  onChange,
}: KPIsSectionProps) {
  if (!isEditing && (!items || items.length === 0)) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<TrackChanges />}
      title="KPIs"
      color="warning"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableList
          label="Key Performance Indicators"
          items={items || []}
          onChange={onChange || (() => {})}
          placeholder="Enter KPI"
        />
      ) : (
        <Stack spacing={1}>
          {items.map((item: string, index: number) => (
            <Typography key={index} variant="body2" sx={{ pl: 2 }}>
              • {item}
            </Typography>
          ))}
        </Stack>
      )}
    </CategoryCard>
  )
}

