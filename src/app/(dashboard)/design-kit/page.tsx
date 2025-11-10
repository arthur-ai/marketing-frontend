'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Chip,
  Stack,
  Divider,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material'
import {
  Palette,
  Add,
  Edit,
  CheckCircle,
  Cancel,
  Refresh,
  AutoAwesome,
  Delete,
} from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'
import { useDesignKitConfig, useDesignKitVersions, useCreateOrUpdateDesignKitConfig, useGenerateDesignKitConfig, useActivateDesignKitVersion, useJobStatus } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import { api } from '@/lib/api'
import type { DesignKitConfig } from '@/types/api'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function DesignKitPage() {
  const { data: configData, isLoading, error, refetch } = useDesignKitConfig()
  const { data: versionsData } = useDesignKitVersions()
  const createOrUpdateMutation = useCreateOrUpdateDesignKitConfig()
  const generateMutation = useGenerateDesignKitConfig()
  const activateMutation = useActivateDesignKitVersion()
  const queryClient = useQueryClient()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [editConfig, setEditConfig] = useState<Partial<DesignKitConfig> | null>(null)
  const [refreshJobId, setRefreshJobId] = useState<string | null>(null)
  
  // Poll for refresh job completion
  const { data: refreshJobStatus } = useJobStatus(refreshJobId || '', !!refreshJobId)

  const config = configData?.data as DesignKitConfig | undefined
  const versions = versionsData?.data || []

  // Handle refresh job completion
  useEffect(() => {
    if (!refreshJobStatus?.data) return

    const status = refreshJobStatus.data.status

    if (status === 'completed') {
      setRefreshJobId(null) // Stop polling
      refetch().catch(() => {}) // Refetch the updated config
      showSuccessToast(
        'Configuration refreshed',
        'Design kit configuration has been regenerated using AI. Review and edit as needed.'
      )
    } else if (status === 'failed') {
      setRefreshJobId(null) // Stop polling
      showErrorToast(
        'Refresh failed',
        refreshJobStatus.data.error || 'Failed to refresh configuration'
      )
    }
  }, [refreshJobStatus, refetch])

  const handleEdit = () => {
    if (config) {
      setEditConfig({ ...config })
      setIsEditing(true)
    }
  }

  const handleCreate = () => {
    setEditConfig({
      voice_adjectives: [],
      point_of_view: 'we',
      sentence_length_tempo: 'medium',
      lexical_preferences: [],
      section_order: [],
      heading_depth: 'H2',
      list_usage_preference: 'moderate',
      paragraph_length_range: { min: 50, max: 200 },
      include_tldr: false,
      include_summary: false,
      title_format: '',
      meta_description_style: 'descriptive',
      slug_casing: 'kebab-case',
      tag_conventions: [],
      internal_link_anchor_style: 'natural-language',
      external_citation_style: '',
      cta_language: [],
      cta_positions: [],
      cta_verbs: [],
      typical_link_targets: [],
      must_use_names_terms: [],
      prohibited_phrases: [],
      date_format: 'YYYY-MM-DD',
      numbers_formatting_rules: { percentage: '60%', currency: '$1.2M' },
      commonly_referenced_pages: [],
      commonly_referenced_categories: [],
      anchor_phrasing_patterns: [],
      author_name_style: '',
      bio_length_range: { min: 50, max: 150 },
      sign_off_patterns: [],
      word_count_range: { min: 800, max: 2000 },
      heading_density: 'medium',
      keyword_density_band: 'medium',
      opening_lines: [],
      transition_sentences: [],
      proof_statements: [],
      conclusion_frames: [],
      common_faqs: [],
      version: '1.0.0',
      is_active: true,
    })
    setIsCreating(true)
  }

  const handleGenerate = async () => {
    try {
      // Generate config by analyzing existing content patterns
      // This will:
      // 1. Analyze existing content to extract voice, tone, CTA patterns, structure patterns, etc.
      // 2. Enrich with internal docs configuration (interlinking rules)
      // 3. Create and save a new config based on these patterns
      await generateMutation.mutateAsync(true)
      showSuccessToast(
        'Configuration generated', 
        'Design kit configuration has been generated from content analysis. Review and edit as needed.'
      )
      // Refetch to show the newly generated config
      refetch()
    } catch (error) {
      showErrorToast('Generation failed', error instanceof Error ? error.message : 'Failed to generate configuration')
    }
  }

  const handleRefresh = async () => {
    // Refresh button: Regenerate config using AI and reload
    // This uses AI to generate a new comprehensive config
    try {
      // Call the API with refresh=true to regenerate using AI
      const response = await api.getDesignKitConfig(true)
      
      // Check if response includes job_id (refresh mode)
      if (response.data?.job_id) {
        // Background job was submitted - track it
        setRefreshJobId(response.data.job_id)
        showSuccessToast(
          'Refresh started',
          'Design kit configuration is being regenerated using AI. This may take a moment...'
        )
      } else {
        // Direct response (shouldn't happen with refresh=true, but handle gracefully)
        queryClient.setQueryData(['design-kit', 'config'], response.data)
        showSuccessToast(
          'Configuration refreshed',
          'Design kit configuration has been regenerated using AI. Review and edit as needed.'
        )
      }
    } catch (error) {
      showErrorToast('Refresh failed', error instanceof Error ? error.message : 'Failed to refresh configuration')
    }
  }

  const handleSave = async () => {
    if (!editConfig) return

    try {
      await createOrUpdateMutation.mutateAsync({
        config: editConfig,
        setActive: true,
      })
      showSuccessToast('Configuration saved', 'Design kit configuration has been saved successfully')
      setIsEditing(false)
      setIsCreating(false)
      setEditConfig(null)
      refetch()
    } catch (error) {
      showErrorToast('Save failed', error instanceof Error ? error.message : 'Failed to save configuration')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsCreating(false)
    setEditConfig(null)
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading design kit configuration...</Typography>
      </Container>
    )
  }

  const displayConfig = isEditing || isCreating ? editConfig : config

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Palette sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Design Kit Configuration
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Configure brand guidelines, voice & tone, structure patterns, and reusable content snippets
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!config && !isCreating && (
            <>
              <Button
                variant="outlined"
                startIcon={<AutoAwesome />}
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                Generate
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreate}
              >
                Create Manually
              </Button>
            </>
          )}
          {config && !isEditing && !isCreating && (
            <>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={handleEdit}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : 'Failed to load configuration'}
        </Alert>
      )}

      {!config && !isCreating && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No design kit configuration found. Create one manually or generate from analysis. 
          Pipelines will run without it but will show a warning.
        </Alert>
      )}

      {displayConfig && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Configuration {displayConfig.version}
                </Typography>
                {displayConfig.is_active && (
                  <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
                )}
              </Box>
              {(isEditing || isCreating) && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={handleSave}
                    disabled={createOrUpdateMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label="Voice & Tone" />
                <Tab label="Structure" />
                <Tab label="SEO Patterns" />
                <Tab label="CTA Patterns" />
                <Tab label="Compliance & Brand" />
                <Tab label="Attribution" />
                <Tab label="Quant/Targets" />
                <Tab label="Reusable Snippets" />
              </Tabs>
            </Box>

            {/* Voice & Tone Tab */}
            <TabPanel value={tabValue} index={0}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Voice Adjectives
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Adjectives that describe your brand voice (e.g., confident, practical)
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="comma-separated: confident, practical, friendly"
                      value={(displayConfig.voice_adjectives || []).join(', ')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            voice_adjectives: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {(displayConfig.voice_adjectives || []).length > 0
                        ? (displayConfig.voice_adjectives || []).join(', ')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Point of View
                  </Typography>
                  {isEditing || isCreating ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Point of View</InputLabel>
                      <Select
                        value={displayConfig.point_of_view || 'we'}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({ ...editConfig, point_of_view: e.target.value })
                          }
                        }}
                        label="Point of View"
                      >
                        <MenuItem value="we">We</MenuItem>
                        <MenuItem value="you">You</MenuItem>
                        <MenuItem value="neutral">Neutral</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.point_of_view || 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Sentence Length/Tempo
                  </Typography>
                  {isEditing || isCreating ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Sentence Length/Tempo</InputLabel>
                      <Select
                        value={displayConfig.sentence_length_tempo || 'medium'}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({ ...editConfig, sentence_length_tempo: e.target.value })
                          }
                        }}
                        label="Sentence Length/Tempo"
                      >
                        <MenuItem value="short/fast">Short/Fast</MenuItem>
                        <MenuItem value="short/medium">Short/Medium</MenuItem>
                        <MenuItem value="short/slow">Short/Slow</MenuItem>
                        <MenuItem value="medium/fast">Medium/Fast</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="medium/slow">Medium/Slow</MenuItem>
                        <MenuItem value="long/fast">Long/Fast</MenuItem>
                        <MenuItem value="long/medium">Long/Medium</MenuItem>
                        <MenuItem value="long/slow">Long/Slow</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.sentence_length_tempo || 'Not set'}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Lexical Preferences
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Preferred terms (e.g., guardrails, observability, drift)
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="comma-separated: guardrails, observability, drift"
                      value={(displayConfig.lexical_preferences || []).join(', ')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            lexical_preferences: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {(displayConfig.lexical_preferences || []).length > 0
                        ? (displayConfig.lexical_preferences || []).join(', ')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </TabPanel>

            {/* Structure Tab */}
            <TabPanel value={tabValue} index={1}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Section Order
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Common section order (e.g., intro, problem, approach, proof, cta)
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="comma-separated: intro, problem, approach, proof, cta"
                      value={(displayConfig.section_order || []).join(', ')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            section_order: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {(displayConfig.section_order || []).length > 0
                        ? (displayConfig.section_order || []).join(', ')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Heading Depth
                  </Typography>
                  {isEditing || isCreating ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Heading Depth</InputLabel>
                      <Select
                        value={displayConfig.heading_depth || 'H2'}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({ ...editConfig, heading_depth: e.target.value })
                          }
                        }}
                        label="Heading Depth"
                      >
                        <MenuItem value="H2">H2</MenuItem>
                        <MenuItem value="H3">H3</MenuItem>
                        <MenuItem value="H4">H4</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.heading_depth || 'Not set'}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    List Usage Preference
                  </Typography>
                  {isEditing || isCreating ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>List Usage Preference</InputLabel>
                      <Select
                        value={displayConfig.list_usage_preference || 'moderate'}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({ ...editConfig, list_usage_preference: e.target.value })
                          }
                        }}
                        label="List Usage Preference"
                      >
                        <MenuItem value="frequent">Frequent</MenuItem>
                        <MenuItem value="moderate">Moderate</MenuItem>
                        <MenuItem value="minimal">Minimal</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.list_usage_preference || 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Paragraph Length Range
                  </Typography>
                  {isEditing || isCreating ? (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label="Min Paragraph Length"
                        type="number"
                        size="small"
                        value={displayConfig.paragraph_length_range?.min || 50}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({
                              ...editConfig,
                              paragraph_length_range: {
                                ...(editConfig.paragraph_length_range || { min: 50, max: 200 }),
                                min: parseInt(e.target.value) || 50,
                              },
                            })
                          }
                        }}
                      />
                      <TextField
                        label="Max Paragraph Length"
                        type="number"
                        size="small"
                        value={displayConfig.paragraph_length_range?.max || 200}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({
                              ...editConfig,
                              paragraph_length_range: {
                                ...(editConfig.paragraph_length_range || { min: 50, max: 200 }),
                                max: parseInt(e.target.value) || 200,
                              },
                            })
                          }
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.paragraph_length_range
                        ? `${displayConfig.paragraph_length_range.min} - ${displayConfig.paragraph_length_range.max}`
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Include TL;DR Section
                  </Typography>
                  {isEditing || isCreating ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={displayConfig.include_tldr || false}
                          onChange={(e) => {
                            if (editConfig) {
                              setEditConfig({ ...editConfig, include_tldr: e.target.checked })
                            }
                          }}
                        />
                      }
                      label="Include TL;DR Section"
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.include_tldr ? 'Yes' : 'No'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Include Summary Section
                  </Typography>
                  {isEditing || isCreating ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={displayConfig.include_summary || false}
                          onChange={(e) => {
                            if (editConfig) {
                              setEditConfig({ ...editConfig, include_summary: e.target.checked })
                            }
                          }}
                        />
                      }
                      label="Include Summary Section"
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.include_summary ? 'Yes' : 'No'}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </TabPanel>

            {/* SEO Patterns Tab */}
            <TabPanel value={tabValue} index={2}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Title Format
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      label="Title Format"
                      size="small"
                      placeholder="e.g., {keyword} | {brand}"
                      value={displayConfig.title_format || ''}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({ ...editConfig, title_format: e.target.value })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.title_format || 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Meta Description Style
                  </Typography>
                  {isEditing || isCreating ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Meta Description Style</InputLabel>
                      <Select
                        value={displayConfig.meta_description_style || 'descriptive'}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({ ...editConfig, meta_description_style: e.target.value })
                          }
                        }}
                        label="Meta Description Style"
                      >
                        <MenuItem value="descriptive">Descriptive</MenuItem>
                        <MenuItem value="action-oriented">Action-Oriented</MenuItem>
                        <MenuItem value="question-based">Question-Based</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.meta_description_style || 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Slug Casing
                  </Typography>
                  {isEditing || isCreating ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Slug Casing</InputLabel>
                      <Select
                        value={displayConfig.slug_casing || 'kebab-case'}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({ ...editConfig, slug_casing: e.target.value })
                          }
                        }}
                        label="Slug Casing"
                      >
                        <MenuItem value="kebab-case">kebab-case</MenuItem>
                        <MenuItem value="snake_case">snake_case</MenuItem>
                        <MenuItem value="camelCase">camelCase</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.slug_casing || 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Tag Conventions
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="comma-separated tags"
                      value={(displayConfig.tag_conventions || []).join(', ')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            tag_conventions: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {(displayConfig.tag_conventions || []).length > 0
                        ? (displayConfig.tag_conventions || []).join(', ')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Internal Link Anchor Style
                  </Typography>
                  {isEditing || isCreating ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Internal Link Anchor Style</InputLabel>
                      <Select
                        value={displayConfig.internal_link_anchor_style || 'natural-language'}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({ ...editConfig, internal_link_anchor_style: e.target.value })
                          }
                        }}
                        label="Internal Link Anchor Style"
                      >
                        <MenuItem value="exact-match">Exact Match</MenuItem>
                        <MenuItem value="natural-language">Natural Language</MenuItem>
                        <MenuItem value="keyword-focused">Keyword Focused</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.internal_link_anchor_style || 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    External Citation Style
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      label="External Citation Style"
                      size="small"
                      placeholder="e.g., (Source, 2024)"
                      value={displayConfig.external_citation_style || ''}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({ ...editConfig, external_citation_style: e.target.value })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.external_citation_style || 'Not set'}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </TabPanel>

            {/* CTA Patterns Tab */}
            <TabPanel value={tabValue} index={3}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    CTA Language
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="comma-separated: Get Started, Learn More, Try Now"
                      value={(displayConfig.cta_language || []).join(', ')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            cta_language: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {(displayConfig.cta_language || []).length > 0
                        ? (displayConfig.cta_language || []).join(', ')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    CTA Positions
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="comma-separated: intro, middle, conclusion"
                      value={(displayConfig.cta_positions || []).join(', ')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            cta_positions: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {(displayConfig.cta_positions || []).length > 0
                        ? (displayConfig.cta_positions || []).join(', ')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    CTA Verbs
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="comma-separated: start, explore, discover"
                      value={(displayConfig.cta_verbs || []).join(', ')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            cta_verbs: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {(displayConfig.cta_verbs || []).length > 0
                        ? (displayConfig.cta_verbs || []).join(', ')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Typical Link Targets
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="comma-separated URLs/paths"
                      value={(displayConfig.typical_link_targets || []).join(', ')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            typical_link_targets: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {(displayConfig.typical_link_targets || []).length > 0
                        ? (displayConfig.typical_link_targets || []).join(', ')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </TabPanel>

            {/* Compliance & Brand Tab */}
            <TabPanel value={tabValue} index={4}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Must Use Terms
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="comma-separated: product name, brand terms"
                      value={(displayConfig.must_use_names_terms || []).join(', ')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            must_use_names_terms: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {(displayConfig.must_use_names_terms || []).length > 0
                        ? (displayConfig.must_use_names_terms || []).join(', ')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Prohibited Phrases
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="comma-separated: phrases to avoid"
                      value={(displayConfig.prohibited_phrases || []).join(', ')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            prohibited_phrases: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {(displayConfig.prohibited_phrases || []).length > 0
                        ? (displayConfig.prohibited_phrases || []).join(', ')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Disclaimer Boilerplate
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      label="Disclaimer Boilerplate"
                      multiline
                      rows={3}
                      size="small"
                      placeholder="Standard disclaimer text"
                      value={displayConfig.disclaimer_boilerplate || ''}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({ ...editConfig, disclaimer_boilerplate: e.target.value })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1, whiteSpace: 'pre-wrap' }}>
                      {displayConfig.disclaimer_boilerplate || 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Date Format
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      label="Date Format"
                      size="small"
                      placeholder="e.g., YYYY-MM-DD or Month DD, YYYY"
                      value={displayConfig.date_format || 'YYYY-MM-DD'}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({ ...editConfig, date_format: e.target.value })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.date_format || 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Number Formatting Rules
                  </Typography>
                  {isEditing || isCreating ? (
                    <Stack spacing={2}>
                      <TextField
                        label="Percentage Format"
                        size="small"
                        placeholder="e.g., 60%"
                        value={displayConfig.numbers_formatting_rules?.percentage || ''}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({
                              ...editConfig,
                              numbers_formatting_rules: {
                                ...(editConfig.numbers_formatting_rules || {}),
                                percentage: e.target.value,
                              },
                            })
                          }
                        }}
                      />
                      <TextField
                        label="Currency Format"
                        size="small"
                        placeholder="e.g., $1.2M"
                        value={displayConfig.numbers_formatting_rules?.currency || ''}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({
                              ...editConfig,
                              numbers_formatting_rules: {
                                ...(editConfig.numbers_formatting_rules || {}),
                                currency: e.target.value,
                              },
                            })
                          }
                        }}
                      />
                    </Stack>
                  ) : (
                    <Stack spacing={1} sx={{ py: 1 }}>
                      <Typography variant="body1">
                        <strong>Percentage:</strong> {displayConfig.numbers_formatting_rules?.percentage || 'Not set'}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Currency:</strong> {displayConfig.numbers_formatting_rules?.currency || 'Not set'}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </TabPanel>

            {/* Attribution Tab */}
            <TabPanel value={tabValue} index={5}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Author Name Style
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      label="Author Name Style"
                      size="small"
                      placeholder="e.g., First Last or Last, First"
                      value={displayConfig.author_name_style || ''}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({ ...editConfig, author_name_style: e.target.value })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.author_name_style || 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Bio Length Range
                  </Typography>
                  {isEditing || isCreating ? (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label="Min Bio Length"
                        type="number"
                        size="small"
                        value={displayConfig.bio_length_range?.min || 50}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({
                              ...editConfig,
                              bio_length_range: {
                                ...(editConfig.bio_length_range || { min: 50, max: 150 }),
                                min: parseInt(e.target.value) || 50,
                              },
                            })
                          }
                        }}
                      />
                      <TextField
                        label="Max Bio Length"
                        type="number"
                        size="small"
                        value={displayConfig.bio_length_range?.max || 150}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({
                              ...editConfig,
                              bio_length_range: {
                                ...(editConfig.bio_length_range || { min: 50, max: 150 }),
                                max: parseInt(e.target.value) || 150,
                              },
                            })
                          }
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.bio_length_range
                        ? `${displayConfig.bio_length_range.min} - ${displayConfig.bio_length_range.max}`
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Sign-off Patterns
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="comma-separated sign-off patterns"
                      value={(displayConfig.sign_off_patterns || []).join(', ')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            sign_off_patterns: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {(displayConfig.sign_off_patterns || []).length > 0
                        ? (displayConfig.sign_off_patterns || []).join(', ')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </TabPanel>

            {/* Quant/Targets Tab */}
            <TabPanel value={tabValue} index={6}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Word Count Range
                  </Typography>
                  {isEditing || isCreating ? (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label="Min Word Count"
                        type="number"
                        size="small"
                        value={displayConfig.word_count_range?.min || 800}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({
                              ...editConfig,
                              word_count_range: {
                                ...(editConfig.word_count_range || { min: 800, max: 2000 }),
                                min: parseInt(e.target.value) || 800,
                              },
                            })
                          }
                        }}
                      />
                      <TextField
                        label="Max Word Count"
                        type="number"
                        size="small"
                        value={displayConfig.word_count_range?.max || 2000}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({
                              ...editConfig,
                              word_count_range: {
                                ...(editConfig.word_count_range || { min: 800, max: 2000 }),
                                max: parseInt(e.target.value) || 2000,
                              },
                            })
                          }
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.word_count_range
                        ? `${displayConfig.word_count_range.min} - ${displayConfig.word_count_range.max}`
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Heading Density
                  </Typography>
                  {isEditing || isCreating ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Heading Density</InputLabel>
                      <Select
                        value={displayConfig.heading_density || 'medium'}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({ ...editConfig, heading_density: e.target.value })
                          }
                        }}
                        label="Heading Density"
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.heading_density || 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Keyword Density Band
                  </Typography>
                  {isEditing || isCreating ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Keyword Density Band</InputLabel>
                      <Select
                        value={displayConfig.keyword_density_band || 'medium'}
                        onChange={(e) => {
                          if (editConfig) {
                            setEditConfig({ ...editConfig, keyword_density_band: e.target.value })
                          }
                        }}
                        label="Keyword Density Band"
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1" sx={{ py: 1 }}>
                      {displayConfig.keyword_density_band || 'Not set'}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </TabPanel>

            {/* Reusable Snippets Tab */}
            <TabPanel value={tabValue} index={7}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Opening Lines
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      placeholder="One per line"
                      value={(displayConfig.opening_lines || []).join('\n')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            opening_lines: e.target.value.split('\n').filter(s => s.trim()),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1, whiteSpace: 'pre-wrap' }}>
                      {(displayConfig.opening_lines || []).length > 0
                        ? (displayConfig.opening_lines || []).join('\n')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Transition Sentences
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      placeholder="One per line"
                      value={(displayConfig.transition_sentences || []).join('\n')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            transition_sentences: e.target.value.split('\n').filter(s => s.trim()),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1, whiteSpace: 'pre-wrap' }}>
                      {(displayConfig.transition_sentences || []).length > 0
                        ? (displayConfig.transition_sentences || []).join('\n')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Proof Statements
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      placeholder="One per line"
                      value={(displayConfig.proof_statements || []).join('\n')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            proof_statements: e.target.value.split('\n').filter(s => s.trim()),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1, whiteSpace: 'pre-wrap' }}>
                      {(displayConfig.proof_statements || []).length > 0
                        ? (displayConfig.proof_statements || []).join('\n')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Conclusion Frames
                  </Typography>
                  {isEditing || isCreating ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      placeholder="One per line"
                      value={(displayConfig.conclusion_frames || []).join('\n')}
                      onChange={(e) => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            conclusion_frames: e.target.value.split('\n').filter(s => s.trim()),
                          })
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ py: 1, whiteSpace: 'pre-wrap' }}>
                      {(displayConfig.conclusion_frames || []).length > 0
                        ? (displayConfig.conclusion_frames || []).join('\n')
                        : 'Not set'}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Common FAQs
                  </Typography>
                  {(displayConfig.common_faqs || []).map((faq, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" fontWeight="bold">FAQ {index + 1}</Typography>
                        {(isEditing || isCreating) && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (editConfig) {
                                const faqs = [...(editConfig.common_faqs || [])]
                                faqs.splice(index, 1)
                                setEditConfig({ ...editConfig, common_faqs: faqs })
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                      {isEditing || isCreating ? (
                        <>
                          <TextField
                            fullWidth
                            label="Question"
                            size="small"
                            value={faq.question || ''}
                            onChange={(e) => {
                              if (editConfig) {
                                const faqs = [...(editConfig.common_faqs || [])]
                                faqs[index] = { ...faqs[index], question: e.target.value }
                                setEditConfig({ ...editConfig, common_faqs: faqs })
                              }
                            }}
                            sx={{ mb: 1 }}
                          />
                          <TextField
                            fullWidth
                            label="Answer"
                            multiline
                            rows={2}
                            size="small"
                            value={faq.answer || ''}
                            onChange={(e) => {
                              if (editConfig) {
                                const faqs = [...(editConfig.common_faqs || [])]
                                faqs[index] = { ...faqs[index], answer: e.target.value }
                                setEditConfig({ ...editConfig, common_faqs: faqs })
                              }
                            }}
                          />
                        </>
                      ) : (
                        <Box>
                          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                            Q: {faq.question || 'Not set'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            A: {faq.answer || 'Not set'}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  ))}
                  {(isEditing || isCreating) && (
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => {
                        if (editConfig) {
                          setEditConfig({
                            ...editConfig,
                            common_faqs: [...(editConfig.common_faqs || []), { question: '', answer: '' }],
                          })
                        }
                      }}
                    >
                      Add FAQ
                    </Button>
                  )}
                </Box>
              </Stack>
            </TabPanel>

            {/* Metadata */}
            {!isEditing && !isCreating && config && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(config.created_at).toLocaleString()} | 
                  Updated: {new Date(config.updated_at).toLocaleString()}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  )
}

