'use client'

import { Stack, Box, Typography } from '@mui/material'
import { Share } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { KeyValueEditor } from '../../editors/shared/KeyValueEditor'

interface OpenGraphTagsSectionProps {
  ogTags: Record<string, string>
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (ogTags: Record<string, string>) => void
}

export function OpenGraphTagsSection({
  ogTags,
  isEditing = false,
  onEdit,
  onChange,
}: OpenGraphTagsSectionProps) {
  if (!isEditing && (!ogTags || Object.keys(ogTags).length === 0)) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Share />}
      title="Open Graph Tags"
      color="warning"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <KeyValueEditor
          label="Open Graph Tags"
          data={ogTags || {}}
          onChange={onChange || (() => {})}
          keyPlaceholder="Tag name (e.g., og:title)"
          valuePlaceholder="Tag value"
        />
      ) : (
        <Stack spacing={1}>
          {Object.entries(ogTags).map(([key, value]: [string, any]) => (
            <Box key={key}>
              <Typography variant="caption" color="text.secondary">
                {key}:
              </Typography>
              <Typography variant="body2">{String(value)}</Typography>
            </Box>
          ))}
        </Stack>
      )}
    </CategoryCard>
  )
}

