'use client'

import { useState, useEffect, useMemo, useId } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import ArticleIcon from '@mui/icons-material/Article'
import EditIcon from '@mui/icons-material/Edit'
import MicIcon from '@mui/icons-material/Mic'
import CampaignIcon from '@mui/icons-material/Campaign'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { useSourceContent, useContentSources } from '@/hooks/useApi'
import { getSourceDisplayName } from '@/utils/contentFormatters'
import { Dropzone, FilePreview } from '@/components/upload/dropzone'
import { showSuccessToast } from '@/lib/toast-utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { ContentItem } from '@/types/api'

interface UnifiedContentInputProps {
  onContentSelect: (content: ContentItem | null) => void
  onManualInputChange: (data: { title: string; content: string; contentType: 'blog_post' | 'transcript' | 'release_notes' } | null) => void
  selectedContent?: ContentItem | null
  manualTitle?: string
  manualContent?: string
  contentType?: 'blog_post' | 'transcript' | 'release_notes'
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
  tabId: string
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, tabId, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`${tabId}-tabpanel-${index}`}
      aria-labelledby={`${tabId}-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export function UnifiedContentInput({
  onContentSelect,
  onManualInputChange,
  selectedContent,
  manualTitle: externalManualTitle,
  manualContent: externalManualContent,
  contentType: externalContentType,
}: UnifiedContentInputProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [manualTitle, setManualTitle] = useState(externalManualTitle || '')
  const [manualContent, setManualContent] = useState(externalManualContent || '')
  const [contentType, setContentType] = useState<'blog_post' | 'transcript' | 'release_notes'>(externalContentType || 'blog_post')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // Fetch available content sources
  const { data: sourcesData } = useContentSources()
  const sources = useMemo(() => sourcesData?.data?.sources || [], [sourcesData?.data?.sources])
  
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [initialized, setInitialized] = useState(false)
  const selectId = useId()
  const tabId = useId()
  
  // Set the default source when sources are loaded
  useEffect(() => {
    if (sources.length > 0 && !initialized) {
      const enabledHealthySource = sources.find(
        (source) => source.metadata?.enabled !== false && source.healthy
      )
      if (enabledHealthySource) {
        setSelectedSource(enabledHealthySource.name)
      } else {
        setSelectedSource('all')
      }
      setInitialized(true)
    }
  }, [sources, initialized])
  
  // Fetch content from the selected source
  const { data: contentData, isLoading, error } = useSourceContent(selectedSource, 20)

  // Sync external manual input changes
  useEffect(() => {
    if (externalManualTitle !== undefined) {
      setManualTitle(externalManualTitle)
    }
  }, [externalManualTitle])

  useEffect(() => {
    if (externalManualContent !== undefined) {
      setManualContent(externalManualContent)
    }
  }, [externalManualContent])

  useEffect(() => {
    if (externalContentType !== undefined) {
      setContentType(externalContentType)
    }
  }, [externalContentType])

  // Notify parent of manual input changes
  useEffect(() => {
    if (activeTab === 1) {
      if (manualTitle.trim() && manualContent.trim()) {
        onManualInputChange({
          title: manualTitle,
          content: manualContent,
          contentType,
        })
      } else {
        onManualInputChange(null)
      }
    } else {
      onManualInputChange(null)
    }
  }, [activeTab, manualTitle, manualContent, contentType, onManualInputChange])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    if (newValue === 0) {
      // Switching to source selection - clear manual input callback
      onManualInputChange(null)
    } else {
      // Switching to manual input - clear selected content
      onContentSelect(null)
    }
  }

  const handlePasteContent = () => {
    setActiveTab(1)
    onContentSelect(null)
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'transcript':
        return <MicIcon fontSize="small" />
      case 'blog_post':
        return <ArticleIcon fontSize="small" />
      case 'release_notes':
        return <CampaignIcon fontSize="small" />
      default:
        return <ArticleIcon fontSize="small" />
    }
  }

  const getContentTypeColor = (type: string): 'primary' | 'success' | 'secondary' | 'default' => {
    switch (type) {
      case 'transcript':
        return 'primary'
      case 'blog_post':
        return 'success'
      case 'release_notes':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  const contentItems = contentData?.data?.content_items || []

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EditIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Content Input
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={handlePasteContent}
            startIcon={<EditIcon />}
          >
            Paste Content
          </Button>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="content input tabs">
            <Tab label="Select from Source" id={`${tabId}-tab-0`} aria-controls={`${tabId}-tabpanel-0`} />
            <Tab label="Manual Input" id={`${tabId}-tab-1`} aria-controls={`${tabId}-tabpanel-1`} />
          </Tabs>
        </Box>

        {/* Tab 0: Select from Source */}
        <TabPanel value={activeTab} index={0} tabId={tabId}>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading content...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                Failed to load content
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Please try again later
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Source selector */}
              {sources.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`${selectId}-label`}>Content Source</InputLabel>
                    <Select
                      labelId={`${selectId}-label`}
                      id={selectId}
                      value={selectedSource}
                      label="Content Source"
                      onChange={(e) => setSelectedSource(e.target.value)}
                    >
                      <MenuItem value="all">All Sources</MenuItem>
                      {sources.map((source) => (
                        <MenuItem key={source.name} value={source.name}>
                          {getSourceDisplayName(source)} {source.healthy ? '✓' : '✗'} {source.metadata?.enabled === false ? '(disabled)' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Selected Content Display */}
              {selectedContent && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 3,
                    border: 2,
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <ArticleIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Selected Content
                    </Typography>
                    <Chip
                      label={String(selectedContent.metadata?.type || 'blog_post').replace('_', ' ')}
                      color={getContentTypeColor(selectedContent.metadata?.type || 'blog_post')}
                      size="small"
                      sx={{ textTransform: 'capitalize', fontWeight: 600, ml: 'auto' }}
                    />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    {selectedContent.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    mb: 1,
                  }}>
                    {selectedContent.content.substring(0, 300)}...
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {selectedContent.content.length} characters
                  </Typography>
                </Paper>
              )}

              {/* Content Items List */}
              {contentItems.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    No content available
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Upload some content to get started
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 480, overflowY: 'auto' }}>
                  {contentItems.map((item: ContentItem, index: number) => {
                    const icon = getContentTypeIcon(item.metadata?.type || 'blog_post')
                    const isSelected = selectedContent?.id === item.id
                    
                    return (
                      <Paper
                        key={`${item.id}-${index}`}
                        elevation={0}
                        onClick={() => onContentSelect(item)}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: 2,
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          bgcolor: isSelected ? 'primary.50' : 'background.paper',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: isSelected ? 'primary.main' : 'primary.light',
                            bgcolor: isSelected ? 'primary.50' : 'action.hover',
                            boxShadow: 1,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ flexShrink: 0, mt: 0.5 }}>
                            {icon}
                          </Box>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography 
                                variant="subtitle2" 
                                sx={{ fontWeight: 600 }} 
                                noWrap
                              >
                                {item.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={(item.metadata?.type || 'blog post').replace('_', ' ')}
                                  color={getContentTypeColor(item.metadata?.type || 'blog_post')}
                                  size="small"
                                  sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.7rem' }}
                                />
                                {isSelected && (
                                  <CheckCircleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                )}
                              </Box>
                            </Box>
                            
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: 1,
                              }}
                            >
                              {item.snippet || item.content?.substring(0, 150) + '...'}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {item.metadata?.author || 'Unknown'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(item.created_at)}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {item.content?.length || 0} chars
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    )
                  })}
                </Box>
              )}
            </Box>
          )}
        </TabPanel>

        {/* Tab 1: Manual Input */}
        <TabPanel value={activeTab} index={1} tabId={tabId}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Dropzone */}
            {!uploadedFile && !manualContent && (
              <Dropzone 
                onUpload={(file) => {
                  setUploadedFile(file)
                  const reader = new FileReader()
                  reader.onload = (e) => {
                    const content = e.target?.result as string
                    setManualContent(content)
                    setManualTitle(file.name.replace(/\.[^/.]+$/, ''))
                    showSuccessToast('File uploaded', `${file.name} loaded successfully`)
                  }
                  reader.readAsText(file)
                }}
              />
            )}
            
            {/* File Preview */}
            <AnimatePresence>
              {uploadedFile && (
                <FilePreview 
                  file={uploadedFile}
                  onRemove={() => {
                    setUploadedFile(null)
                    setManualContent('')
                    setManualTitle('')
                  }}
                />
              )}
            </AnimatePresence>
            
            <TextField
              label="Title"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Enter content title..."
              fullWidth
              variant="outlined"
              size="medium"
            />
            
            <FormControl fullWidth>
              <InputLabel>Input Content Type</InputLabel>
              <Select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as 'blog_post' | 'transcript' | 'release_notes')}
                label="Input Content Type"
              >
                <MenuItem value="blog_post">Blog Post</MenuItem>
                <MenuItem value="transcript">Transcript</MenuItem>
                <MenuItem value="release_notes">Release Notes</MenuItem>
              </Select>
            </FormControl>
            
            {(uploadedFile || manualContent) && (
              <Box>
                <TextField
                  label="Content"
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste your content here or upload a file..."
                  multiline
                  rows={10}
                  fullWidth
                  variant="outlined"
                  sx={{ fontFamily: 'monospace' }}
                />
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {manualContent.length} characters
                </Typography>
              </Box>
            )}
          </motion.div>
        </TabPanel>
      </CardContent>
    </Card>
  )
}
