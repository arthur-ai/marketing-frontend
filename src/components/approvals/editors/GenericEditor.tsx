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
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Edit,
  ExpandMore,
  Code,
  Visibility,
} from '@mui/icons-material'
import { QualityMetricsDisplay } from './shared/QualityMetricsDisplay'

interface GenericEditorProps {
  initialData: any
  onDataChange: (data: any, hasChanges: boolean) => void
  isEditing: boolean
  onToggleEdit: () => void
  stepName?: string
}

export function GenericEditor({
  initialData,
  onDataChange,
  isEditing,
  onToggleEdit,
  stepName,
}: GenericEditorProps) {
  const [data, setData] = useState(initialData || {})
  const [jsonEdit, setJsonEdit] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    setData(initialData || {})
    setJsonEdit(JSON.stringify(initialData || {}, null, 2))
    setHasChanges(false)
    setJsonError(null)
  }, [initialData])

  const updateField = (path: string[], value: any) => {
    const newData = { ...data }
    let current: any = newData
    
    // Navigate to the parent object
    for (let i = 0; i < path.length - 1; i++) {
      if (!(path[i] in current)) {
        current[path[i]] = {}
      }
      current = current[path[i]]
    }
    
    // Set the value
    const lastKey = path[path.length - 1]
    if (value === null || value === '') {
      delete current[lastKey]
    } else {
      current[lastKey] = value
    }
    
    setData(newData)
    const changed = JSON.stringify(newData) !== JSON.stringify(initialData)
    setHasChanges(changed)
    onDataChange(newData, changed)
  }

  const handleJsonEdit = (jsonString: string) => {
    setJsonEdit(jsonString)
    try {
      const parsed = JSON.parse(jsonString)
      setData(parsed)
      setJsonError(null)
      const changed = JSON.stringify(parsed) !== JSON.stringify(initialData)
      setHasChanges(changed)
      onDataChange(parsed, changed)
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  const renderField = (key: string, value: any, path: string[] = []): React.ReactNode => {
    const currentPath = [...path, key]
    const pathStr = currentPath.join('.')

    if (value === null || value === undefined) {
      return (
        <TextField
          key={pathStr}
          label={key}
          value=""
          onChange={(e) => updateField(currentPath, e.target.value || null)}
          fullWidth
          size="small"
          sx={{ mb: 1 }}
        />
      )
    }

    if (typeof value === 'string') {
      return (
        <TextField
          key={pathStr}
          label={key}
          value={value}
          onChange={(e) => updateField(currentPath, e.target.value)}
          fullWidth
          multiline={value.length > 100}
          rows={value.length > 100 ? 4 : 1}
          size="small"
          sx={{ mb: 1 }}
        />
      )
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return (
        <TextField
          key={pathStr}
          label={key}
          type={typeof value === 'number' ? 'number' : 'text'}
          value={value.toString()}
          onChange={(e) => {
            if (typeof value === 'number') {
              const num = parseFloat(e.target.value)
              updateField(currentPath, isNaN(num) ? 0 : num)
            } else {
              updateField(currentPath, e.target.value === 'true')
            }
          }}
          fullWidth
          size="small"
          sx={{ mb: 1 }}
        />
      )
    }

    if (Array.isArray(value)) {
      return (
        <Accordion key={pathStr} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2">{key} ({value.length} items)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {value.map((item, index) => (
                <Box key={index}>
                  {typeof item === 'object' && item !== null ? (
                    <Card variant="outlined" sx={{ p: 1 }}>
                      <Stack spacing={1}>
                        {Object.entries(item).map(([k, v]) => renderField(k, v, [...currentPath, index.toString()]))}
                      </Stack>
                    </Card>
                  ) : (
                    <TextField
                      label={`${key}[${index}]`}
                      value={String(item)}
                      onChange={(e) => {
                        const newArray = [...value]
                        newArray[index] = e.target.value
                        updateField(currentPath, newArray)
                      }}
                      fullWidth
                      size="small"
                    />
                  )}
                </Box>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )
    }

    if (typeof value === 'object') {
      return (
        <Accordion key={pathStr} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2">{key}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {Object.entries(value).map(([k, v]) => renderField(k, v, currentPath))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )
    }

    return null
  }

  if (!isEditing) {
    // View mode - formatted display
    return (
      <Box>
        <QualityMetricsDisplay data={data} />
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                {stepName ? stepName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Output Data'}
              </Typography>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={onToggleEdit}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
              <Stack spacing={1}>
                {Object.keys(data).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No data available
                  </Typography>
                ) : (
                  Object.entries(data)
                    .filter(([k]) => !k.includes('_score') && k !== 'confidence_score')
                    .map(([key, value]) => renderField(key, value))
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Edit mode - two tabs: structured edit and JSON edit
  return (
    <Box>
      <QualityMetricsDisplay data={data} />
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              {stepName ? stepName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Edit Output'}
            </Typography>
            <Tooltip title="View">
              <IconButton size="small" onClick={onToggleEdit}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Structured Edit
              </Typography>
              <Box sx={{ maxHeight: 600, overflow: 'auto', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Stack spacing={1}>
                  {Object.keys(data).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No data available
                    </Typography>
                  ) : (
                    Object.entries(data)
                      .filter(([k]) => !k.includes('_score') && k !== 'confidence_score')
                      .map(([key, value]) => renderField(key, value))
                  )}
                </Stack>
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                JSON Edit
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={12}
                value={jsonEdit}
                onChange={(e) => handleJsonEdit(e.target.value)}
                error={!!jsonError}
                helperText={jsonError || 'Edit JSON directly'}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  },
                }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

