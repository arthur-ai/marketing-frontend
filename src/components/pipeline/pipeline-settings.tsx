'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import Slider from '@mui/material/Slider'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import SettingsIcon from '@mui/icons-material/Settings'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import BoltIcon from '@mui/icons-material/Bolt'
import SaveIcon from '@mui/icons-material/Save'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import WarningIcon from '@mui/icons-material/Warning'
import { useApprovalSettings, useUpdateApprovalSettings } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import type { ApprovalSettings } from '@/types/api'

const AVAILABLE_STEPS = [
  {
    id: 'content_pipeline',
    name: 'Content Pipeline',
    description: 'Main content orchestration and processing',
    color: 'primary',
    impact: 'high'
  },
  {
    id: 'article_generation',
    name: 'Article Generation',
    description: 'AI-generated article content',
    color: 'secondary',
    impact: 'high'
  },
  {
    id: 'marketing_brief',
    name: 'Marketing Brief',
    description: 'Strategic marketing recommendations',
    color: 'error',
    impact: 'high'
  },
  {
    id: 'seo_keywords',
    name: 'SEO Keywords',
    description: 'Keyword extraction and analysis',
    color: 'success',
    impact: 'medium'
  },
  {
    id: 'seo_optimization',
    name: 'SEO Optimization',
    description: 'SEO recommendations and optimizations',
    color: 'warning',
    impact: 'medium'
  },
  {
    id: 'content_formatting',
    name: 'Content Formatting',
    description: 'Final content formatting and structure',
    color: 'info',
    impact: 'medium'
  },
  {
    id: 'design_kit',
    name: 'Design Kit',
    description: 'Design and visual recommendations',
    color: 'secondary',
    impact: 'low'
  },
  {
    id: 'suggested_links',
    name: 'Suggested Links',
    description: 'Suggest internal links to add to the article',
    color: 'default',
    impact: 'low'
  }
]

