'use client'

import { Mic } from '@mui/icons-material'
import { CategoryCard } from '../shared/CategoryCard'
import { EditableTextField } from '../../editors/shared/EditableTextField'
import { FormattedTextDisplay } from '../shared/FormattedTextDisplay'

interface ToneAndVoiceSectionProps {
  value: string
  isEditing?: boolean
  onEdit?: () => void
  onChange?: (value: string) => void
}

export function ToneAndVoiceSection({
  value,
  isEditing = false,
  onEdit,
  onChange,
}: ToneAndVoiceSectionProps) {
  if (!isEditing && !value) {
    return null
  }
  
  return (
    <CategoryCard
      icon={<Mic />}
      title="Tone and Voice"
      color="primary"
      onEdit={onEdit}
      isEditing={isEditing}
    >
      {isEditing ? (
        <EditableTextField
          label="Tone and Voice"
          value={value || ''}
          onChange={onChange || (() => {})}
          fullWidth
          placeholder="Enter recommended tone and voice"
        />
      ) : (
        <FormattedTextDisplay content={value} />
      )}
    </CategoryCard>
  )
}

