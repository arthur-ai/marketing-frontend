'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
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
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { usePendingApprovals, useDecideApproval } from '@/hooks/useApi'
import { getApprovalRoute } from '@/lib/approval-routing'
import { getJobRoute } from '@/lib/job-routing'
import { showErrorToast, showProcessingToast } from '@/lib/toast-utils'

export default function ApprovalsPage() {
  const router = useRouter()
  // Enable polling on approvals page
  const { data, isLoading, refetch } = usePendingApprovals(undefined, true)
  const decideApprovalMutation = useDecideApproval()
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
    return date.toLocaleDateString('en-US', options)
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

  const handleApproveAll = async () => {
    const currentApprovals = data?.data?.approvals || []
    const pendingApprovals = currentApprovals.filter(a => a.status === 'pending')
    if (pendingApprovals.length === 0) {
      showErrorToast('No Pending Approvals', 'There are no pending approvals to approve.')
      return
    }

    if (!confirm(`Are you sure you want to approve all ${pendingApprovals.length} pending approval(s)?`)) {
      return
    }

    setIsProcessingBulk(true)
    const processingToast = showProcessingToast(`Approving ${pendingApprovals.length} approval(s)...`)

    try {
      const results = await Promise.allSettled(
        pendingApprovals.map(approval =>
          decideApprovalMutation.mutateAsync({
            approvalId: approval.id,
            decision: {
              decision: 'approve',
              reviewed_by: 'current_user',
            },
          })
        )
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (failed === 0) {
        processingToast.success(
          'All Approvals Approved',
          `Successfully approved ${successful} approval(s).`
        )
      } else {
        processingToast.error(
          'Partial Success',
          `Approved ${successful} approval(s), but ${failed} failed.`
        )
      }

      // Refetch to update the list
      await refetch()
    } catch (error) {
      processingToast.error(
        'Approval Failed',
        error instanceof Error ? error.message : 'Failed to approve all approvals'
      )
    } finally {
      setIsProcessingBulk(false)
    }
  }

  const handleCancelAll = async () => {
    const currentApprovals = data?.data?.approvals || []
    const pendingApprovals = currentApprovals.filter(a => a.status === 'pending')
    if (pendingApprovals.length === 0) {
      showErrorToast('No Pending Approvals', 'There are no pending approvals to cancel.')
      return
    }

    if (!confirm(`Are you sure you want to reject all ${pendingApprovals.length} pending approval(s)? This action cannot be undone.`)) {
      return
    }

    setIsProcessingBulk(true)
    const processingToast = showProcessingToast(`Rejecting ${pendingApprovals.length} approval(s)...`)

    try {
      const results = await Promise.allSettled(
        pendingApprovals.map(approval =>
          decideApprovalMutation.mutateAsync({
            approvalId: approval.id,
            decision: {
              decision: 'reject',
              reviewed_by: 'current_user',
            },
          })
        )
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (failed === 0) {
        processingToast.success(
          'All Approvals Rejected',
          `Successfully rejected ${successful} approval(s).`
        )
      } else {
        processingToast.error(
          'Partial Success',
          `Rejected ${successful} approval(s), but ${failed} failed.`
        )
      }

      // Refetch to update the list
      await refetch()
    } catch (error) {
      processingToast.error(
        'Rejection Failed',
        error instanceof Error ? error.message : 'Failed to reject all approvals'
      )
    } finally {
      setIsProcessingBulk(false)
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Pending Approvals ({pending})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please review and approve or reject the following pipeline outputs.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelAll}
                    disabled={isProcessingBulk || pending === 0}
                    size="small"
                  >
                    Cancel All
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={handleApproveAll}
                    disabled={isProcessingBulk || pending === 0}
                    size="small"
                  >
                    Approve All
                  </Button>
                </Stack>
              </Box>
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
                                {approval.step_name}
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                              {approval.input_title && (
                                <>
                                  <Typography variant="caption" color="text.secondary">
                                    {approval.input_title}
                                  </Typography>
                                  <Typography variant="caption" color="text.disabled">•</Typography>
                                </>
                              )}
                              <AccessTime sx={{ fontSize: 14 }} />
                              <Typography variant="caption" color="text.secondary">
                                Created {formatDateTime(approval.created_at)}
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
                          }
                          secondaryTypographyProps={{
                            component: 'div' as const,
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {approval.job_id && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(getJobRoute(approval.pipeline_step, approval.job_id))
                              }}
                            >
                              View Job
                            </Button>
                          )}
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
                        </Box>
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

