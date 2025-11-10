'use client'

import { Typography, Stack, Box } from '@mui/material'
import { List } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextarea } from '../../editors/shared/EditableTextarea'

interface OutlineSectionProps {
  outline: string | any[] | Record<string, any>
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string | any[] | Record<string, any>) => void
}

export function OutlineSection({
  outline,
  isEditing = false,
  onEdit,
  onChange,
}: OutlineSectionProps) {
  if (!isEditing && !outline) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<List />}
      title="Outline"
      color="info"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextarea
          label="Article Outline"
          value={typeof outline === 'string' ? outline : JSON.stringify(outline, null, 2)}
          onChange={(value) => {
            if (onChange) {
              try {
                const parsed = JSON.parse(value)
                onChange(parsed)
              } catch {
                onChange(value)
              }
            }
          }}
          rows={6}
          placeholder="Enter article outline (JSON or text)..."
        />
      ) : (
        <>
          {typeof outline === 'string' ? (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {outline}
            </Typography>
          ) : Array.isArray(outline) ? (
            <Stack spacing={0.5} component="ol" sx={{ pl: 3, m: 0 }}>
              {outline.map((item: any, index: number) => (
                <Typography
                  key={index}
                  variant="body2"
                  component="li"
                  sx={{ mb: 0.5, whiteSpace: 'pre-wrap' }}
                >
                  {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Stack spacing={1}>
              {Object.entries(outline).map(([key, value]: [string, any], index: number) => (
                <Box key={key} sx={{ display: 'flex', gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      minWidth: '24px',
                      fontWeight: 'medium',
                      color: 'text.secondary',
                    }}
                  >
                    {index + 1}.
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {String(value)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </>
      )}
    </CategoryCard>
  )
}

