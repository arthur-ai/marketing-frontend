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
import { ValidationStatusSection } from '../sections/blog-post-preprocessing/ValidationStatusSection'
import { BlogPostDetailsSection } from '../sections/blog-post-preprocessing/BlogPostDetailsSection'
import { ContentAnalysisSection } from '../sections/blog-post-preprocessing/ContentAnalysisSection'
import { SentimentAnalysisSection } from '../sections/blog-post-preprocessing/SentimentAnalysisSection'
import { ParsingInfoSection } from '../sections/transcript-preprocessing/ParsingInfoSection'
import { ParsingWarningsSection } from '../sections/transcript-preprocessing/ParsingWarningsSection'
import { QualityMetricsDisplay } from './shared/QualityMetricsDisplay'

interface BlogPostPreprocessingEditorProps {
  initialData: any
  onDataChange: (data: any, hasChanges: boolean) => void
  isEditing: boolean
  onToggleEdit: () => void
}

export function BlogPostPreprocessingEditor({
  initialData,
  onDataChange,
  isEditing,
  onToggleEdit,
}: BlogPostPreprocessingEditorProps) {
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
                Blog Post Preprocessing Approval
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
              <BlogPostDetailsSection 
                data={data} 
                isEditing={isEditing}
                onUpdate={updateField}
              />
              <ContentAnalysisSection data={data} />
              <SentimentAnalysisSection data={data} />
              <ParsingWarningsSection data={data} />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Edit mode
  return (
    <Box>
      <QualityMetricsDisplay data={data} />
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Edit Blog Post Preprocessing Approval
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
            <BlogPostDetailsSection 
              data={data} 
              isEditing={isEditing}
              onUpdate={updateField}
            />
            <ContentAnalysisSection data={data} />
            <SentimentAnalysisSection data={data} />
            <ParsingWarningsSection data={data} />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

