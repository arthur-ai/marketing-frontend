'use client'

import { Box, Stack, Typography } from '@mui/material'
import { People } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableList } from '../../editors/shared/EditableList'

interface TargetAudienceSectionProps {
  items: string[]
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (items: string[]) => void
}

export function TargetAudienceSection({
  items,
  isEditing = false,
  onEdit,
  onChange,
}: TargetAudienceSectionProps) {
  if (!isEditing && (!items || items.length === 0)) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<People />}
      title="Target Audience"
      color="primary"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableList
          label="Target Audience"
          items={items || []}
          onChange={onChange || (() => {})}
          placeholder="Enter target audience persona"
          minItems={1}
          required
        />
      ) : (
        <Stack spacing={2}>
          {items.map((item: string, index: number) => {
            // Try to parse structured persona content
            const lines = item.split('\n').filter(l => l.trim())
            const hasStructure = lines.some(l => 
              l.includes('Who they are:') || 
              l.includes('Demographics:') || 
              l.includes('Psychographics:') ||
              l.includes('Pain points:') ||
              l.includes("What they're searching:") ||
              l.includes('What they want from this content:')
            )

            if (hasStructure) {
              // Parse structured persona
              const sections: Record<string, string> = {}
              let currentSection = ''
              let currentContent: string[] = []

              lines.forEach(line => {
                const trimmed = line.trim()
                if (trimmed.match(/^(Who they are|Demographics|Psychographics|Pain points|What they're searching|What they want from this content):/)) {
                  if (currentSection) {
                    sections[currentSection] = currentContent.join(' ').trim()
                  }
                  currentSection = trimmed.split(':')[0]
                  currentContent = [trimmed.split(':').slice(1).join(':').trim()].filter(Boolean)
                } else if (currentSection) {
                  currentContent.push(trimmed)
                } else {
                  // First line without a section header
                  if (!sections['Who they are']) {
                    sections['Who they are'] = trimmed
                  }
                }
              })
              if (currentSection) {
                sections[currentSection] = currentContent.join(' ').trim()
              }

              return (
                <Box 
                  key={index} 
                  sx={{ 
                    p: 2, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'grey.50'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                    Persona {index + 1}
                  </Typography>
                  <Stack spacing={1.5}>
                    {Object.entries(sections).map(([key, value]) => (
                      <Box key={key}>
                        <Typography variant="body2" fontWeight="bold" color="primary" sx={{ mb: 0.5 }}>
                          {key}:
                        </Typography>
                        <Typography variant="body2" sx={{ pl: 1, lineHeight: 1.6 }}>
                          {value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )
            }

            // Fallback to simple display
            return (
              <Box 
                key={index}
                sx={{ 
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: index % 2 === 0 ? 'grey.50' : 'transparent'
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {item}
                </Typography>
              </Box>
            )
          })}
        </Stack>
      )}
    </CategoryCard>
  )
}

