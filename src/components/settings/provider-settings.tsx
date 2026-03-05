'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Cloud as CloudIcon,
  WifiTethering as TestIcon,
} from '@mui/icons-material'
import { apiClient } from '@/lib/api'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'

interface ProviderInfo {
  provider: string
  is_enabled: boolean
  has_api_key: boolean
  project_id: string | null
  region: string | null
  api_base: string | null
  has_vertex_credentials: boolean
  has_aws_credentials: boolean
  created_at: string | null
  updated_at: string | null
}

interface ProviderCredentialsForm {
  is_enabled: boolean
  api_key: string
  project_id: string
  region: string
  api_base: string
  vertex_credentials_json: string
  aws_bedrock_credentials_json: string
}

interface TestResult {
  success: boolean
  message: string
}

const PROVIDER_DISPLAY: Record<string, { label: string; description: string; fields: string[] }> = {
  openai: {
    label: 'OpenAI',
    description: 'GPT-4o, GPT-5, and other OpenAI models',
    fields: ['api_key'],
  },
  anthropic: {
    label: 'Anthropic',
    description: 'Claude 3.5 Sonnet, Claude 3 Opus, and other Anthropic models',
    fields: ['api_key'],
  },
  gemini: {
    label: 'Google Gemini',
    description: 'Gemini 1.5 Pro, Gemini 2.0 Flash, and other Gemini models',
    fields: ['api_key'],
  },
  vertex_ai: {
    label: 'Vertex AI',
    description: 'Gemini and other models via Google Cloud Vertex AI',
    fields: ['project_id', 'region', 'vertex_credentials_json'],
  },
  bedrock: {
    label: 'Amazon Bedrock',
    description: 'Claude, Llama, and other models via AWS Bedrock',
    fields: ['region', 'aws_bedrock_credentials_json'],
  },
  hosted_vllm: {
    label: 'vLLM (Self-hosted)',
    description: 'Open-source models running on your own infrastructure via vLLM',
    fields: ['api_base', 'api_key'],
  },
}

const emptyForm = (): ProviderCredentialsForm => ({
  is_enabled: true,
  api_key: '',
  project_id: '',
  region: '',
  api_base: '',
  vertex_credentials_json: '',
  aws_bedrock_credentials_json: '',
})

