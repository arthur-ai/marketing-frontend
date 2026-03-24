'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
  Chip,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  WifiTethering as TestIcon,
  People as PersonasIcon,
} from '@mui/icons-material'
import { apiClient } from '@/lib/api'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'

interface ProfoundSettingsInfo {
  is_enabled: boolean
  has_api_key: boolean
  default_category_id: string | null
  created_at: string | null
  updated_at: string | null
}

interface ProfoundTestResult {
  success: boolean
  message: string
  personas_count: number
}

interface ProfoundForm {
  is_enabled: boolean
  api_key: string
  default_category_id: string
}

const emptyForm = (): ProfoundForm => ({
  is_enabled: true,
  api_key: '',
  default_category_id: '',
})

export function ProfoundSettings() {
  const [settings, setSettings] = useState<ProfoundSettingsInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<ProfoundForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<ProfoundTestResult | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/v1/settings/profound')
      const data: ProfoundSettingsInfo = response.data
      setSettings(data)
      setForm({
        is_enabled: data.is_enabled,
        api_key: '',
        default_category_id: data.default_category_id ?? '',
      })
    } catch {
      // No settings configured yet — start with empty form
      setSettings(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload: Record<string, unknown> = {
        is_enabled: form.is_enabled,
      }
      if (form.api_key.trim()) payload.api_key = form.api_key.trim()
      if (form.default_category_id.trim())
        payload.default_category_id = form.default_category_id.trim()

      await apiClient.put('/v1/settings/profound', payload)
      showSuccessToast('Profound settings saved.')
      setForm((f) => ({ ...f, api_key: '' })) // clear key from form after save
      await fetchSettings()
      setTestResult(null)
    } catch {
      showErrorToast('Failed to save Profound settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await apiClient.delete('/v1/settings/profound')
      showSuccessToast('Profound settings removed.')
      setSettings(null)
      setForm(emptyForm())
      setTestResult(null)
    } catch {
      showErrorToast('Failed to remove Profound settings.')
    } finally {
      setDeleting(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      setTestResult(null)
      const response = await apiClient.post('/v1/settings/profound/test')
      setTestResult(response.data)
    } catch {
      setTestResult({ success: false, message: 'Request failed.', personas_count: 0 })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  const isConfigured = settings?.has_api_key && settings?.default_category_id

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profound AI — Audience Persona Enrichment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connect your Profound account to enrich SEO keyword targeting with real audience
          personas. When configured, the keyword pipeline includes pain points, job roles, and
          industry context from your Profound category.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 3 }}>
        {/* Status chip */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <PersonasIcon color="action" />
          <Typography variant="subtitle1" fontWeight={500}>
            Integration Status
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            {isConfigured ? (
              <Chip
                icon={<CheckCircleIcon />}
                label="Configured"
                color="success"
                size="small"
                variant="outlined"
              />
            ) : (
              <Chip
                icon={<CancelIcon />}
                label="Not configured"
                color="default"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Form fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.is_enabled}
                onChange={(e) => setForm((f) => ({ ...f, is_enabled: e.target.checked }))}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  Enable persona injection
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  When disabled, keywords are generated without persona context
                </Typography>
              </Box>
            }
          />

          <TextField
            label="API Key"
            type="password"
            placeholder={settings?.has_api_key ? '••••••••  (key saved — enter new to replace)' : 'Enter your Profound API key'}
            value={form.api_key}
            onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
            fullWidth
            size="small"
            helperText="Your Profound API key. Stored encrypted in the database."
          />

          <TextField
            label="Default Category ID"
            placeholder="182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e"
            value={form.default_category_id}
            onChange={(e) => setForm((f) => ({ ...f, default_category_id: e.target.value }))}
            fullWidth
            size="small"
            helperText="UUID of the Profound category to fetch personas from. Find it in your Profound dashboard."
          />
        </Box>

        {/* Test result */}
        {testResult && (
          <Alert
            severity={testResult.success ? 'success' : 'error'}
            sx={{ mt: 2 }}
            icon={testResult.success ? <CheckCircleIcon /> : <CancelIcon />}
          >
            {testResult.message}
          </Alert>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || (!form.api_key.trim() && !form.default_category_id.trim() && settings?.has_api_key)}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>

          <Button
            variant="outlined"
            startIcon={testing ? <CircularProgress size={16} /> : <TestIcon />}
            onClick={handleTest}
            disabled={testing || !settings?.has_api_key}
          >
            {testing ? 'Testing…' : 'Test Connection'}
          </Button>

          {settings && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={deleting}
              sx={{ ml: 'auto' }}
            >
              {deleting ? 'Removing…' : 'Remove Settings'}
            </Button>
          )}
        </Box>

        {!settings?.has_api_key && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Tip: You can also set <code>PROFOUND_API_KEY</code> and{' '}
            <code>PROFOUND_CATEGORY_ID</code> as environment variables as a fallback.
          </Typography>
        )}
      </Paper>
    </Box>
  )
}
