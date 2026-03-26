'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useAuth } from '@/hooks/useAuth'
import {
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { OptionalStepsSettings } from '@/components/settings/optional-steps-settings'
import { RetryStrategySettings } from '@/components/settings/retry-strategy-settings'
import type { RetryStrategyConfig } from '@/types/api'
import { SEOKeywordsEngineSettings } from '@/components/settings/seo-keywords-engine-settings'
import { ApprovalSettings } from '@/components/settings/approval-settings'
import { ConfigVersioning } from '@/components/settings/config-versioning'
import { ProviderSettings } from '@/components/settings/provider-settings'
import { ProfoundSettings } from '@/components/settings/profound-settings'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import { loadPipelineSettings, savePipelineSettings } from '@/lib/pipeline-settings'
import { savePipelineConfigVersion } from '@/lib/pipeline-config-versioning'
import { api } from '@/lib/api'
import type { PipelineConfig } from '@/types/api'

interface TabPanelProps {
  children?: React.ReactNode
  tabId: string
  value: string
}

function TabPanel({ children, value, tabId }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== tabId}
      id={`settings-tabpanel-${tabId}`}
      aria-labelledby={`settings-tab-${tabId}`}
    >
      {value === tabId && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function SettingsPage() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('admin')
  const [activeTab, setActiveTab] = useState<string>('providers')
  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfig>({
    default_model: 'gpt-5.1',
    default_temperature: 0.7,
    default_max_retries: 2,
    step_configs: {},
    seo_keywords_engine_config: {
      default_engine: 'llm',
    },
  })
  const [optionalSteps, setOptionalSteps] = useState<Set<string>>(
    new Set(['suggested_links', 'design_kit'])
  )
  const [retryStrategy, setRetryStrategy] = useState<RetryStrategyConfig>({
    max_retries: 3,
    circuit_breaker: {
      failure_threshold: 5,
      recovery_timeout: 60,
      half_open_max_calls: 3,
    },
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [hasApprovalChanges, setHasApprovalChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load saved settings from backend API first, fallback to localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        // Try to load from backend API
        try {
          const response = await api.getPipelineSettings()
          if (response.data) {
            setPipelineConfig(response.data.pipeline_config || {
              default_model: 'gpt-5.1',
              default_temperature: 0.7,
              default_max_retries: 2,
              step_configs: {},
              seo_keywords_engine_config: {
                default_engine: 'llm',
              },
            })
            setOptionalSteps(new Set(response.data.optional_steps || ['suggested_links', 'design_kit']))
            if (response.data.retry_strategy) {
              setRetryStrategy(response.data.retry_strategy)
            }
            // Also update localStorage as cache
            savePipelineSettings({
              pipeline_config: response.data.pipeline_config,
              optional_steps: response.data.optional_steps,
              retry_strategy: response.data.retry_strategy,
            })
            if (response.data.retry_strategy && typeof window !== 'undefined') {
              localStorage.setItem('retry_strategy_config', JSON.stringify(response.data.retry_strategy))
            }
            return
          }
        } catch (apiError) {
          // If backend load fails, fall back to localStorage
          console.warn('Failed to load settings from backend, using localStorage:', apiError)
        }
        
        // Fallback to localStorage
        const settings = loadPipelineSettings()
        setPipelineConfig(settings.pipeline_config)
        setOptionalSteps(new Set(settings.optional_steps))
        
        // Load retry strategy settings
        if (typeof window !== 'undefined') {
          const savedRetry = localStorage.getItem('retry_strategy_config')
          if (savedRetry) {
            try {
              setRetryStrategy(JSON.parse(savedRetry))
            } catch (e) {
              console.error('Failed to load retry strategy config:', e)
            }
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSettings()
  }, [])

  const handleOptionalStepsChange = (newSteps: Set<string>) => {
    setOptionalSteps(newSteps)
    setHasChanges(true)
  }

  const handleRetryStrategyChange = (newConfig: RetryStrategyConfig) => {
    setRetryStrategy(newConfig)
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      // Save version before saving new config
      savePipelineConfigVersion(pipelineConfig, 'Manual save from settings page')
    } catch (e) {
      console.warn('Failed to save config version:', e)
    }
    
    try {
      setIsSaving(true)
      
      // Save pipeline settings to localStorage (as cache/fallback)
      savePipelineSettings({
        pipeline_config: pipelineConfig,
        optional_steps: Array.from(optionalSteps),
      })
      
      // Save retry strategy settings
      localStorage.setItem('retry_strategy_config', JSON.stringify(retryStrategy))
      
      // Save approval settings if they have changes (they save via their own API)
      // Import the save function from approval settings component
      const { getApprovalSettingsSaveFn } = await import('@/components/settings/approval-settings')
      const approvalSaveFn = getApprovalSettingsSaveFn()
      if (approvalSaveFn && hasApprovalChanges) {
        await approvalSaveFn()
      }
      
      // Save to backend API
      try {
        await api.savePipelineSettings({ 
          pipeline_config: pipelineConfig, 
          optional_steps: Array.from(optionalSteps),
          retry_strategy: retryStrategy
        })
      } catch (apiError) {
        // If backend save fails, log but don't fail the entire operation
        // Settings are already saved to localStorage as fallback
        console.warn('Failed to save settings to backend, using localStorage only:', apiError)
        // Still show success since localStorage save succeeded
      }
      
      setHasChanges(false)
      setHasApprovalChanges(false)
      showSuccessToast('Settings saved', 'All settings have been saved successfully')
    } catch (error) {
      showErrorToast(
        'Failed to save settings',
        error instanceof Error ? error.message : 'Unknown error'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    const defaultConfig: PipelineConfig = {
      default_model: 'gpt-5.1',
      default_temperature: 0.7,
      default_max_retries: 2,
      step_configs: {},
      seo_keywords_engine_config: {
        default_engine: 'llm',
      },
    }
    const defaultOptionalSteps = new Set(['suggested_links', 'design_kit'])
    const defaultRetryStrategy: RetryStrategyConfig = {
      max_retries: 3,
      circuit_breaker: {
        failure_threshold: 5,
        recovery_timeout: 60,
        half_open_max_calls: 3,
      },
    }

    setPipelineConfig(defaultConfig)
    setOptionalSteps(defaultOptionalSteps)
    setRetryStrategy(defaultRetryStrategy)
    setHasChanges(true)
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading settings...</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Pipeline Settings
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Configure pipeline models, optional steps, retry strategy, and approval settings. Changes are saved to the backend
          and will be applied to new pipeline runs. Approval settings are saved directly to the backend.
        </Typography>
      </Box>

      {/* Save/Reset Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              {(hasChanges || hasApprovalChanges) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  You have unsaved changes
                </Alert>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ResetIcon />}
                onClick={handleReset}
                disabled={isSaving}
              >
                Reset to Defaults
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={(!hasChanges && !hasApprovalChanges) || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab value="providers" label="Providers" id="settings-tab-providers" aria-controls="settings-tabpanel-providers" />
            <Tab value="profound" label="Profound AI" id="settings-tab-profound" aria-controls="settings-tabpanel-profound" />
            <Tab value="optional-steps" label="Optional Steps" id="settings-tab-optional-steps" aria-controls="settings-tabpanel-optional-steps" />
            <Tab value="retry" label="Retry Strategy" id="settings-tab-retry" aria-controls="settings-tabpanel-retry" />
            <Tab value="seo" label="SEO Keywords" id="settings-tab-seo" aria-controls="settings-tabpanel-seo" />
            <Tab value="approvals" label="Approvals" id="settings-tab-approvals" aria-controls="settings-tabpanel-approvals" />
            <Tab value="versions" label="Version History" id="settings-tab-versions" aria-controls="settings-tabpanel-versions" />
            {/* Analytics — admin only, fixed slot, CSS-hidden + keyboard-skipped for non-admins */}
            <Tab
              value="analytics"
              label="Analytics"
              id="settings-tab-analytics"
              aria-controls="settings-tabpanel-analytics"
              tabIndex={isAdmin ? 0 : -1}
              sx={{ display: isAdmin ? 'flex' : 'none' }}
            />
            <Tab value="competitor-research" label="Competitor Research" id="settings-tab-competitor-research" aria-controls="settings-tabpanel-competitor-research" />
            <Tab value="internal-docs" label="Internal Docs" id="settings-tab-internal-docs" aria-controls="settings-tabpanel-internal-docs" />
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={activeTab} tabId="providers">
            <ProviderSettings />
          </TabPanel>

          <TabPanel value={activeTab} tabId="profound">
            <ProfoundSettings />
          </TabPanel>

          <TabPanel value={activeTab} tabId="optional-steps">
            <OptionalStepsSettings
              optionalSteps={optionalSteps}
              onChange={handleOptionalStepsChange}
            />
          </TabPanel>

          <TabPanel value={activeTab} tabId="retry">
            <RetryStrategySettings
              config={retryStrategy}
              onChange={handleRetryStrategyChange}
            />
          </TabPanel>

          <TabPanel value={activeTab} tabId="seo">
            <SEOKeywordsEngineSettings
              config={pipelineConfig.seo_keywords_engine_config}
              onChange={(config) => {
                setPipelineConfig({
                  ...pipelineConfig,
                  seo_keywords_engine_config: config,
                })
                setHasChanges(true)
              }}
            />
          </TabPanel>

          <TabPanel value={activeTab} tabId="approvals">
            <ApprovalSettings
              onChange={(hasChanges) => {
                setHasApprovalChanges(hasChanges)
              }}
              onSave={() => {
                setHasApprovalChanges(false)
              }}
              onReset={() => {
                setHasApprovalChanges(false)
              }}
            />
          </TabPanel>

          <TabPanel value={activeTab} tabId="versions">
            <ConfigVersioning
              config={pipelineConfig}
              onRollback={(config) => {
                setPipelineConfig(config)
                setHasChanges(true)
                showSuccessToast('Configuration rolled back successfully')
              }}
            />
          </TabPanel>

          {/* Analytics — admin only */}
          <TabPanel value={activeTab} tabId="analytics">
            {isAdmin ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Analytics</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pipeline analytics and performance metrics. Charts and usage data will appear here.
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Analytics is only available to administrators.
              </Typography>
            )}
          </TabPanel>

          <TabPanel value={activeTab} tabId="competitor-research">
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Competitor Research</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tools and resources for tracking competitor content strategies.
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} tabId="internal-docs">
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Internal Docs</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Internal documentation, playbooks, and reference materials for your team.
              </Typography>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Container>
  )
}

