'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import LinkIcon from '@mui/icons-material/Link'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

export function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isExtractingUrl, setIsExtractingUrl] = useState(false)
  const queryClient = useQueryClient()

  const getContentType = useCallback((filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'json':
        return 'blog_post'
      case 'md':
        return 'transcript'
      case 'txt':
        return 'release_notes'
      case 'docx':
      case 'doc':
        return 'blog_post'
      case 'pdf':
        return 'transcript'
      case 'csv':
        return 'release_notes'
      case 'rtf':
        return 'blog_post'
      case 'yaml':
      case 'yml':
        return 'blog_post'
      default:
        return 'blog_post'
    }
  }, [])

  const uploadFiles = useCallback(async (fileList: File[], fileObjects: UploadedFile[]) => {
    setIsUploading(true)
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const fileObj = fileObjects[i]
      
      try {
        // Create FormData
        const formData = new FormData()
        formData.append('file', file)
        formData.append('content_type', getContentType(file.name))
        
        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, progress: 25 }
            : f
        ))

        // Upload file
        await api.uploadFile(formData)

        // Update status to success
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'success', progress: 100 }
            : f
        ))

      } catch (error) {
        // Update status to error
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { 
                ...f, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : f
        ))
      }
    }

    setIsUploading(false)
    
    // Refresh content sources after upload
    queryClient.invalidateQueries({ queryKey: ['content-sources'] })
  }, [queryClient, getContentType])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])
    uploadFiles(acceptedFiles, newFiles)
  }, [uploadFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
      'text/yaml': ['.yaml', '.yml'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/rtf': ['.rtf']
    },
    maxSize: 25 * 1024 * 1024, // 25MB (increased for larger files)
    multiple: true
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const clearAll = () => {
    setFiles([])
  }

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'success':
        return 'success'
      case 'error':
        return 'error'
      case 'uploading':
        return 'warning'
      default:
        return 'default'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const extractFromUrl = useCallback(async () => {
    if (!urlInput.trim()) {
      return
    }

    setIsExtractingUrl(true)
    
    const urlFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: urlInput,
      size: 0,
      type: 'url',
      status: 'uploading',
      progress: 0
    }

    setFiles(prev => [urlFile, ...prev])

    try {
      // Update progress
      setFiles(prev => prev.map(f => 
        f.id === urlFile.id 
          ? { ...f, progress: 25 }
          : f
      ))

      // Extract content from URL
      const response = await api.uploadFromUrl(urlInput, 'blog_post')

      // Update status to success
      setFiles(prev => prev.map(f => 
        f.id === urlFile.id 
          ? { 
              ...f, 
              status: 'success', 
              progress: 100,
              name: response.data.title || urlInput,
              size: response.data.word_count || 0
            }
          : f
      ))

      // Clear URL input
      setUrlInput('')
      
      // Refresh content sources after upload
      queryClient.invalidateQueries({ queryKey: ['content-sources'] })

    } catch (error) {
      // Update status to error
      setFiles(prev => prev.map(f => 
        f.id === urlFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'URL extraction failed'
            }
          : f
      ))
    } finally {
      setIsExtractingUrl(false)
    }
  }, [urlInput, queryClient])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* File Upload Card */}
      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <CloudUploadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                File Upload
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag and drop files or click to browse
              </Typography>
            </Box>
          </Box>

          <Paper
            {...getRootProps()}
            elevation={0}
            sx={{
              border: 2,
              borderStyle: 'dashed',
              borderColor: isDragActive ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 6,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.default',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.light',
                bgcolor: 'action.hover',
              },
              opacity: isUploading ? 0.5 : 1,
              pointerEvents: isUploading ? 'none' : 'auto',
            }}
          >
            <input {...getInputProps()} />
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: isDragActive ? 'primary.light' : 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 32, color: isDragActive ? 'primary.main' : 'text.secondary' }} />
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              {isDragActive ? 'Drop files here' : 'Choose files or drag and drop'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports: JSON, Markdown, Text, Word, PDF, CSV, YAML (max 25MB)
            </Typography>
          </Paper>
        </CardContent>
      </Card>

      {/* URL Extract Card */}
      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <LinkIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Extract from URL
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Automatically extract content from any blog post URL
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="https://example.com/blog-post"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isExtractingUrl && urlInput.trim()) {
                  extractFromUrl()
                }
              }}
              disabled={isExtractingUrl}
              InputProps={{
                startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <Button
              variant="contained"
              onClick={extractFromUrl}
              disabled={!urlInput.trim() || isExtractingUrl}
              sx={{ minWidth: 120, textTransform: 'none', fontWeight: 600 }}
            >
              {isExtractingUrl ? 'Extracting...' : 'Extract'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <Card elevation={2}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InsertDriveFileIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Uploaded Files ({files.length})
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={clearAll}
                disabled={isUploading}
                sx={{ textTransform: 'none' }}
              >
                Clear All
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {files.map((file) => (
                <Paper
                  key={file.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.light',
                      boxShadow: 1,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flexShrink: 0 }}>
                      {file.status === 'success' && <CheckCircleIcon sx={{ color: 'success.main' }} />}
                      {file.status === 'error' && <ErrorIcon sx={{ color: 'error.main' }} />}
                      {file.status === 'uploading' && (
                        <Box sx={{ width: 24, height: 24, position: 'relative' }}>
                          <CircularProgress size={24} />
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.size)} • {getContentType(file.name)}
                      </Typography>

                      {file.status === 'uploading' && (
                        <LinearProgress
                          variant="determinate"
                          value={file.progress}
                          sx={{ mt: 1, height: 4, borderRadius: 2 }}
                        />
                      )}

                      {file.error && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                          {file.error}
                        </Typography>
                      )}
                    </Box>

                    <Chip
                      label={file.status}
                      color={getStatusColor(file.status)}
                      size="small"
                      sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                    />

                    <IconButton
                      size="small"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading'}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
