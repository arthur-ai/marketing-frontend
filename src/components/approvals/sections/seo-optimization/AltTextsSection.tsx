'use client'

import { Stack, Box, Typography } from '@mui/material'
import { Image } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { KeyValueEditor } from '../../editors/shared/KeyValueEditor'

interface AltTextsSectionProps {
  altTexts: Record<string, string>
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (altTexts: Record<string, string>) => void
}

export function AltTextsSection({
  altTexts,
  isEditing = false,
  onEdit,
  onChange,
}: AltTextsSectionProps) {
  if (!isEditing && (!altTexts || Object.keys(altTexts).length === 0)) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Image />}
      title="Alt Texts"
      color="secondary"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <KeyValueEditor
          label="Image Alt Texts"
          data={altTexts || {}}
          onChange={onChange || (() => {})}
          keyPlaceholder="Image name/path"
          valuePlaceholder="Alt text description"
        />
      ) : (
        <Stack spacing={1}>
          {Object.entries(altTexts).map(([key, value]: [string, any]) => (
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

