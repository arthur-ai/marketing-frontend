'use client'

import { useState } from 'react'
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Stack,
  Typography,
  Divider,
} from '@mui/material'
import {
  Add,
  Delete,
} from '@mui/icons-material'

interface KeyValueEditorProps {
  label: string
  data: Record<string, string>
  onChange: (data: Record<string, string>) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

export function KeyValueEditor({
  label,
  data,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: KeyValueEditorProps) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const handleAdd = () => {
    if (newKey.trim()) {
      onChange({ ...data, [newKey.trim()]: newValue.trim() })
      setNewKey('')
      setNewValue('')
    }
  }

  const handleRemove = (key: string) => {
    const newData = { ...data }
    delete newData[key]
    onChange(newData)
  }

  const handleUpdateKey = (oldKey: string, newKeyValue: string) => {
    if (newKeyValue.trim() && newKeyValue !== oldKey) {
      const newData = { ...data }
      const value = newData[oldKey]
      delete newData[oldKey]
      newData[newKeyValue.trim()] = value
      onChange(newData)
    }
  }

  const handleUpdateValue = (key: string, value: string) => {
    onChange({ ...data, [key]: value })
  }

  const canAdd = newKey.trim() && !data[newKey.trim()]

  return (
    <Box>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            size="small"
            placeholder={keyPlaceholder}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            placeholder={valuePlaceholder}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && canAdd) {
                e.preventDefault()
                handleAdd()
              }
            }}
            sx={{ flex: 2 }}
          />
          <IconButton
            onClick={handleAdd}
            disabled={!canAdd}
            color="primary"
            sx={{ mt: 0.5 }}
          >
            <Add />
          </IconButton>
        </Box>

        {Object.keys(data).length > 0 && (
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Stack spacing={1}>
              {Object.entries(data).map(([key, value], index) => (
                <Box key={key}>
                  {index > 0 && <Divider sx={{ my: 1 }} />}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      value={key}
                      onChange={(e) => handleUpdateKey(key, e.target.value)}
                      sx={{ flex: 1 }}
                      variant="standard"
                      InputProps={{
                        disableUnderline: true,
                      }}
                    />
                    <Typography sx={{ mx: 1 }}>:</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      value={value}
                      onChange={(e) => handleUpdateValue(key, e.target.value)}
                      sx={{ flex: 2 }}
                      variant="standard"
                      InputProps={{
                        disableUnderline: true,
                      }}
                    />
                    <IconButton
                      onClick={() => handleRemove(key)}
                      size="small"
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  )
}