export function ProviderSettings() {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [editProvider, setEditProvider] = useState<string | null>(null)
  const [form, setForm] = useState<ProviderCredentialsForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/v1/settings/providers')
      setProviders(response.data?.providers ?? [])
    } catch (err) {
      console.error('Failed to load providers', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const openEdit = (provider: ProviderInfo) => {
    setForm({
      is_enabled: provider.is_enabled,
      api_key: '',
      project_id: provider.project_id ?? '',
      region: provider.region ?? '',
      api_base: provider.api_base ?? '',
      vertex_credentials_json: '',
      aws_bedrock_credentials_json: '',
    })
    setTestResult(null)
    setEditProvider(provider.provider)
  }

  const handleSave = async () => {
    if (!editProvider) return
    try {
      setSaving(true)
      const payload: Record<string, unknown> = {
        is_enabled: form.is_enabled,
      }
      if (form.api_key) payload.api_key = form.api_key
      if (form.project_id) payload.project_id = form.project_id
      if (form.region) payload.region = form.region
      if (form.api_base) payload.api_base = form.api_base
      if (form.vertex_credentials_json) {
        try {
          payload.vertex_credentials = JSON.parse(form.vertex_credentials_json)
        } catch {
          showErrorToast('Invalid JSON', 'Vertex AI credentials must be valid JSON')
          return
        }
      }
      if (form.aws_bedrock_credentials_json) {
        try {
          payload.aws_bedrock_credentials = JSON.parse(form.aws_bedrock_credentials_json)
        } catch {
          showErrorToast('Invalid JSON', 'AWS Bedrock credentials must be valid JSON')
          return
        }
      }
      await apiClient.put(`/v1/settings/providers/${editProvider}`, payload)
      showSuccessToast('Provider saved', `${PROVIDER_DISPLAY[editProvider]?.label ?? editProvider} credentials updated`)
      setEditProvider(null)
      await fetchProviders()
    } catch (err) {
      showErrorToast('Failed to save', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (provider: string) => {
    try {
      await apiClient.delete(`/v1/settings/providers/${provider}`)
      showSuccessToast('Credentials removed', `${PROVIDER_DISPLAY[provider]?.label ?? provider} credentials deleted`)
      setDeleteConfirm(null)
      await fetchProviders()
    } catch (err) {
      showErrorToast('Failed to delete', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleTest = async (providerKey: string) => {
    setTesting(providerKey)
    setTestResult(null)
    try {
      const response = await apiClient.post(`/v1/settings/providers/${providerKey}/test`, {})
      setTestResult({ success: response.data.success, message: response.data.message })
    } catch (err) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : 'Test failed' })
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          LLM Providers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure API credentials for each LLM provider. Credentials are encrypted and stored
          securely in the database. Provider and model selection per pipeline step is managed in
          Arthur.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {providers.map((provider) => {
          const display = PROVIDER_DISPLAY[provider.provider]
          const hasCredentials =
            provider.has_api_key ||
            provider.has_vertex_credentials ||
            provider.has_aws_credentials ||
            !!provider.api_base

          return (
            <Grid item xs={12} md={6} key={provider.provider}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <CloudIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      {display?.label ?? provider.provider}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip
                      size="small"
                      icon={provider.is_enabled && hasCredentials ? <CheckCircleIcon /> : <CancelIcon />}
                      label={provider.is_enabled && hasCredentials ? 'Enabled' : 'Disabled'}
                      color={provider.is_enabled && hasCredentials ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {display?.description ?? ''}
                </Typography>

                {hasCredentials && (
                  <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {provider.has_api_key && <Chip size="small" label="API Key" color="primary" variant="outlined" />}
                    {provider.project_id && <Chip size="small" label={`Project: ${provider.project_id}`} variant="outlined" />}
                    {provider.region && <Chip size="small" label={`Region: ${provider.region}`} variant="outlined" />}
                    {provider.api_base && <Chip size="small" label="Custom endpoint" variant="outlined" />}
                    {provider.has_vertex_credentials && <Chip size="small" label="Service account" color="primary" variant="outlined" />}
                    {provider.has_aws_credentials && <Chip size="small" label="AWS credentials" color="primary" variant="outlined" />}
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => openEdit(provider)}
                  >
                    {hasCredentials ? 'Edit' : 'Configure'}
                  </Button>
                  {hasCredentials && (
                    <Tooltip title="Test connection">
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleTest(provider.provider)}
                          disabled={testing === provider.provider}
                        >
                          {testing === provider.provider
                            ? <CircularProgress size={16} />
                            : <TestIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {hasCredentials && (
                    <Tooltip title="Remove credentials">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(provider.provider)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      {/* Test result snackbar-style inline alert */}
      {testResult && (
        <Alert
          severity={testResult.success ? 'success' : 'error'}
          sx={{ mt: 2 }}
          onClose={() => setTestResult(null)}
        >
          {testResult.message}
        </Alert>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editProvider} onClose={() => setEditProvider(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Configure {editProvider ? (PROVIDER_DISPLAY[editProvider]?.label ?? editProvider) : ''}
        </DialogTitle>
        <DialogContent>
          {editProvider && (
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info" sx={{ mb: 1 }}>
                Leave fields blank to keep existing values. Only filled fields will be updated.
              </Alert>

              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_enabled}
                    onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
                    color="success"
                  />
                }
                label={form.is_enabled ? 'Provider enabled' : 'Provider disabled'}
              />

              {PROVIDER_DISPLAY[editProvider]?.fields.includes('api_key') && (
                <TextField
                  label="API Key"
                  type="password"
                  value={form.api_key}
                  onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                  placeholder="Leave blank to keep existing key"
                  fullWidth
                  size="small"
                />
              )}

              {PROVIDER_DISPLAY[editProvider]?.fields.includes('project_id') && (
                <TextField
                  label="Project ID"
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                  placeholder="GCP project ID"
                  fullWidth
                  size="small"
                />
              )}

              {PROVIDER_DISPLAY[editProvider]?.fields.includes('region') && (
                <TextField
                  label="Region"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder={editProvider === 'bedrock' ? 'e.g. us-east-1' : 'e.g. us-central1'}
                  fullWidth
                  size="small"
                />
              )}

              {PROVIDER_DISPLAY[editProvider]?.fields.includes('api_base') && (
                <TextField
                  label="Endpoint URL"
                  value={form.api_base}
                  onChange={(e) => setForm({ ...form, api_base: e.target.value })}
                  placeholder="https://your-vllm-server:8000"
                  fullWidth
                  size="small"
                />
              )}

              {PROVIDER_DISPLAY[editProvider]?.fields.includes('vertex_credentials_json') && (
                <TextField
                  label="Service Account JSON"
                  value={form.vertex_credentials_json}
                  onChange={(e) => setForm({ ...form, vertex_credentials_json: e.target.value })}
                  placeholder='Paste GCP service account JSON here (leave blank to keep existing)'
                  fullWidth
                  size="small"
                  multiline
                  rows={4}
                />
              )}

              {PROVIDER_DISPLAY[editProvider]?.fields.includes('aws_bedrock_credentials_json') && (
                <TextField
                  label="AWS Credentials JSON"
                  value={form.aws_bedrock_credentials_json}
                  onChange={(e) => setForm({ ...form, aws_bedrock_credentials_json: e.target.value })}
                  placeholder='{"aws_access_key_id": "...", "aws_secret_access_key": "..."}'
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProvider(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Remove credentials?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete the stored credentials for{' '}
            <strong>{deleteConfirm ? (PROVIDER_DISPLAY[deleteConfirm]?.label ?? deleteConfirm) : ''}</strong>.
            The provider will no longer be available for LLM calls.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
