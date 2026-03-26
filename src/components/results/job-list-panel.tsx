'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Search, DeleteForever, Person } from '@mui/icons-material';
import type { JobListItem } from '@/types/api';
import { formatTimestamp } from '@/utils/contentFormatters';

function getJobTitle(job: JobListItem): string {
  if (job.metadata?.title) return job.metadata.title;
  if (job.content_type) return job.content_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  return `Job #${job.job_id.substring(0, 6)}`;
}

function getJobSubline(job: JobListItem): string {
  const date = job.completed_at || job.created_at;
  const dateStr = date ? formatTimestamp(date) : 'Unknown date';
  const user = job.metadata?.triggered_by_username
    ?? job.metadata?.triggered_by_email
    ?? job.user_id
    ?? job.triggered_by?.username
    ?? job.triggered_by?.email
    ?? null;
  return user ? `${dateStr} · by ${user}` : dateStr;
}

interface UniqueUser {
  user_id: string;
  display: string;
}

interface JobListPanelProps {
  jobs: JobListItem[];
  filteredJobs: JobListItem[];
  selectedJobId?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  contentTypes: string[];
  onSelectJob: (jobId: string) => void;
  // Admin-only props
  isAdmin?: boolean;
  uniqueUsers?: UniqueUser[];
  filterUserId?: string;
  setFilterUserId?: (userId: string | undefined) => void;
  onDeleteJob?: (jobId: string) => void;
}

export function JobListPanel({
  jobs,
  filteredJobs,
  selectedJobId,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  contentTypes,
  onSelectJob,
  isAdmin = false,
  uniqueUsers = [],
  filterUserId,
  setFilterUserId,
  onDeleteJob,
}: JobListPanelProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Jobs ({filteredJobs.length}/{jobs.length})
        </Typography>

        {/* Search and Filters */}
        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
                <MenuItem value="all">All Types</MenuItem>
                {contentTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="waiting_for_approval">Waiting for Approval</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Admin-only user filter */}
          {isAdmin && uniqueUsers.length > 0 && setFilterUserId && (
            <FormControl size="small" fullWidth>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Person fontSize="small" />
                  User
                </Box>
              </InputLabel>
              <Select
                value={filterUserId || ''}
                label="User"
                onChange={(e) => setFilterUserId(e.target.value || undefined)}
              >
                <MenuItem value="">All Users</MenuItem>
                {uniqueUsers.map((u) => (
                  <MenuItem key={u.user_id} value={u.user_id}>
                    {u.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        <List sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
          {filteredJobs.map((job) => (
            <ListItem
              key={job.job_id}
              disablePadding
              sx={{ borderRadius: 1, mb: 1 }}
              secondaryAction={
                isAdmin && onDeleteJob ? (
                  <Tooltip title="Delete job permanently">
                    <IconButton
                      edge="end"
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteJob(job.job_id);
                      }}
                      sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                    >
                      <DeleteForever fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : undefined
              }
            >
              <ListItemButton
                selected={selectedJobId === job.job_id}
                onClick={() => onSelectJob(job.job_id)}
                sx={{
                  borderRadius: 1,
                  pr: isAdmin ? 5 : undefined,
                  '&.Mui-selected': {
                    bgcolor: '#E8A23814',
                    '&:hover': { bgcolor: '#E8A23820' },
                  },
                  // Amber progress trace on processing rows (keyframe defined in globals.css)
                  ...(job.status === 'processing' && {
                    backgroundImage: 'linear-gradient(#E8A23899, #E8A23899)',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'bottom left',
                    backgroundSize: '0% 2px',
                    animation: 'amberTrace 2s ease-in-out infinite',
                  }),
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight="medium" noWrap>
                      {getJobTitle(job)}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {getJobSubline(job)}
                    </Typography>
                  }
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  {job.status === 'waiting_for_approval' &&
                    job.chain_status !== 'failed' &&
                    !(job.subjob_status?.failed && job.subjob_status.failed > 0) && (
                      <Chip
                        label="Needs Approval"
                        size="small"
                        aria-label="Status: Needs Approval"
                        sx={{
                          bgcolor: '#E8A23820', color: '#E8A238',
                          fontFamily: 'var(--font-mono)', fontSize: '11px',
                          borderRadius: '3px', height: 20,
                          '& .MuiChip-label': { px: 1 },
                        }}
                      />
                    )}
                  {job.pending_approval_count && job.pending_approval_count > 0 ? (
                    <Chip
                      label={`${job.pending_approval_count} pending`}
                      size="small"
                      aria-label={`${job.pending_approval_count} approvals pending`}
                      sx={{
                        bgcolor: '#E8A23820', color: '#E8A238',
                        fontFamily: 'var(--font-mono)', fontSize: '11px',
                        borderRadius: '3px', height: 20,
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  ) : null}
                  {job.subjob_count && job.subjob_count > 0 && (
                    <Tooltip
                      title={
                        job.subjob_status
                          ? `${job.subjob_status.completed}/${job.subjob_status.total} subjobs completed`
                          : `${job.subjob_count} subjobs`
                      }
                    >
                      <Chip
                        label={`${job.subjob_count} sub`}
                        size="small"
                        aria-label={`${job.subjob_count} subjobs`}
                        sx={{
                          bgcolor: job.chain_status === 'all_completed'
                            ? '#4A7C6F20'
                            : job.chain_status === 'failed'
                              ? '#C45C3B20'
                              : '#E8A23820',
                          color: job.chain_status === 'all_completed'
                            ? '#4A7C6F'
                            : job.chain_status === 'failed'
                              ? '#C45C3B'
                              : '#E8A238',
                          fontFamily: 'var(--font-mono)', fontSize: '11px',
                          borderRadius: '3px', height: 20,
                          '& .MuiChip-label': { px: 1 },
                        }}
                      />
                    </Tooltip>
                  )}
                  {job.chain_status && job.chain_status !== 'all_completed' && (
                    <Chip
                      label={job.chain_status.replace(/_/g, ' ')}
                      size="small"
                      aria-label={`Chain status: ${job.chain_status}`}
                      sx={{
                        bgcolor: 'transparent',
                        color: job.chain_status === 'failed' ? '#C45C3B' : '#6B6154',
                        border: `1px solid ${job.chain_status === 'failed' ? '#C45C3B40' : '#2A251F'}`,
                        fontFamily: 'var(--font-mono)', fontSize: '10px',
                        borderRadius: '3px', height: 18,
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  )}
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
