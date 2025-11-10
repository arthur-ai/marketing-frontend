'use client'

import { Typography } from '@mui/material'
import { Code } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextarea } from '../../editors/shared/EditableTextarea'

interface SchemaMarkupSectionProps {
  schemaMarkup: string | object
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string | object) => void
}

export function SchemaMarkupSection({
  schemaMarkup,
  isEditing = false,
  onEdit,
  onChange,
}: SchemaMarkupSectionProps) {
  if (!isEditing && !schemaMarkup) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Code />}
      title="Schema Markup"
      color="info"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextarea
          label="Schema Markup (JSON-LD)"
          value={typeof schemaMarkup === 'string' ? schemaMarkup : JSON.stringify(schemaMarkup || {}, null, 2)}
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
          rows={8}
          placeholder="Enter JSON-LD schema markup..."
        />
      ) : (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
          {typeof schemaMarkup === 'string' ? schemaMarkup : JSON.stringify(schemaMarkup, null, 2)}
        </Typography>
      )}
    </CategoryCard>
  )
}

