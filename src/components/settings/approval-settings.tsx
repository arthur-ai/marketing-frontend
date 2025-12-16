'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import Slider from '@mui/material/Slider'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import BoltIcon from '@mui/icons-material/Bolt'
import WarningIcon from '@mui/icons-material/Warning'
import { useApprovalSettings, useUpdateApprovalSettings } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import type { ApprovalSettings } from '@/types/api'

const AVAILABLE_STEPS = [
  {
    id: 'transcript_preprocessing_approval',
    name: 'Transcript Preprocessing Approval',
    description: 'Validate transcript fields (speakers, duration, content) before processing',
    color: 'info',
    impact: 'high'
  },
  {
    id: 'blog_post_preprocessing_approval',
    name: 'Blog Post Preprocessing Approval',
    description: 'Validate blog post fields (title, content, author, category, tags) and perform content analysis',
    color: 'primary',
    impact: 'high'
  },
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
  },
  {
    id: 'social_media_marketing_brief',
    name: 'Social Media Marketing Brief',
    description: 'Platform-specific marketing brief for social media',
    color: 'secondary',
    impact: 'high'
  },
  {
    id: 'social_media_angle_hook',
    name: 'Social Media Angle & Hook',
    description: 'Engaging angles and hooks for social media posts',
    color: 'info',
    impact: 'medium'
  },
  {
    id: 'social_media_post_generation',
    name: 'Social Media Post Generation',
    description: 'Generate platform-specific social media posts',
    color: 'primary',
    impact: 'high'
  }
]

interface ApprovalSettingsProps {
  onSave?: () => void
  onReset?: () => void
  onSaveRequest?: () => Promise<boolean>
  onChange?: (hasChanges: boolean) => void
}

// Export save function for parent to call
let approvalSettingsSaveFn: (() => Promise<boolean>) | null = null

export function getApprovalSettingsSaveFn() {
  return approvalSettingsSaveFn
}

export function ApprovalSettings({ onSave, onReset, onSaveRequest, onChange }: ApprovalSettingsProps) {
  const { data: settingsData, isLoading } = useApprovalSettings()
  const updateSettings = useUpdateApprovalSettings()
  
  // Store original values for comparison
  const [originalValues, setOriginalValues] = useState<{
    enabled: boolean
    selectedSteps: string[]
    autoApproveThreshold: number | undefined
    timeoutMinutes: number | undefined
  } | null>(null)
  
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

  // Update local state when data loads and store original values
  useEffect(() => {
    if (settingsData?.data) {
      const original = {
        enabled: settingsData.data.require_approval,
        selectedSteps: settingsData.data.approval_agents,
        autoApproveThreshold: settingsData.data.auto_approve_threshold 
          ? settingsData.data.auto_approve_threshold * 100 
          : undefined,
        timeoutMinutes: settingsData.data.timeout_seconds 
          ? settingsData.data.timeout_seconds / 60 
          : undefined
      }
      setOriginalValues(original)
      setEnabled(original.enabled)
      setSelectedSteps(original.selectedSteps)
      setAutoApproveThreshold(original.autoApproveThreshold)
      setTimeoutMinutes(original.timeoutMinutes)
    }
  }, [settingsData])

  // Calculate hasChanges by comparing current values with original
  const hasChanges = originalValues ? (
    enabled !== originalValues.enabled ||
    JSON.stringify([...selectedSteps].sort()) !== JSON.stringify([...originalValues.selectedSteps].sort()) ||
    autoApproveThreshold !== originalValues.autoApproveThreshold ||
    timeoutMinutes !== originalValues.timeoutMinutes
  ) : false

  // Notify parent when changes occur
  useEffect(() => {
    onChange?.(hasChanges)
  }, [hasChanges, onChange])

  const toggleStep = (stepId: string) => {
    setSelectedSteps(prev => {
      const newSteps = prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
      return newSteps
    })
  }

  // Save function that can be called by parent
  const saveApprovalSettings = async (): Promise<boolean> => {
    try {
      const newSettings: ApprovalSettings = {
        require_approval: enabled,
        approval_agents: selectedSteps,
        auto_approve_threshold: autoApproveThreshold ? autoApproveThreshold / 100 : undefined,
        timeout_seconds: timeoutMinutes ? timeoutMinutes * 60 : undefined
      }

      await updateSettings.mutateAsync(newSettings)
      
      // Update original values to reflect saved state
      setOriginalValues({
        enabled,
        selectedSteps,
        autoApproveThreshold,
        timeoutMinutes
      })
      
      showSuccessToast(
        'Approval settings saved',
        `Approvals ${enabled ? 'enabled' : 'disabled'} for ${selectedSteps.length} step(s)`
      )
      onSave?.()
      return true
    } catch (error) {
      showErrorToast(
        'Failed to save approval settings',
        error instanceof Error ? error.message : 'Unknown error'
      )
      return false
    }
  }

  // Expose save function to parent
  useEffect(() => {
    approvalSettingsSaveFn = saveApprovalSettings
    return () => {
      approvalSettingsSaveFn = null
    }
  }, [enabled, selectedSteps, autoApproveThreshold, timeoutMinutes])

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
      onReset?.()
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

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked)
  }

  const handleThresholdChange = (value: number) => {
    setAutoApproveThreshold(value)
  }

  const handleTimeoutChange = (value: number) => {
    setTimeoutMinutes(value)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Approval Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure which pipeline steps require human approval before proceeding. When enabled, the
        pipeline will pause at selected steps for review.
      </Typography>

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
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {enabled ? 'Approvals Enabled' : 'Approvals Disabled'}
            </Typography>
          </Box>
          <Switch
            checked={enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            color="primary"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 0 }}>
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
                    onChange={(_, value) => handleThresholdChange(value as number)}
                    min={0}
                    max={100}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={autoApproveThreshold ?? 0}
                    onChange={(e) => handleThresholdChange(Number(e.target.value))}
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
                    onChange={(_, value) => handleTimeoutChange(value as number)}
                    min={1}
                    max={60}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={timeoutMinutes ?? 10}
                    onChange={(e) => handleTimeoutChange(Number(e.target.value))}
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

      {/* Note about saving */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 2, border: 1, borderColor: 'info.200' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Note:</strong> Approval settings are saved directly to the backend when you click "Save Settings" 
          in the main settings page. Changes take effect immediately after saving.
        </Typography>
      </Box>
    </Box>
  )
}

