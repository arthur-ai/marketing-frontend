'use client'

import { Typography, Stack, Box, Alert, Chip } from '@mui/material'
import { List, Warning } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextarea } from '../../editors/shared/EditableTextarea'

// Generic headers that should be flagged
const GENERIC_HEADERS = [
  'introduction',
  'conclusion',
  'summary',
  'overview',
  'final thoughts',
  'getting started',
  'wrap up',
  'in conclusion',
  'to conclude',
  'summary and conclusion',
]

function detectGenericHeaders(outline: string | any[] | Record<string, any>): string[] {
  const genericFound: string[] = []
  
  if (typeof outline === 'string') {
    const lower = outline.toLowerCase()
    GENERIC_HEADERS.forEach(header => {
      if (lower.includes(header)) {
        genericFound.push(header)
      }
    })
  } else if (Array.isArray(outline)) {
    outline.forEach((item: any) => {
      const itemStr = typeof item === 'string' ? item : JSON.stringify(item)
      const lower = itemStr.toLowerCase()
      GENERIC_HEADERS.forEach(header => {
        if (lower === header || lower.startsWith(header + ':') || lower.startsWith(header + ' ')) {
          genericFound.push(itemStr)
        }
      })
    })
  } else if (typeof outline === 'object' && outline !== null) {
    Object.values(outline).forEach((value: any) => {
      const valueStr = String(value).toLowerCase()
      GENERIC_HEADERS.forEach(header => {
        if (valueStr === header || valueStr.startsWith(header + ':') || valueStr.startsWith(header + ' ')) {
          genericFound.push(String(value))
        }
      })
    })
  }
  
  return [...new Set(genericFound)] // Remove duplicates
}

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
  
  const genericHeaders = detectGenericHeaders(outline)
  const hasGenericHeaders = genericHeaders.length > 0
  
  return (
    <CategoryCard
      icon={<List />}
      title="Outline"
      color="info"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {hasGenericHeaders && !isEditing && (
        <Alert 
          severity="warning" 
          icon={<Warning />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
            Generic headers detected:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {genericHeaders.map((header, idx) => (
              <Chip 
                key={idx} 
                label={header} 
                size="small" 
                color="warning"
                variant="outlined"
              />
            ))}
          </Stack>
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            Headers should be content-specific and keyword-rich, not generic placeholders.
          </Typography>
        </Alert>
      )}
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

