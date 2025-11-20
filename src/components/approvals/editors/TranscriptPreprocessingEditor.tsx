'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Edit,
  Visibility,
} from '@mui/icons-material'
import { ValidationStatusSection } from '../sections/transcript-preprocessing/ValidationStatusSection'
import { TranscriptDetailsSection } from '../sections/transcript-preprocessing/TranscriptDetailsSection'
import { ParsingInfoSection } from '../sections/transcript-preprocessing/ParsingInfoSection'
import { SpeakerAnalysisSection } from '../sections/transcript-preprocessing/SpeakerAnalysisSection'
import { ContentEnhancementSection } from '../sections/transcript-preprocessing/ContentEnhancementSection'
import { ParsingWarningsSection } from '../sections/transcript-preprocessing/ParsingWarningsSection'
import { QualityMetricsDisplay } from './shared/QualityMetricsDisplay'

interface TranscriptPreprocessingEditorProps {
  initialData: any
  onDataChange: (data: any, hasChanges: boolean) => void
  isEditing: boolean
  onToggleEdit: () => void
}

export function TranscriptPreprocessingEditor({
  initialData,
  onDataChange,
  isEditing,
  onToggleEdit,
}: TranscriptPreprocessingEditorProps) {
  const [data, setData] = useState(initialData || {})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setData(initialData || {})
    setHasChanges(false)
  }, [initialData])

  const updateField = (field: string, value: any) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    const changed = JSON.stringify(newData) !== JSON.stringify(initialData)
    setHasChanges(changed)
    onDataChange(newData, changed)
  }

  if (!isEditing) {
    // View mode
    return (
      <Box>
        <QualityMetricsDisplay data={data} />
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Transcript Preprocessing Approval
              </Typography>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={onToggleEdit}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Stack spacing={3}>
              <ParsingInfoSection data={data} />
              <ValidationStatusSection data={data} />
              <TranscriptDetailsSection 
                data={data} 
                isEditing={isEditing}
                onUpdate={updateField}
              />
              <SpeakerAnalysisSection data={data} />
              <ContentEnhancementSection data={data} />
              <ParsingWarningsSection data={data} />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Edit mode - for now, use a simple JSON editor approach
  // In the future, we could add more structured editing
  return (
    <Box>
      <QualityMetricsDisplay data={data} />
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Edit Transcript Preprocessing Approval
            </Typography>
            <Tooltip title="View">
              <IconButton size="small" onClick={onToggleEdit}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Stack spacing={3}>
            <ParsingInfoSection data={data} />
            <ValidationStatusSection data={data} />
            <TranscriptDetailsSection data={data} />
            <SpeakerAnalysisSection data={data} />
            <ContentEnhancementSection data={data} />
            <ParsingWarningsSection data={data} />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