export function PipelineSettings() {
  const { data: settingsData, isLoading } = useApprovalSettings()
  const updateSettings = useUpdateApprovalSettings()
  
  const [enabled, setEnabled] = useState(settingsData?.data?.require_approval ?? false)
  const [selectedSteps, setSelectedSteps] = useState<string[]>(
    settingsData?.data?.approval_agents ?? []
  )
  const [autoApproveThreshold, setAutoApproveThreshold] = useState<number | undefined>(
    settingsData?.data?.auto_approve_threshold ? settingsData.data.auto_approve_threshold * 100 : undefined
  )
  const [timeoutMinutes, setTimeoutMinutes] = useState<number | undefined>(
    settingsData?.data?.timeout_seconds ? settingsData.data.timeout_seconds / 60 : undefined
  )

  // Update local state when data loads
  useEffect(() => {
    if (settingsData?.data) {
      setEnabled(settingsData.data.require_approval)
      setSelectedSteps(settingsData.data.approval_agents)
      setAutoApproveThreshold(
        settingsData.data.auto_approve_threshold 
          ? settingsData.data.auto_approve_threshold * 100 
          : undefined
      )
      setTimeoutMinutes(
        settingsData.data.timeout_seconds 
          ? settingsData.data.timeout_seconds / 60 
          : undefined
      )
    }
  }, [settingsData])

  const toggleStep = (stepId: string) => {
    setSelectedSteps(prev => 
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    )
  }

  const handleSave = async () => {
    try {
      const newSettings: ApprovalSettings = {
        require_approval: enabled,
        approval_agents: selectedSteps,
        auto_approve_threshold: autoApproveThreshold ? autoApproveThreshold / 100 : undefined,
        timeout_seconds: timeoutMinutes ? timeoutMinutes * 60 : undefined
      }

      await updateSettings.mutateAsync(newSettings)
      
      showSuccessToast(
        'Settings saved',
        `Approvals ${enabled ? 'enabled' : 'disabled'} for ${selectedSteps.length} step(s)`
      )
    } catch (error) {
      showErrorToast(
        'Failed to save settings',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  const handleReset = () => {
    if (settingsData?.data) {
      setEnabled(settingsData.data.require_approval)
      setSelectedSteps(settingsData.data.approval_agents)
      setAutoApproveThreshold(
        settingsData.data.auto_approve_threshold 
          ? settingsData.data.auto_approve_threshold * 100 
          : undefined
      )
      setTimeoutMinutes(
        settingsData.data.timeout_seconds 
          ? settingsData.data.timeout_seconds / 60 
          : undefined
      )
    }
  }

  const selectAllHighImpact = () => {
    const highImpactSteps = AVAILABLE_STEPS
      .filter(s => s.impact === 'high')
      .map(s => s.id)
    setSelectedSteps(highImpactSteps)
  }

  const selectAllSteps = () => {
    setSelectedSteps(AVAILABLE_STEPS.map(s => s.id))
  }

  const deselectAll = () => {
    setSelectedSteps([])
  }

  if (isLoading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 2, 
            bgcolor: 'primary.50',
            color: 'primary.main',
          }}>
            <SettingsIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Pipeline Approval Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure which pipeline steps require human approval before proceeding
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
            Status
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: enabled ? 'primary.main' : 'text.secondary' }}>
            {enabled ? 'Enabled' : 'Disabled'}
          </Typography>
        </Box>
      </Box>

      {/* Master Toggle */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2.5, 
          mb: 3,
          borderRadius: 2,
          bgcolor: enabled ? 'primary.50' : 'grey.50',
          border: 1,
          borderColor: enabled ? 'primary.200' : 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SettingsIcon sx={{ color: enabled ? 'primary.main' : 'text.secondary', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {enabled ? 'Approvals Enabled' : 'Approvals Disabled'}
            </Typography>
          </Box>
          <Switch
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            color="primary"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4.5 }}>
          {enabled 
            ? 'Pipeline will pause for review at selected steps'
            : 'Pipeline will run automatically without pausing'}
        </Typography>
      </Paper>

      {/* Agent Selection */}
      {enabled && (
        <>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Select Steps to Review ({selectedSteps.length}/{AVAILABLE_STEPS.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={selectAllHighImpact}
                  sx={{ textTransform: 'none' }}
                >
                  High Impact
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={selectAllSteps}
                  sx={{ textTransform: 'none' }}
                >
                  Select All
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={deselectAll}
                  sx={{ textTransform: 'none' }}
                >
                  Clear
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {AVAILABLE_STEPS.map(step => {
                const isSelected = selectedSteps.includes(step.id)
                return (
                  <Paper
                    key={step.id}
                    elevation={0}
                    onClick={() => toggleStep(step.id)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: 2,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'primary.50' : 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: isSelected ? 'primary.dark' : 'text.secondary',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: `${step.color}.main`,
                            mt: 0.5,
                            flexShrink: 0
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {step.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {step.description}
                          </Typography>
                        </Box>
                      </Box>
                      {isSelected && (
                        <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20, flexShrink: 0 }} />
                      )}
                    </Box>
                    <Chip
                      label={`${step.impact} impact`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        bgcolor: step.impact === 'high' ? 'error.50' : step.impact === 'medium' ? 'warning.50' : 'grey.50',
                        color: step.impact === 'high' ? 'error.main' : step.impact === 'medium' ? 'warning.main' : 'text.secondary',
                        border: 'none',
                        fontWeight: 500
                      }}
                    />
                  </Paper>
                )
              })}
            </Box>
          </Box>

          {/* Auto-Approval Threshold */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 2.5, 
              mb: 2,
              borderRadius: 2,
              bgcolor: 'success.50',
              border: 1,
              borderColor: 'success.200'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
              <BoltIcon sx={{ color: 'success.main', fontSize: 20, mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Auto-Approval Threshold
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Automatically approve outputs with confidence above this threshold
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={autoApproveThreshold ?? 0}
                    onChange={(_, value) => setAutoApproveThreshold(value as number)}
                    min={0}
                    max={100}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={autoApproveThreshold ?? 0}
                    onChange={(e) => setAutoApproveThreshold(Number(e.target.value))}
                    inputProps={{ min: 0, max: 100 }}
                    size="small"
                    sx={{ width: 80 }}
                    InputProps={{
                      endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>%</Typography>
                    }}
                  />
                </Box>
                {autoApproveThreshold && autoApproveThreshold > 0 && (
                  <Typography variant="caption" sx={{ color: 'success.main', mt: 1, display: 'block' }}>
                    Outputs with ≥{autoApproveThreshold}% confidence will auto-approve
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Timeout */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 2.5, 
              mb: 2,
              borderRadius: 2,
              bgcolor: 'warning.50',
              border: 1,
              borderColor: 'warning.200'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
              <AccessTimeIcon sx={{ color: 'warning.main', fontSize: 20, mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Approval Timeout
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Automatically reject if not reviewed within this time
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={timeoutMinutes ?? 10}
                    onChange={(_, value) => setTimeoutMinutes(value as number)}
                    min={1}
                    max={60}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={timeoutMinutes ?? 10}
                    onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                    inputProps={{ min: 1, max: 60 }}
                    size="small"
                    sx={{ width: 80 }}
                    InputProps={{
                      endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>min</Typography>
                    }}
                  />
                </Box>
                {timeoutMinutes && (
                  <Typography variant="caption" sx={{ color: 'warning.main', mt: 1, display: 'block' }}>
                    Approvals will auto-reject after {timeoutMinutes} minute{timeoutMinutes !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Warning for no steps selected */}
          {selectedSteps.length === 0 && (
            <Paper 
              elevation={0}
              sx={{ 
                p: 2.5, 
                mb: 2,
                borderRadius: 2,
                bgcolor: 'error.50',
                border: 1,
                borderColor: 'error.200'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <WarningIcon sx={{ color: 'error.main', fontSize: 20, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main', mb: 0.5 }}>
                    No Steps Selected
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'error.dark' }}>
                    Approvals are enabled but no steps are selected. Pipeline will run without pausing.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          variant="outlined"
          startIcon={<RotateLeftIcon />}
          onClick={handleReset}
          sx={{ textTransform: 'none' }}
        >
          Reset
        </Button>

        <Button
          variant="contained"
          startIcon={updateSettings.isPending ? <CircularProgress size={16} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={updateSettings.isPending}
          sx={{ textTransform: 'none' }}
        >
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Paper>
  )
}
