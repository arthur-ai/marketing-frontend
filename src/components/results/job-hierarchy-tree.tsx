'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Collapse,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  CheckCircle,
  Cancel,
  AccessTime,
  PlayArrow,
  HourglassEmpty,
} from '@mui/icons-material';
import { api } from '@/lib/api';

interface JobNode {
  id: string;
  type: string;
  status: string;
  content_id: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  progress: number;
  current_step?: string;
  metadata?: any;
}

interface JobChainData {
  success: boolean;
  root_job_id: string;
  chain_length: number;
  chain_order: string[];
  all_job_ids: string[];
  chain_status: string;
  jobs: JobNode[];
}

interface JobHierarchyTreeProps {
  jobId: string;
  selectedJobId?: string;
  onJobClick?: (jobId: string) => void;
}

const JobHierarchyTree: React.FC<JobHierarchyTreeProps> = ({
  jobId,
  selectedJobId,
  onJobClick,
}) => {
  const [chainData, setChainData] = useState<JobChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchChainData = async () => {
      try {
        setLoading(true);
        const response = await api.getJobChain(jobId);
        if (response.status !== 200) {
          throw new Error('Failed to fetch job chain');
        }
        const data = response.data;
        setChainData(data);
        // Expand nodes to show the selected job
        const nodesToExpand = new Set<string>();
        if (data.root_job_id) {
          nodesToExpand.add(data.root_job_id);
        }
        // If a selected job is provided, expand all parent nodes to show it
        if (selectedJobId && selectedJobId !== data.root_job_id) {
          // Find the selected job in the chain and expand all its ancestors
          const selectedIndex = data.chain_order.indexOf(selectedJobId);
          if (selectedIndex > 0) {
            // Expand all jobs up to and including the selected job's parent
            for (let i = 0; i < selectedIndex; i++) {
              nodesToExpand.add(data.chain_order[i]);
            }
          }
        }
        setExpandedNodes(nodesToExpand);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job chain');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchChainData();
    }
  }, [jobId, selectedJobId]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />;
      case 'failed':
        return <Cancel sx={{ color: '#f44336', fontSize: 20 }} />;
      case 'processing':
      case 'queued':
        return <PlayArrow sx={{ color: '#2196f3', fontSize: 20 }} />;
      case 'waiting_for_approval':
        return <HourglassEmpty sx={{ color: '#ff9800', fontSize: 20 }} />;
      default:
        return <AccessTime sx={{ color: '#9e9e9e', fontSize: 20 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
      case 'queued':
        return 'info';
      case 'waiting_for_approval':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderJobNode = (job: JobNode, index: number, isRoot: boolean = false) => {
    const isExpanded = expandedNodes.has(job.id);
    const hasChildren = index < (chainData?.jobs.length || 0) - 1;
    const isSubjob = !isRoot;
    const isSelected = selectedJobId === job.id;

    return (
      <Box key={job.id} sx={{ mb: 1 }}>
        <Card
          sx={{
            cursor: onJobClick ? 'pointer' : 'default',
            border: isSelected ? 2 : isRoot ? 2 : 1,
            borderColor: isSelected ? 'primary.main' : isRoot ? 'primary.light' : 'divider',
            bgcolor: isSelected ? 'action.selected' : 'background.paper',
            '&:hover': onJobClick
              ? {
                  boxShadow: 3,
                  borderColor: 'primary.main',
                }
              : {},
          }}
          onClick={() => onJobClick?.(job.id)}
        >
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {hasChildren && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(job.id);
                  }}
                  sx={{ p: 0.5 }}
                >
                  {isExpanded ? <ExpandMore /> : <ChevronRight />}
                </IconButton>
              )}
              {!hasChildren && <Box sx={{ width: 32 }} />}
              
              {getStatusIcon(job.status)}
              
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {isRoot ? 'Root Job' : `Subjob ${index}`}
                  </Typography>
                  <Chip
                    label={job.status}
                    size="small"
                    color={getStatusColor(job.status) as any}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                  {isSubjob && (
                    <Chip
                      label="Resume"
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {job.id.substring(0, 8)}...
                </Typography>
                {job.current_step && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {job.current_step}
                  </Typography>
                )}
              </Box>
              
              {job.progress > 0 && (
                <Box sx={{ minWidth: 60, textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    {job.progress}%
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
        
        {hasChildren && isExpanded && (
          <Box sx={{ ml: 4, mt: 1, borderLeft: 2, borderColor: 'divider', pl: 2 }}>
            {chainData?.jobs[index + 1] && renderJobNode(chainData.jobs[index + 1], index + 1, false)}
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading job hierarchy...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!chainData || chainData.jobs.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">No job chain data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Job Hierarchy</Typography>
          <Chip
            label={`${chainData.chain_length} job${chainData.chain_length !== 1 ? 's' : ''}`}
            size="small"
            color={chainData.chain_status === 'completed' ? 'success' : 'default'}
          />
        </Box>
        
        <Stack spacing={1}>
          {chainData.jobs.length > 0 && renderJobNode(chainData.jobs[0], 0, true)}
        </Stack>
        
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Chain Status: <strong>{chainData.chain_status}</strong>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default JobHierarchyTree;

