'use client'

import { useState } from 'react'
import {
  TextField,
  Tabs,
  Tab,
  Box,
  Paper,
} from '@mui/material'
import ReactMarkdown from 'react-markdown'

interface EditableTextareaProps {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  maxLength?: number
  showPreview?: boolean
  placeholder?: string
  required?: boolean
}

export function EditableTextarea({
  label,
  value,
  onChange,
  rows = 6,
  maxLength,
  showPreview = false,
  placeholder,
  required = false,
}: EditableTextareaProps) {
  const [tabValue, setTabValue] = useState(0)

  const remaining = maxLength ? maxLength - value.length : undefined

  if (showPreview) {
    return (
      <Box>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Edit" />
          <Tab label="Preview" />
        </Tabs>
        {tabValue === 0 && (
          <TextField
            fullWidth
            multiline
            rows={rows}
            label={label}
            value={value}
            onChange={(e) => {
              if (!maxLength || e.target.value.length <= maxLength) {
                onChange(e.target.value)
              }
            }}
            placeholder={placeholder}
            required={required}
            helperText={
              maxLength
                ? `${value.length} / ${maxLength} characters${remaining !== undefined && remaining < 50 ? ` (${remaining} remaining)` : ''}`
                : undefined
            }
            error={maxLength ? value.length > maxLength : false}
            sx={{ mt: 1 }}
          />
        )}
        {tabValue === 1 && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mt: 1,
              minHeight: rows * 24,
              '& .prose': { maxWidth: 'none' },
            }}
          >
            <ReactMarkdown>{value || '*No content*'}</ReactMarkdown>
          </Paper>
        )}
      </Box>
    )
  }

  return (
    <TextField
      fullWidth
      multiline
      rows={rows}
      label={label}
      value={value}
      onChange={(e) => {
        if (!maxLength || e.target.value.length <= maxLength) {
          onChange(e.target.value)
        }
      }}
      placeholder={placeholder}
      required={required}
      helperText={
        maxLength
          ? `${value.length} / ${maxLength} characters${remaining !== undefined && remaining < 50 ? ` (${remaining} remaining)` : ''}`
          : undefined
      }
      error={maxLength ? value.length > maxLength : false}
    />
  )
}

