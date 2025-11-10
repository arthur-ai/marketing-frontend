'use client'

import { Stack, Typography } from '@mui/material'
import { Share } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableList } from '../../editors/shared/EditableList'

interface DistributionChannelsSectionProps {
  items: string[]
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (items: string[]) => void
}

export function DistributionChannelsSection({
  items,
  isEditing = false,
  onEdit,
  onChange,
}: DistributionChannelsSectionProps) {
  if (!isEditing && (!items || items.length === 0)) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Share />}
      title="Distribution Channels"
      color="info"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableList
          label="Distribution Channels"
          items={items || []}
          onChange={onChange || (() => {})}
          placeholder="Enter distribution channel"
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

