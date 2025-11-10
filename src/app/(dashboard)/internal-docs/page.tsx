'use client'

import { useState, useEffect, Fragment } from 'react'
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
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Grid,
  MenuItem,
} from '@mui/material'
import {
  Description,
  Add,
  Edit,
  CheckCircle,
  Cancel,
  Delete,
  Refresh,
  ExpandMore,
  ExpandLess,
  Search,
  FilterList,
  Upload,
  CloudUpload,
  Download,
} from '@mui/icons-material'
import { useInternalDocsConfig, useInternalDocsVersions, useCreateOrUpdateInternalDocsConfig, useActivateInternalDocsVersion } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import { api } from '@/lib/api'
import type { InternalDocsConfig, ScannedDocumentDB, DocumentFilters } from '@/types/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function InternalDocsPage() {
  const { data: configData, isLoading, error, refetch } = useInternalDocsConfig()
  const { data: versionsData } = useInternalDocsVersions()
  const createOrUpdateMutation = useCreateOrUpdateInternalDocsConfig()
  const activateMutation = useActivateInternalDocsVersion()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editConfig, setEditConfig] = useState<Partial<InternalDocsConfig> | null>(null)
  const [newPage, setNewPage] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newPattern, setNewPattern] = useState('')
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocUrl, setNewDocUrl] = useState('')
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  
  // Scanning state
  const [scanMode, setScanMode] = useState<'url' | 'list'>('url')
  const [baseUrl, setBaseUrl] = useState('')
  const [urlList, setUrlList] = useState('')
  const [maxDepth, setMaxDepth] = useState(3)
  const [followExternal, setFollowExternal] = useState(false)
  const [maxPages, setMaxPages] = useState(100)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ message: string; scanned_count: number } | null>(null)
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0)
  
  // Documents tab state
  const [documents, setDocuments] = useState<ScannedDocumentDB[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [selectedDocument, setSelectedDocument] = useState<ScannedDocumentDB | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<DocumentFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  
  // Upload tab state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadFormat, setUploadFormat] = useState<'json' | 'csv'>('json')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  // configData is already the config object (not wrapped in { data: ... })
  const config = configData as InternalDocsConfig | undefined
  // versionsData is already the array (not wrapped in { data: ... })
  const versions = (versionsData as string[]) || []
  const queryClient = useQueryClient()

  const handleEdit = () => {
    if (config) {
      setEditConfig({ ...config })
      setIsEditing(true)
    }
  }

  const handleCreate = () => {
    setEditConfig({
      scanned_documents: [],
      commonly_referenced_pages: [],
      commonly_referenced_categories: [],
      anchor_phrasing_patterns: [],
      interlinking_rules: {},
      version: '1.0.0',
      is_active: true,
    })
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!editConfig) return

    try {
      await createOrUpdateMutation.mutateAsync({
        config: editConfig,
        setActive: true,
      })
      showSuccessToast('Configuration saved', 'Internal docs configuration has been saved successfully')
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

  const handleAddPage = () => {
    if (newPage && editConfig) {
      setEditConfig({
        ...editConfig,
        commonly_referenced_pages: [...(editConfig.commonly_referenced_pages || []), newPage],
      })
      setNewPage('')
    }
  }

  const handleRemovePage = (index: number) => {
    if (editConfig) {
      const pages = [...(editConfig.commonly_referenced_pages || [])]
      pages.splice(index, 1)
      setEditConfig({ ...editConfig, commonly_referenced_pages: pages })
    }
  }

  const handleAddCategory = () => {
    if (newCategory && editConfig) {
      setEditConfig({
        ...editConfig,
        commonly_referenced_categories: [...(editConfig.commonly_referenced_categories || []), newCategory],
      })
      setNewCategory('')
    }
  }

  const handleRemoveCategory = (index: number) => {
    if (editConfig) {
      const categories = [...(editConfig.commonly_referenced_categories || [])]
      categories.splice(index, 1)
      setEditConfig({ ...editConfig, commonly_referenced_categories: categories })
    }
  }

  const handleAddPattern = () => {
    if (newPattern && editConfig) {
      setEditConfig({
        ...editConfig,
        anchor_phrasing_patterns: [...(editConfig.anchor_phrasing_patterns || []), newPattern],
      })
      setNewPattern('')
    }
  }

  const handleRemovePattern = (index: number) => {
    if (editConfig) {
      const patterns = [...(editConfig.anchor_phrasing_patterns || [])]
      patterns.splice(index, 1)
      setEditConfig({ ...editConfig, anchor_phrasing_patterns: patterns })
    }
  }

  const handleAddScannedDoc = () => {
    if (newDocTitle && newDocUrl && editConfig) {
      setEditConfig({
        ...editConfig,
        scanned_documents: [
          ...(editConfig.scanned_documents || []),
          {
            title: newDocTitle,
            url: newDocUrl,
            scanned_at: new Date().toISOString(),
          },
        ],
      })
      setNewDocTitle('')
      setNewDocUrl('')
    }
  }

  const handleRemoveScannedDoc = (index: number) => {
    if (editConfig) {
      const docs = [...(editConfig.scanned_documents || [])]
      docs.splice(index, 1)
      setEditConfig({ ...editConfig, scanned_documents: docs })
    }
  }

  const handleActivateVersion = async (version: string) => {
    try {
      await activateMutation.mutateAsync(version)
      showSuccessToast('Version activated', `Version ${version} has been activated`)
      refetch()
      setShowVersionDialog(false)
    } catch (error) {
      showErrorToast('Activation failed', error instanceof Error ? error.message : 'Failed to activate version')
    }
  }

  const handleScan = async () => {
    setIsScanning(true)
    setScanResult(null)
    
    try {
      let response
      if (scanMode === 'url') {
        if (!baseUrl.trim()) {
          showErrorToast('Validation error', 'Please enter a base URL')
          setIsScanning(false)
          return
        }
        response = await api.scanFromUrl(baseUrl, maxDepth, followExternal, maxPages, true)
      } else {
        const urls = urlList.split('\n').filter(url => url.trim())
        if (urls.length === 0) {
          showErrorToast('Validation error', 'Please enter at least one URL')
          setIsScanning(false)
          return
        }
        response = await api.scanFromList(urls, true)
      }
      
      // Scan now runs as a background job
      const jobId = response.data.job_id
      showSuccessToast('Scan started', `Scan job started (Job ID: ${jobId}). The scan is running in the background.`)
      setScanResult({
        message: `Scan job started. Job ID: ${jobId}`,
        scanned_count: 0,
        job_id: jobId
      })
      
      // Don't auto-refetch - let user manually refresh if needed
      // The config will be updated when the job completes
    } catch (error) {
      showErrorToast('Scan failed', error instanceof Error ? error.message : 'Failed to start scan')
    } finally {
      setIsScanning(false)
    }
  }

  const handleRemoveDocument = async (docUrl: string) => {
    try {
      await api.removeDocument(docUrl)
      showSuccessToast('Document removed', 'Document has been removed from configuration')
      refetch()
    } catch (error) {
      showErrorToast('Remove failed', error instanceof Error ? error.message : 'Failed to remove document')
    }
  }

  // Load documents from database
  const loadDocuments = async () => {
    setIsLoadingDocuments(true)
    try {
      const response = await api.listScannedDocuments(true)
      setDocuments(response.data || [])
    } catch (error) {
      showErrorToast('Load failed', error instanceof Error ? error.message : 'Failed to load documents')
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  // Load documents when Documents tab is active
  useEffect(() => {
    if (activeTab === 1) {
      loadDocuments()
    }
  }, [activeTab])

  // Handle document selection
  const handleSelectDocument = (url: string) => {
    const newSelected = new Set(selectedDocuments)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }
    setSelectedDocuments(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(documents.map(d => d.url)))
    }
  }

  // Apply filters
  const handleApplyFilters = async () => {
    setIsLoadingDocuments(true)
    try {
      // Build filter object for API
      const filterObj: DocumentFilters = { ...filters }
      if (searchQuery.trim()) {
        filterObj.keywords = searchQuery
      }
      
      // Use enhanced search with filters endpoint
      const response = await api.searchDocumentsWithFilters(filterObj, 100)
      setDocuments(response.data || [])
    } catch (error) {
      showErrorToast('Search failed', error instanceof Error ? error.message : 'Failed to search documents')
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  // Full-text search
  const handleFullTextSearch = async () => {
    if (!searchQuery.trim()) {
      await loadDocuments()
      return
    }
    setIsLoadingDocuments(true)
    try {
      const response = await api.fullTextSearch(searchQuery)
      setDocuments(response.data || [])
    } catch (error) {
      showErrorToast('Search failed', error instanceof Error ? error.message : 'Failed to search documents')
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  // Bulk operations
  const handleBulkRescan = async () => {
    if (selectedDocuments.size === 0) {
      showErrorToast('No selection', 'Please select documents to re-scan')
      return
    }
    try {
      await api.bulkRescanDocuments(Array.from(selectedDocuments))
      showSuccessToast('Bulk re-scan started', `Re-scanning ${selectedDocuments.size} documents in background`)
      setSelectedDocuments(new Set())
      setTimeout(() => loadDocuments(), 2000)
    } catch (error) {
      showErrorToast('Bulk re-scan failed', error instanceof Error ? error.message : 'Failed to start bulk re-scan')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) {
      showErrorToast('No selection', 'Please select documents to delete')
      return
    }
    if (!confirm(`Are you sure you want to permanently delete ${selectedDocuments.size} document(s)?`)) {
      return
    }
    try {
      await api.bulkDeleteDocuments(Array.from(selectedDocuments))
      showSuccessToast('Documents deleted', `Deleted ${selectedDocuments.size} document(s)`)
      setSelectedDocuments(new Set())
      await loadDocuments()
    } catch (error) {
      showErrorToast('Bulk delete failed', error instanceof Error ? error.message : 'Failed to delete documents')
    }
  }

  const handleBulkUpdateCategories = async (categories: string[]) => {
    if (selectedDocuments.size === 0) {
      showErrorToast('No selection', 'Please select documents to update')
      return
    }
    try {
      await api.bulkUpdateCategories(Array.from(selectedDocuments), categories)
      showSuccessToast('Categories updated', `Updated categories for ${selectedDocuments.size} document(s)`)
      setSelectedDocuments(new Set())
      await loadDocuments()
    } catch (error) {
      showErrorToast('Bulk update failed', error instanceof Error ? error.message : 'Failed to update categories')
    }
  }

  // Upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadFile(file)
      // Detect format from extension
      if (file.name.endsWith('.csv')) {
        setUploadFormat('csv')
      } else if (file.name.endsWith('.json')) {
        setUploadFormat('json')
      }
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      showErrorToast('No file', 'Please select a file to upload')
      return
    }
    setIsUploading(true)
    setUploadResult(null)
    try {
      const response = await api.bulkUploadDocuments(uploadFile, uploadFormat)
      setUploadResult(response.data)
      showSuccessToast('Upload completed', `Successfully imported ${response.data.success} document(s)`)
      setUploadFile(null)
      if (activeTab === 1) {
        await loadDocuments()
      }
    } catch (error) {
      showErrorToast('Upload failed', error instanceof Error ? error.message : 'Failed to upload documents')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const template = [
        {
          title: "Example Document",
          url: "https://example.com/doc",
          metadata: {
            content_text: "Full content text here...",
            content_summary: "Brief summary...",
            word_count: 500,
            categories: ["category1", "category2"],
            extracted_keywords: ["keyword1", "keyword2"],
            topics: ["topic1"],
            content_type: "blog"
          }
        }
      ]
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'internal-docs-template.json'
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const csv = `title,url,content_text,content_summary,word_count,categories,keywords,topics,content_type
"Example Document","https://example.com/doc","Full content text here...","Brief summary...",500,"category1,category2","keyword1,keyword2","topic1",blog`
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'internal-docs-template.csv'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading internal docs configuration...</Typography>
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
            <Description sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Internal Documentation Configuration
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Configure internal documentation linking rules and interlinking patterns
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!config && !isCreating && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Create Configuration
            </Button>
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
                onClick={() => setShowVersionDialog(true)}
              >
                Versions
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

      {!config && !isCreating && activeTab === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No internal docs configuration found. Create one to get started. This configuration is used by the Design Kit to generate interlinking information.
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Configuration" />
          <Tab label="Documents" />
          <Tab label="Upload" />
        </Tabs>
      </Box>

      {/* Configuration Tab */}
      {activeTab === 0 && displayConfig && (
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

            {/* URL Scanning Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Scan Internal Documentation
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Scan internal documentation from URLs to automatically populate the document list
              </Typography>
              
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={scanMode === 'url' ? 'contained' : 'outlined'}
                      onClick={() => setScanMode('url')}
                      size="small"
                    >
                      Scan from Base URL
                    </Button>
                    <Button
                      variant={scanMode === 'list' ? 'contained' : 'outlined'}
                      onClick={() => setScanMode('list')}
                      size="small"
                    >
                      Scan from URL List
                    </Button>
                  </Box>

                  {scanMode === 'url' ? (
                    <>
                      <TextField
                        label="Base URL"
                        placeholder="https://example.com/docs"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        fullWidth
                        size="small"
                      />
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="Max Depth"
                          type="number"
                          value={maxDepth}
                          onChange={(e) => setMaxDepth(parseInt(e.target.value) || 3)}
                          inputProps={{ min: 1, max: 10 }}
                          size="small"
                          sx={{ width: 120 }}
                        />
                        <TextField
                          label="Max Pages"
                          type="number"
                          value={maxPages}
                          onChange={(e) => setMaxPages(parseInt(e.target.value) || 100)}
                          inputProps={{ min: 1, max: 1000 }}
                          size="small"
                          sx={{ width: 120 }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={followExternal}
                            onChange={(e) => setFollowExternal(e.target.checked)}
                            style={{ marginRight: 8 }}
                          />
                          <Typography variant="body2">Follow External Links</Typography>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <TextField
                      label="URL List (one per line)"
                      placeholder="https://example.com/page1&#10;https://example.com/page2"
                      value={urlList}
                      onChange={(e) => setUrlList(e.target.value)}
                      fullWidth
                      multiline
                      rows={4}
                      size="small"
                    />
                  )}

                  <Button
                    variant="contained"
                    onClick={handleScan}
                    disabled={isScanning}
                    startIcon={isScanning ? <CircularProgress size={16} /> : <Refresh />}
                  >
                    {isScanning ? 'Scanning...' : 'Start Scan'}
                  </Button>

                  {scanResult && (
                    <Alert severity="success">
                      {scanResult.message} ({scanResult.scanned_count} documents)
                    </Alert>
                  )}
                </Stack>
              </Paper>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Scanned Documents */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Scanned Documents
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                List of internal documents that were scanned to generate this configuration
              </Typography>
              {(isEditing || isCreating) && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Document title"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      placeholder="Document URL/path"
                      value={newDocUrl}
                      onChange={(e) => setNewDocUrl(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddScannedDoc()}
                      sx={{ flex: 1 }}
                    />
                    <Button variant="outlined" onClick={handleAddScannedDoc}>
                      Add
                    </Button>
                  </Box>
                </Box>
              )}
              <List>
                {(displayConfig.scanned_documents || []).map((doc, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => {
                          if (isEditing || isCreating) {
                            handleRemoveScannedDoc(index)
                          } else {
                            handleRemoveDocument(doc.url)
                          }
                        }}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={doc.title}
                      secondary={
                        <>
                          <Typography component="span" variant="caption" display="block">{doc.url}</Typography>
                          {doc.scanned_at && (
                            <Typography component="span" variant="caption" color="text.secondary" display="block">
                              Scanned: {new Date(doc.scanned_at).toLocaleString()}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
                {(!displayConfig.scanned_documents || displayConfig.scanned_documents.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                    No documents scanned
                  </Typography>
                )}
              </List>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Commonly Referenced Pages */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Commonly Referenced Pages
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                List of page slugs/URLs that are commonly referenced in internal links
              </Typography>
              {(isEditing || isCreating) && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Enter page slug/URL"
                    value={newPage}
                    onChange={(e) => setNewPage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPage()}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button variant="outlined" onClick={handleAddPage}>
                    Add
                  </Button>
                </Box>
              )}
              <List>
                {(displayConfig.commonly_referenced_pages || []).map((page, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      (isEditing || isCreating) && (
                        <IconButton edge="end" onClick={() => handleRemovePage(index)}>
                          <Delete />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText primary={page} />
                  </ListItem>
                ))}
                {(!displayConfig.commonly_referenced_pages || displayConfig.commonly_referenced_pages.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                    No pages configured
                  </Typography>
                )}
              </List>
            </Box>

            {/* Commonly Referenced Categories */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Commonly Referenced Categories
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                List of content categories that are commonly referenced
              </Typography>
              {(isEditing || isCreating) && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Enter category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button variant="outlined" onClick={handleAddCategory}>
                    Add
                  </Button>
                </Box>
              )}
              <List>
                {(displayConfig.commonly_referenced_categories || []).map((category, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      (isEditing || isCreating) && (
                        <IconButton edge="end" onClick={() => handleRemoveCategory(index)}>
                          <Delete />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText primary={category} />
                  </ListItem>
                ))}
                {(!displayConfig.commonly_referenced_categories || displayConfig.commonly_referenced_categories.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                    No categories configured
                  </Typography>
                )}
              </List>
            </Box>

            {/* Anchor Phrasing Patterns */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Anchor Phrasing Patterns
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Patterns for how anchor text is typically phrased in internal links
              </Typography>
              {(isEditing || isCreating) && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Enter anchor phrasing pattern"
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPattern()}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button variant="outlined" onClick={handleAddPattern}>
                    Add
                  </Button>
                </Box>
              )}
              <List>
                {(displayConfig.anchor_phrasing_patterns || []).map((pattern, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      (isEditing || isCreating) && (
                        <IconButton edge="end" onClick={() => handleRemovePattern(index)}>
                          <Delete />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText primary={pattern} />
                  </ListItem>
                ))}
                {(!displayConfig.anchor_phrasing_patterns || displayConfig.anchor_phrasing_patterns.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                    No patterns configured
                  </Typography>
                )}
              </List>
            </Box>

            {/* Metadata */}
            {!isEditing && !isCreating && config && (
              <Box>
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

      {/* Documents Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Scanned Documents</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadDocuments}
                  disabled={isLoadingDocuments}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            {/* Search Bar */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search documents (full-text search)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFullTextSearch()}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <Button
                variant="contained"
                onClick={handleFullTextSearch}
                disabled={isLoadingDocuments}
              >
                Search
              </Button>
            </Box>

            {/* Filters Panel */}
            <Collapse in={showFilters}>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Category"
                      value={filters.category || ''}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Content Type"
                      value={filters.content_type || ''}
                      onChange={(e) => setFilters({ ...filters, content_type: e.target.value })}
                      select
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="blog">Blog</MenuItem>
                      <MenuItem value="docs">Docs</MenuItem>
                      <MenuItem value="guide">Guide</MenuItem>
                      <MenuItem value="api">API</MenuItem>
                      <MenuItem value="page">Page</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Min Word Count"
                      type="number"
                      value={filters.word_count_min || ''}
                      onChange={(e) => setFilters({ ...filters, word_count_min: parseInt(e.target.value) || undefined })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Max Word Count"
                      type="number"
                      value={filters.word_count_max || ''}
                      onChange={(e) => setFilters({ ...filters, word_count_max: parseInt(e.target.value) || undefined })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Date From"
                      type="date"
                      value={filters.date_from || ''}
                      onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Date To"
                      type="date"
                      value={filters.date_to || ''}
                      onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                      <Checkbox
                        checked={filters.has_internal_links || false}
                        onChange={(e) => setFilters({ ...filters, has_internal_links: e.target.checked || undefined })}
                      />
                      <Typography>Has Internal Links</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleApplyFilters}
                      disabled={isLoadingDocuments}
                    >
                      Apply Filters
                    </Button>
                    <Button
                      variant="outlined"
                      sx={{ ml: 1 }}
                      onClick={() => {
                        setFilters({})
                        setSearchQuery('')
                        loadDocuments()
                      }}
                    >
                      Clear
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>

            {/* Bulk Actions */}
            {selectedDocuments.size > 0 && (
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'warning.light' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography>{selectedDocuments.size} document(s) selected</Typography>
                  <Button size="small" onClick={handleBulkRescan}>Re-scan</Button>
                  <Button size="small" color="error" onClick={handleBulkDelete}>Delete</Button>
                  <Button size="small" onClick={() => {
                    const cats = prompt('Enter categories (comma-separated):')
                    if (cats) {
                      handleBulkUpdateCategories(cats.split(',').map(c => c.trim()))
                    }
                  }}>Update Categories</Button>
                  <Button size="small" onClick={() => setSelectedDocuments(new Set())}>Clear Selection</Button>
                </Box>
              </Paper>
            )}

            {/* Documents List */}
            {isLoadingDocuments ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : documents.length === 0 ? (
              <Alert severity="info">No documents found</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedDocuments.size === documents.length && documents.length > 0}
                          indeterminate={selectedDocuments.size > 0 && selectedDocuments.size < documents.length}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>URL</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Categories</TableCell>
                      <TableCell>Word Count</TableCell>
                      <TableCell>Links</TableCell>
                      <TableCell>Scanned</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.map((doc) => (
                      <Fragment key={doc.url}>
                        <TableRow
                          hover
                          selected={selectedDocuments.has(doc.url)}
                          onClick={() => setSelectedDocument(selectedDocument?.url === doc.url ? null : doc)}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedDocuments.has(doc.url)}
                              onChange={() => handleSelectDocument(doc.url)}
                            />
                          </TableCell>
                          <TableCell>{doc.title}</TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {doc.url}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={doc.metadata.content_type || 'unknown'} size="small" />
                          </TableCell>
                          <TableCell>
                            {doc.metadata.categories?.slice(0, 2).map(cat => (
                              <Chip key={cat} label={cat} size="small" sx={{ mr: 0.5 }} />
                            ))}
                            {doc.metadata.categories && doc.metadata.categories.length > 2 && (
                              <Typography variant="caption">+{doc.metadata.categories.length - 2}</Typography>
                            )}
                          </TableCell>
                          <TableCell>{doc.metadata.word_count || 0}</TableCell>
                          <TableCell>{doc.metadata.outbound_link_count || 0}</TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {new Date(doc.scanned_at).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => {
                              api.rescanDocument(doc.url).then(() => {
                                showSuccessToast('Re-scan started', 'Document will be re-scanned')
                                setTimeout(() => loadDocuments(), 2000)
                              })
                            }}>
                              <Refresh fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => {
                              if (confirm('Delete this document?')) {
                                api.bulkDeleteDocuments([doc.url]).then(() => {
                                  showSuccessToast('Deleted', 'Document deleted')
                                  loadDocuments()
                                })
                              }
                            }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        {selectedDocument?.url === doc.url && (
                          <TableRow>
                            <TableCell colSpan={9} sx={{ py: 3, bgcolor: 'background.default' }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>Summary</Typography>
                                  <Typography variant="body2">{doc.metadata.content_summary || 'No summary'}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>Keywords</Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {doc.metadata.extracted_keywords?.slice(0, 10).map(kw => (
                                      <Chip key={kw} label={kw} size="small" />
                                    ))}
                                  </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>Topics</Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {doc.metadata.topics?.map(topic => (
                                      <Chip key={topic} label={topic} size="small" color="primary" />
                                    ))}
                                  </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>Metadata</Typography>
                                  <Typography variant="caption" display="block">Reading Time: {doc.metadata.reading_time_minutes || 0} min</Typography>
                                  <Typography variant="caption" display="block">Readability: {doc.metadata.readability_score || 'N/A'}</Typography>
                                  <Typography variant="caption" display="block">Completeness: {doc.metadata.completeness_score || 'N/A'}</Typography>
                                </Grid>
                                {doc.related_documents && doc.related_documents.length > 0 && (
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>Related Documents</Typography>
                                    <List dense>
                                      {doc.related_documents.slice(0, 10).map((relatedUrl, idx) => (
                                        <ListItem key={idx}>
                                          <ListItemText
                                            primary={relatedUrl}
                                            primaryTypographyProps={{ variant: 'caption' }}
                                          />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Grid>
                                )}
                              </Grid>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Bulk Upload Documents</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload documents in JSON or CSV format. Documents will be updated if URL exists, or created if new.
              If content_text is missing, the URL will be automatically scanned.
            </Typography>

            {/* Format Documentation */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">Accepted Formats</Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>JSON Format:</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'grey.100', fontFamily: 'monospace', fontSize: '0.875rem', overflow: 'auto' }}>
                  {`[
  {
    "title": "Document Title",
    "url": "https://example.com/doc",
    "metadata": {
      "content_text": "Full content...",
      "content_summary": "Summary...",
      "word_count": 500,
      "categories": ["category1", "category2"],
      "extracted_keywords": ["keyword1", "keyword2"],
      "topics": ["topic1"],
      "content_type": "blog"
    }
  }
]`}
                </Paper>
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={() => downloadTemplate('json')}
                  sx={{ mt: 1 }}
                >
                  Download JSON Template
                </Button>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>CSV Format:</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'grey.100', fontFamily: 'monospace', fontSize: '0.875rem', overflow: 'auto' }}>
                  {`title,url,content_text,content_summary,word_count,categories,keywords,topics,content_type
"Document Title","https://example.com/doc","Full content...","Summary...",500,"category1,category2","keyword1,keyword2","topic1",blog`}
                </Paper>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Note: Multi-value fields (categories, keywords, topics) should be comma-separated within quoted strings.
                </Typography>
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={() => downloadTemplate('csv')}
                  sx={{ mt: 1 }}
                >
                  Download CSV Template
                </Button>
              </Box>
            </Paper>

            {/* Upload Section */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Select Format:</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={uploadFormat === 'json' ? 'contained' : 'outlined'}
                    onClick={() => setUploadFormat('json')}
                  >
                    JSON
                  </Button>
                  <Button
                    variant={uploadFormat === 'csv' ? 'contained' : 'outlined'}
                    onClick={() => setUploadFormat('csv')}
                  >
                    CSV
                  </Button>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <input
                  accept={uploadFormat === 'json' ? '.json' : '.csv'}
                  style={{ display: 'none' }}
                  id="upload-file"
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="upload-file">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{ py: 2 }}
                  >
                    {uploadFile ? uploadFile.name : 'Choose File'}
                  </Button>
                </label>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
                startIcon={isUploading ? <CircularProgress size={16} /> : <Upload />}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>

              {uploadResult && (
                <Alert severity={uploadResult.failed > 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Successfully imported: {uploadResult.success} document(s)
                    {uploadResult.failed > 0 && ` | Failed: ${uploadResult.failed} document(s)`}
                  </Typography>
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" fontWeight="bold">Errors:</Typography>
                      {uploadResult.errors.map((error, idx) => (
                        <Typography key={idx} variant="caption" display="block">{error}</Typography>
                      ))}
                    </Box>
                  )}
                </Alert>
              )}
            </Paper>
          </CardContent>
        </Card>
      )}

      {/* Version Selection Dialog */}
      <Dialog open={showVersionDialog} onClose={() => setShowVersionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Version to Activate</DialogTitle>
        <DialogContent>
          <List>
            {versions.map((version) => (
              <ListItem
                key={version}
                button
                onClick={() => setSelectedVersion(version)}
                selected={selectedVersion === version}
              >
                <ListItemText
                  primary={version}
                  secondary={version === config?.version ? 'Currently active' : ''}
                />
              </ListItem>
            ))}
            {versions.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No versions available
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVersionDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => selectedVersion && handleActivateVersion(selectedVersion)}
            disabled={!selectedVersion}
          >
            Activate
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

