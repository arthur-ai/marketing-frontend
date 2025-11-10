'use client'

import { useState } from 'react'
import {
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import {
  Add,
  Delete,
  DragHandle,
} from '@mui/icons-material'

interface EditableListProps {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  maxItems?: number
  minItems?: number
  required?: boolean
}

export function EditableList({
  label,
  items,
  onChange,
  placeholder = 'Enter item',
  maxItems,
  minItems = 0,
  required = false,
}: EditableListProps) {
  const [newItem, setNewItem] = useState('')

  const handleAdd = () => {
    if (newItem.trim() && (!maxItems || items.length < maxItems)) {
      onChange([...items, newItem.trim()])
      setNewItem('')
    }
  }

  const handleRemove = (index: number) => {
    if (items.length > minItems) {
      const newItems = items.filter((_, i) => i !== index)
      onChange(newItems)
    }
  }

  const handleUpdate = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    onChange(newItems)
  }

  const canAdd = newItem.trim() && (!maxItems || items.length < maxItems)
  const canRemove = items.length > minItems

  return (
    <Box>
      <Stack spacing={1}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            size="small"
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && canAdd) {
                e.preventDefault()
                handleAdd()
              }
            }}
            helperText={
              maxItems
                ? `${items.length} / ${maxItems} items`
                : `${items.length} item${items.length !== 1 ? 's' : ''}`
            }
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

        {items.length > 0 && (
          <Paper variant="outlined" sx={{ p: 1 }}>
            <List dense>
              {items.map((item, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 1,
                    py: 0.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <DragHandle sx={{ mr: 1, color: 'text.secondary', cursor: 'grab' }} />
                  <TextField
                    fullWidth
                    size="small"
                    value={item}
                    onChange={(e) => handleUpdate(index, e.target.value)}
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                    }}
                  />
                  <IconButton
                    onClick={() => handleRemove(index)}
                    disabled={!canRemove}
                    size="small"
                    color="error"
                    sx={{ ml: 1 }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {items.length === 0 && required && (
          <Typography variant="caption" color="error">
            At least one item is required
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

