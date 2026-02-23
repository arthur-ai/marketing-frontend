/**
 * Notification Center Component
 *
 * Displays real-time notifications for job updates, approvals, and system events.
 * Features:
 * - Real-time WebSocket updates
 * - Unread badge count
 * - Notification history
 * - Click to navigate to relevant page
 * - Mark as read/unread
 * - Clear all notifications
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Button,
  Chip,
  Stack,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import TaskIcon from '@mui/icons-material/Task'
import DeleteIcon from '@mui/icons-material/Delete'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { useWebSocket } from '@/hooks/useWebSocket'

export interface Notification {
  id: string
  type: 'job_update' | 'approval_pending' | 'job_completed' | 'job_failed' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  jobId?: string
  approvalId?: string
  status?: string
}

export function NotificationCenter() {
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // WebSocket connection for real-time notifications
  const { lastMessage, isConnected } = useWebSocket('/ws/notifications', {
    autoReconnect: true,
    onMessage: (message) => {
      console.log('[NotificationCenter] Received:', message)
    },
  })

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return

    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type: lastMessage.type as any,
      title: getNotificationTitle(lastMessage.type, lastMessage.data),
      message: getNotificationMessage(lastMessage.type, lastMessage.data),
      timestamp: lastMessage.timestamp || new Date().toISOString(),
      read: false,
      jobId: lastMessage.data?.job_id,
      approvalId: lastMessage.data?.approval_id,
      status: lastMessage.data?.status,
    }

    setNotifications((prev) => [notification, ...prev].slice(0, 50)) // Keep last 50 notifications
  }, [lastMessage])

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )

    // Navigate to relevant page
    if (notification.jobId) {
      router.push(`/jobs/${notification.jobId}`)
    } else if (notification.approvalId) {
      router.push(`/approvals/${notification.approvalId}`)
    }

    handleClose()
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleClearAll = () => {
    setNotifications([])
    handleClose()
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        aria-label="notifications"
        size="large"
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          {unreadCount > 0 ? (
            <NotificationsIcon />
          ) : (
            <NotificationsNoneIcon />
          )}
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              width: 400,
              maxHeight: 600,
              mt: 1,
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={600}>
              Notifications
            </Typography>
            <Stack direction="row" spacing={1}>
              {!isConnected && (
                <Chip
                  label="Disconnected"
                  size="small"
                  color="error"
                  sx={{ height: 24 }}
                />
              )}
              <Chip
                label={`${unreadCount} new`}
                size="small"
                color={unreadCount > 0 ? 'primary' : 'default'}
                sx={{ height: 24 }}
              />
            </Stack>
          </Stack>

          {notifications.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                size="small"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                Mark all read
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClearAll}
              >
                Clear all
              </Button>
            </Stack>
          )}
        </Box>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsNoneIcon
              sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 500, overflow: 'auto' }}>
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <ListItemButton
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 1.5,
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': {
                      bgcolor: notification.read ? 'action.hover' : 'action.selected',
                    },
                  }}
                >
                  <Box sx={{ mr: 2, color: getNotificationColor(notification.type) }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        fontWeight={notification.read ? 400 : 600}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                          })}
                        </Typography>
                      </Box>
                    }
                  />
                  {notification.status && (
                    <Chip
                      label={notification.status}
                      size="small"
                      color={getStatusColor(notification.status)}
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </ListItemButton>
                {index < notifications.length - 1 && <Divider />}
              </div>
            ))}
          </List>
        )}
      </Popover>
    </>
  )
}

// Helper functions
function getNotificationTitle(type: string, data: any): string {
  switch (type) {
    case 'job_update':
      return `Job ${data?.status || 'updated'}`
    case 'job_completed':
      return 'Job completed successfully'
    case 'job_failed':
      return 'Job failed'
    case 'approval_pending':
      return 'Approval required'
    case 'system':
      return data?.title || 'System notification'
    default:
      return 'Notification'
  }
}

function getNotificationMessage(type: string, data: any): string {
  switch (type) {
    case 'job_update':
      return `Job ${data?.job_id?.substring(0, 8)} is ${data?.status || 'in progress'}`
    case 'job_completed':
      return `Job ${data?.job_id?.substring(0, 8)} completed ${data?.current_step || ''}`
    case 'job_failed':
      return `Job ${data?.job_id?.substring(0, 8)} failed: ${data?.error || 'Unknown error'}`
    case 'approval_pending':
      return `Approval needed for step: ${data?.step_name || 'Unknown step'}`
    case 'system':
      return data?.message || 'System update'
    default:
      return data?.message || 'New notification'
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'job_completed':
      return <CheckCircleIcon />
    case 'job_failed':
      return <ErrorIcon />
    case 'approval_pending':
      return <TaskIcon />
    case 'job_update':
      return <HourglassEmptyIcon />
    default:
      return <NotificationsIcon />
  }
}

function getNotificationColor(type: string): string {
  switch (type) {
    case 'job_completed':
      return 'success.main'
    case 'job_failed':
      return 'error.main'
    case 'approval_pending':
      return 'warning.main'
    case 'job_update':
      return 'info.main'
    default:
      return 'text.secondary'
  }
}

function getStatusColor(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'error'
    case 'processing':
    case 'pending':
      return 'warning'
    default:
      return 'default'
  }
}
