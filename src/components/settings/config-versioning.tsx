'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
} from '@mui/material'
import {
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import {
  getPipelineConfigVersions,
  activatePipelineConfigVersion,
  deletePipelineConfigVersion,
  type PipelineConfigVersion,
} from '@/lib/pipeline-config-versioning'
import type { PipelineConfig } from '@/types/api'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'

interface ConfigVersioningProps {
  config: PipelineConfig
  onRollback: (config: PipelineConfig) => void
}

export function ConfigVersioning({ config, onRollback }: ConfigVersioningProps) {
  const [versions, setVersions] = useState<PipelineConfigVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<PipelineConfigVersion | null>(null)
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadVersions()
  }, [])

  const loadVersions = () => {
    const allVersions = getPipelineConfigVersions()
    setVersions(allVersions)
  }

  const handleRollback = (version: PipelineConfigVersion) => {
    setSelectedVersion(version)
    setRollbackDialogOpen(true)
  }

  const confirmRollback = () => {
    if (!selectedVersion) return

    try {
      activatePipelineConfigVersion(selectedVersion.version)
      onRollback(selectedVersion.config)
      loadVersions()
      setRollbackDialogOpen(false)
      setSelectedVersion(null)
      showSuccessToast(`Rolled back to version ${selectedVersion.version}`)
    } catch (e) {
      showErrorToast('Failed to rollback configuration')
      console.error('Rollback error:', e)
    }
  }

  const handleDelete = (version: string) => {
    setVersionToDelete(version)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!versionToDelete) return

    try {
      deletePipelineConfigVersion(versionToDelete)
      loadVersions()
      setDeleteDialogOpen(false)
      setVersionToDelete(null)
      showSuccessToast('Version deleted successfully')
    } catch (e) {
      showErrorToast('Failed to delete version')
      console.error('Delete error:', e)
    }
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Configuration versions are automatically saved when you save changes. You can rollback to any previous version.
      </Alert>

      {versions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Version History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Version history will be created when you save your configuration.
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List>
            {versions.map((version, index) => (
              <Box key={version.version}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={version.is_active ? 600 : 400}>
                          {version.description || `Version ${version.version}`}
                        </Typography>
                        {version.is_active && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Active"
                            color="success"
                            size="small"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(version.timestamp), 'PPpp')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                          Version: {version.version}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {!version.is_active && (
                      <>
                        <IconButton
                          edge="end"
                          aria-label="rollback"
                          onClick={() => handleRollback(version)}
                          color="primary"
                          sx={{ mr: 1 }}
                        >
                          <RestoreIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDelete(version.version)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                {index < versions.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Paper>
      )}

      {/* Rollback Confirmation Dialog */}
      <Dialog open={rollbackDialogOpen} onClose={() => setRollbackDialogOpen(false)}>
        <DialogTitle>Rollback Configuration?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to rollback to this version? This will replace your current configuration.
          </Typography>
          {selectedVersion && (
            <Box>
              <Typography variant="body2">
                <strong>Version:</strong> {selectedVersion.version}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {format(new Date(selectedVersion.timestamp), 'PPpp')}
              </Typography>
              {selectedVersion.description && (
                <Typography variant="body2">
                  <strong>Description:</strong> {selectedVersion.description}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRollbackDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmRollback} color="primary" variant="contained">
            Rollback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Version?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this version? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

