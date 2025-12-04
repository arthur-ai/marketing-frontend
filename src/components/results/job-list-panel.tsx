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
  Stack,
  Chip,
  Tooltip,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import type { JobListItem } from '@/types/api';
import { formatTimestamp, formatJobDisplayName } from '@/utils/contentFormatters';

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

          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
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

            <FormControl size="small" sx={{ flex: 1 }}>
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
        </Box>

        <List sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
          {filteredJobs.map((job) => (
            <ListItem
              key={job.job_id}
              disablePadding
              sx={{
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemButton
                selected={selectedJobId === job.job_id}
                onClick={() => onSelectJob(job.job_id)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="body2" fontWeight="medium" noWrap>
                        {formatJobDisplayName(job)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Steps: {job.step_count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {job.completed_at
                          ? `Completed: ${formatTimestamp(job.completed_at)}`
                          : 'In Progress'}
                      </Typography>
                    </Stack>
                  }
                  secondaryTypographyProps={{
                    component: 'div' as const,
                  }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  {job.status === 'waiting_for_approval' &&
                    job.chain_status !== 'failed' &&
                    !(job.subjob_status?.failed && job.subjob_status.failed > 0) && (
                      <Chip label="Waiting for Approval" size="small" color="warning" />
                    )}
                  {job.subjob_count && job.subjob_count > 0 && (
                    <Tooltip
                      title={
                        job.subjob_status
                          ? `${job.subjob_status.completed}/${job.subjob_status.total} subjobs completed`
                          : `${job.subjob_count} subjobs`
                      }
                    >
                      <Chip
                        label={`${job.subjob_count} subjob${job.subjob_count !== 1 ? 's' : ''}`}
                        size="small"
                        color={
                          job.chain_status === 'all_completed'
                            ? 'success'
                            : job.chain_status === 'blocked'
                              ? 'warning'
                              : job.chain_status === 'failed'
                                ? 'error'
                                : 'info'
                        }
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Tooltip>
                  )}
                  {job.chain_status && job.chain_status !== 'all_completed' && (
                    <Chip
                      label={job.chain_status.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                      color={
                        job.chain_status === 'blocked'
                          ? 'warning'
                          : job.chain_status === 'failed'
                            ? 'error'
                            : 'info'
                      }
                      sx={{ fontSize: '0.65rem', height: 18 }}
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
