'use client'

import { Alert, Typography } from '@mui/material'
import type { ApprovalRequest, ApprovalListItem } from '@/types/api'

interface ApprovalStatusAlertProps {
  approval: ApprovalRequest | ApprovalListItem
  showAlreadyDecided?: boolean
}

export function ApprovalStatusAlert({ approval, showAlreadyDecided = true }: ApprovalStatusAlertProps) {
  const isAlreadyDecided = approval.status !== 'pending'
  
  if (!showAlreadyDecided && isAlreadyDecided) {
    return null
  }

  if (isAlreadyDecided) {
    const severity = approval.status === 'approved' ? 'success' : approval.status === 'rejected' ? 'error' : 'info'
    
    return (
      <Alert severity={severity} sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          This approval has already been {approval.status}.
        </Typography>
        {'reviewed_at' in approval && approval.reviewed_at && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Reviewed: {new Date(approval.reviewed_at).toLocaleString()}
          </Typography>
        )}
        {'reviewed_by' in approval && approval.reviewed_by && (
          <Typography variant="body2">
            Reviewed by: {approval.reviewed_by}
          </Typography>
        )}
        {'user_comment' in approval && approval.user_comment && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Comment: {approval.user_comment}
          </Typography>
        )}
      </Alert>
    )
  }

  // For pending approvals, show status alert
  const severity = approval.status === 'approved' ? 'success' : approval.status === 'pending' ? 'warning' : 'info'
  
  return (
    <Alert severity={severity} sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom>
        {approval.status === 'approved'
          ? 'This content has been approved.'
          : approval.status === 'pending'
          ? 'This content is pending approval.'
          : 'This content was rejected or modified.'}
      </Typography>
      {'reviewed_at' in approval && approval.reviewed_at && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Reviewed: {new Date(approval.reviewed_at).toLocaleString()}
        </Typography>
      )}
      {'reviewed_by' in approval && approval.reviewed_by && (
        <Typography variant="body2">
          Reviewed by: {approval.reviewed_by}
        </Typography>
      )}
      {'user_comment' in approval && approval.user_comment && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Comment: {approval.user_comment}
        </Typography>
      )}
    </Alert>
  )
}
