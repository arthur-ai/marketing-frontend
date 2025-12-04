'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import type { EngineConfig } from '@/types/api'

interface SEOKeywordsEngineSettingsProps {
  config: EngineConfig | undefined
  onChange: (config: EngineConfig) => void
}

const AVAILABLE_FIELDS = [
  { value: 'main_keyword', label: 'Main Keyword' },
  { value: 'primary_keywords', label: 'Primary Keywords' },
  { value: 'secondary_keywords', label: 'Secondary Keywords' },
  { value: 'lsi_keywords', label: 'LSI Keywords' },
  { value: 'long_tail_keywords', label: 'Long Tail Keywords' },
  { value: 'keyword_density_analysis', label: 'Keyword Density Analysis' },
  { value: 'search_intent', label: 'Search Intent' },
  { value: 'keyword_clusters', label: 'Keyword Clusters' },
  { value: 'keyword_difficulty', label: 'Keyword Difficulty' },
  { value: 'primary_keywords_metadata', label: 'Primary Keywords Metadata' },
  { value: 'secondary_keywords_metadata', label: 'Secondary Keywords Metadata' },
  { value: 'long_tail_keywords_metadata', label: 'Long Tail Keywords Metadata' },
  { value: 'search_volume_summary', label: 'Search Volume Summary' },
]

export function SEOKeywordsEngineSettings({
  config,
  onChange,
}: SEOKeywordsEngineSettingsProps) {
  const defaultEngine = config?.default_engine || 'llm'
  const fieldOverrides = config?.field_overrides || {}
  const [newField, setNewField] = useState<string>('')
  const [newEngine, setNewEngine] = useState<'llm' | 'local_semantic'>('local_semantic')

  const handleDefaultEngineChange = (engine: 'llm' | 'local_semantic') => {
    onChange({
      default_engine: engine,
      field_overrides: fieldOverrides,
    })
  }

  const handleAddOverride = () => {
    if (!newField || fieldOverrides[newField]) {
      return
    }

    onChange({
      default_engine: defaultEngine,
      field_overrides: {
        ...fieldOverrides,
        [newField]: newEngine,
      },
    })

    setNewField('')
    setNewEngine('local_semantic')
  }

  const handleRemoveOverride = (field: string) => {
    const newOverrides = { ...fieldOverrides }
    delete newOverrides[field]

    onChange({
      default_engine: defaultEngine,
      field_overrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
    })
  }

  const handleOverrideEngineChange = (field: string, engine: 'llm' | 'local_semantic') => {
    onChange({
      default_engine: defaultEngine,
      field_overrides: {
        ...fieldOverrides,
        [field]: engine,
      },
    })
  }

  const availableFieldsForOverride = AVAILABLE_FIELDS.filter(
    (f) => !fieldOverrides[f.value]
  )

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        SEO Keywords Engine Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure which engine (LLM or Local + Semantic) to use for each field in SEO keywords extraction.
        You can set a default engine and override specific fields.
      </Typography>

      {/* Default Engine */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Default Engine
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Default Engine</InputLabel>
          <Select
            value={defaultEngine}
            label="Default Engine"
            onChange={(e) => handleDefaultEngineChange(e.target.value as 'llm' | 'local_semantic')}
          >
            <MenuItem value="llm">LLM Mode</MenuItem>
            <MenuItem value="local_semantic">Local + Semantic Mode</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          All fields will use this engine unless overridden below.
        </Typography>
      </Paper>

      {/* Field Overrides */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Field-Level Overrides
        </Typography>

        {/* Add Override */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end' }}>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Field</InputLabel>
            <Select
              value={newField}
              label="Field"
              onChange={(e) => setNewField(e.target.value)}
            >
              {availableFieldsForOverride.map((field) => (
                <MenuItem key={field.value} value={field.value}>
                  {field.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Engine</InputLabel>
            <Select
              value={newEngine}
              label="Engine"
              onChange={(e) => setNewEngine(e.target.value as 'llm' | 'local_semantic')}
            >
              <MenuItem value="llm">LLM Mode</MenuItem>
              <MenuItem value="local_semantic">Local + Semantic Mode</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddOverride}
            disabled={!newField}
          >
            Add Override
          </Button>
        </Box>

        {/* Overrides Table */}
        {Object.keys(fieldOverrides).length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Field</TableCell>
                  <TableCell>Engine</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(fieldOverrides).map(([field, engine]) => {
                  const fieldLabel = AVAILABLE_FIELDS.find((f) => f.value === field)?.label || field
                  return (
                    <TableRow key={field}>
                      <TableCell>{fieldLabel}</TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <Select
                            value={engine}
                            onChange={(e) =>
                              handleOverrideEngineChange(
                                field,
                                e.target.value as 'llm' | 'local_semantic'
                              )
                            }
                          >
                            <MenuItem value="llm">LLM Mode</MenuItem>
                            <MenuItem value="local_semantic">Local + Semantic Mode</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveOverride(field)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No field overrides. All fields will use the default engine.
          </Typography>
        )}
      </Paper>

      {/* SERP Analysis Settings */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          SERP Analysis Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure the model used for LLM-based SERP analysis (competition insights).
          This is used when Local + Semantic engine extracts SEO metrics.
        </Typography>
        <TextField
          fullWidth
          label="SERP Analysis Model"
          value={config?.serp_analysis_model || ''}
          placeholder="Uses pipeline default if empty"
          onChange={(e) => {
            onChange({
              default_engine: defaultEngine,
              field_overrides: fieldOverrides,
              serp_analysis_model: e.target.value || undefined,
            })
          }}
          helperText="Leave empty to use the pipeline's default model (e.g., gpt-4o-mini)"
        />
      </Paper>

      {/* Summary */}
      <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'info.50', border: 1, borderColor: 'info.200' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Configuration Summary
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label={`Default: ${defaultEngine === 'llm' ? 'LLM Mode' : 'Local + Semantic Mode'}`}
            color="primary"
            size="small"
          />
          {Object.keys(fieldOverrides).length > 0 && (
            <Chip
              label={`${Object.keys(fieldOverrides).length} override(s)`}
              color="secondary"
              size="small"
            />
          )}
          {config?.serp_analysis_model && (
            <Chip
              label={`SERP: ${config.serp_analysis_model}`}
              color="info"
              size="small"
            />
          )}
        </Box>
      </Paper>
    </Box>
  )
}

