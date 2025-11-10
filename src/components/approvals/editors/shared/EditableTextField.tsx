'use client'

import { TextField, TextFieldProps } from '@mui/material'

interface EditableTextFieldProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  showCounter?: boolean
}

export function EditableTextField({
  value,
  onChange,
  maxLength,
  showCounter = false,
  ...props
}: EditableTextFieldProps) {
  const remaining = maxLength ? maxLength - value.length : undefined

  return (
    <TextField
      {...props}
      value={value}
      onChange={(e) => {
        if (!maxLength || e.target.value.length <= maxLength) {
          onChange(e.target.value)
        }
      }}
      helperText={
        showCounter && maxLength
          ? `${value.length} / ${maxLength} characters${remaining !== undefined && remaining < 20 ? ` (${remaining} remaining)` : ''}`
          : props.helperText
      }
      error={maxLength ? value.length > maxLength : props.error}
    />
  )
}

