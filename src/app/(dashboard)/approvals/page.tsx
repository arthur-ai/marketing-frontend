'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Divider,
} from '@mui/material'
import {
  CheckCircle,
  AccessTime,
  Error as ErrorIcon,
  Refresh,
} from '@mui/icons-material'
import { usePendingApprovals } from '@/hooks/useApi'
import { getApprovalRoute } from '@/lib/approval-routing'

export default function ApprovalsPage() {
  const router = useRouter()
  const { data, isLoading, refetch } = usePendingApprovals()

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      case 'modified':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AccessTime color="warning" />
      case 'approved':
        return <CheckCircle color="success" />
      case 'rejected':
        return <ErrorIcon color="error" />
      default:
        return <AccessTime />
    }
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading approvals...</Typography>
      </Container>
    )
  }

  const pending = data?.data?.pending || 0
  const approvals = data?.data?.approvals || []

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Approvals
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and approve pipeline outputs
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </Box>

      {pending === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <AccessTime sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Pending Approvals
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              All approvals have been reviewed. Check back later for new approvals.
            </Typography>
            <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', textAlign: 'left' }}>
              <Typography variant="body2" gutterBottom>
                <strong>Where to approve:</strong>
              </Typography>
              <Typography variant="body2" component="div" sx={{ pl: 2 }}>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  <li>This page shows all pending approvals when they exist</li>
                  <li>The banner at the top of dashboard pages shows pending approvals</li>
                  <li>Results page shows approvals for a specific job</li>
                  <li>Sidebar has an "Approvals" link with a badge showing pending count</li>
                </ul>
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Note:</strong> If you just triggered a job with approvals enabled, wait a moment and refresh. 
                The pipeline will stop at the first approval step.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Pending Approvals ({pending})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please review and approve or reject the following pipeline outputs.
              </Typography>
            </Box>
              
              <List>
                {approvals.map((approval, index) => (
                  <Box key={approval.id}>
                    <ListItem
                      disablePadding
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemButton
                        onClick={() => router.push(getApprovalRoute(approval.pipeline_step, approval.id))}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {(approval.pipeline_step || 'Unknown Step')
                                  .replace(/_/g, ' ')
                                  .toUpperCase()}
                              </Typography>
                              <Chip
                                label={approval.status}
                                size="small"
                                color={getStatusColor(approval.status)}
                                icon={getStatusIcon(approval.status)}
                              />
                            </Box>
                          }
                          primaryTypographyProps={{
                            component: 'div' as const,
                          }}
                          secondary={
                            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {approval.step_name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTime sx={{ fontSize: 14 }} />
                                <Typography variant="caption" color="text.secondary">
                                  Created {formatTimeAgo(approval.created_at)}
                                </Typography>
                                {approval.job_id && (
                                  <>
                                    <Typography variant="caption" color="text.disabled">•</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Job: {approval.job_id.substring(0, 8)}...
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </Stack>
                          }
                          secondaryTypographyProps={{
                            component: 'div' as const,
                          }}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(getApprovalRoute(approval.pipeline_step, approval.id))
                          }}
                        >
                          Review
                        </Button>
                      </ListItemButton>
                    </ListItem>
                    {index < approvals.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
      )}
    </Container>
  )
}

