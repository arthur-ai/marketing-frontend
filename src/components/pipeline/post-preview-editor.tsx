'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AutoFixHigh as AutoFixIcon,
} from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import { getPlatformConfig } from '@/lib/platform-config'

interface PostPreviewEditorProps {
  content: string
  platform: string
  emailType?: string
  subjectLine?: string
  onSave?: (updatedContent: string, updatedSubjectLine?: string) => Promise<void>
  readOnly?: boolean
}

export function PostPreviewEditor({
  content: initialContent,
  platform,
  emailType,
  subjectLine: initialSubjectLine,
  onSave,
  readOnly = false,
}: PostPreviewEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(initialContent)
  const [subjectLine, setSubjectLine] = useState(initialSubjectLine || '')
  const [previewTab, setPreviewTab] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    is_valid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
    auto_fix_available: boolean
    auto_fixed_content?: string
  } | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const platformConfig = getPlatformConfig(platform)
  const charCount = content.length
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const maxChars = platformConfig?.max_characters || 3000
  const recommendedChars = platformConfig?.recommended_characters || 2000

  // Validate content when it changes
  useEffect(() => {
    if (content && !isEditing) {
      validateContent()
    }
  }, [content, platform, emailType, subjectLine])

  const validateContent = async () => {
    setIsValidating(true)
    try {
      const response = await fetch('/api/v1/social-media/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          platform,
          email_type: emailType,
          subject_line: subjectLine || undefined,
        }),
      })
      const result = await response.json()
      setValidationResult(result)
    } catch (error) {
      console.error('Failed to validate content:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleSave = async () => {
    if (!onSave) return

    // Validate before saving
    await validateContent()
    if (validationResult && !validationResult.is_valid) {
      return // Don't save if validation fails
    }

    setIsSaving(true)
    try {
      await onSave(content, subjectLine || undefined)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setContent(initialContent)
    setSubjectLine(initialSubjectLine || '')
    setIsEditing(false)
    setValidationResult(null)
  }

  const handleAutoFix = async () => {
    if (validationResult?.auto_fixed_content) {
      setContent(validationResult.auto_fixed_content)
      await validateContent()
    }
  }

  const getCharCountColor = () => {
    if (charCount > maxChars) return 'error'
    if (charCount > recommendedChars) return 'warning'
    return 'success'
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {platformConfig?.name || platform} Post {isEditing ? '(Editing)' : ''}
          </Typography>
          {!readOnly && (
            <Box>
              {isEditing ? (
                <>
                  <Button
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={isSaving || isValidating}
                    variant="contained"
                    sx={{ mr: 1 }}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* Email Subject Line */}
        {platform === 'email' && (
          <Box sx={{ mb: 2 }}>
            {isEditing ? (
              <TextField
                fullWidth
                label="Subject Line"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                size="small"
                helperText={`${subjectLine.length} characters (recommended: 50-60)`}
                error={subjectLine.length > 60}
              />
            ) : (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Subject Line:
                </Typography>
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                  {subjectLine || '(No subject line)'}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Validation Results */}
        {validationResult && (
          <Box sx={{ mb: 2 }}>
            {validationResult.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Errors:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationResult.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}
            {validationResult.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Warnings:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationResult.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </Alert>
            )}
            {validationResult.auto_fix_available && (
              <Alert
                severity="info"
                action={
                  <Button
                    size="small"
                    startIcon={<AutoFixIcon />}
                    onClick={handleAutoFix}
                  >
                    Auto-Fix
                  </Button>
                }
                sx={{ mb: 1 }}
              >
                Auto-fix available for detected issues
              </Alert>
            )}
            {validationResult.suggestions.length > 0 && (
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Suggestions:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationResult.suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </Box>
        )}

        {/* Character Count Indicator */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <Chip
            label={`${charCount} / ${maxChars} characters`}
            color={getCharCountColor()}
            size="small"
          />
          <Chip label={`${wordCount} words`} size="small" variant="outlined" />
          {charCount > maxChars && (
            <Chip
              icon={<WarningIcon />}
              label={`Exceeds limit by ${charCount - maxChars}`}
              color="error"
              size="small"
            />
          )}
          {isValidating && <CircularProgress size={16} />}
        </Box>

        {/* Content Editor/Preview */}
        {isEditing ? (
          <TextField
            fullWidth
            multiline
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter post content..."
            sx={{ mb: 2 }}
          />
        ) : (
          <Box>
            <Tabs value={previewTab} onChange={(_, newValue) => setPreviewTab(newValue)} sx={{ mb: 2 }}>
              <Tab label="Preview" />
              <Tab label="Markdown" />
            </Tabs>
            {previewTab === 0 ? (
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'background.paper',
                  minHeight: '200px',
                }}
              >
                <ReactMarkdown>{content}</ReactMarkdown>
              </Box>
            ) : (
              <Box
                component="pre"
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'grey.100',
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {content}
              </Box>
            )}
          </Box>
        )}

        {/* Platform-Specific Hints */}
        {platformConfig && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Platform Guidelines:</strong> {platformConfig.description}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

