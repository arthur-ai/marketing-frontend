'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Cancel,
  AccessTime,
  PlayArrow,
  HourglassEmpty,
  Security,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

interface TimelineEvent {
  event_type: 'step' | 'approval' | 'job_boundary' | 'job_completion';
  job_id: string;
  root_job_id?: string;
  execution_context_id?: string;
  timestamp?: string;
  step_name?: string;
  step_number?: number;
  status?: string;
  execution_time?: number;
  tokens_used?: number;
  error_message?: string;
  agent_name?: string;
  approval_id?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  job_type?: string;
  is_root?: boolean;
  is_subjob?: boolean;
  position?: number;
  total_jobs?: number;
  duration?: number;
  time_since_previous?: number;
}

interface TimelineData {
  success: boolean;
  job_id: string;
  root_job_id: string;
  chain_length: number;
  total_events: number;
  events: TimelineEvent[];
}

interface EnhancedTimelineProps {
  jobId: string;
  onEventClick?: (event: TimelineEvent) => void;
  apiBaseUrl?: string;
}

const EnhancedTimeline: React.FC<EnhancedTimelineProps> = ({
  jobId,
  onEventClick,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
}) => {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('vertical');

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/api/v1/results/jobs/${jobId}/timeline`);
        if (!response.ok) {
          throw new Error('Failed to fetch timeline');
        }
        const data = await response.json();
        setTimelineData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchTimeline();
    }
  }, [jobId, apiBaseUrl]);

  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status?: string, eventType?: string) => {
    if (eventType === 'approval') {
      return <Security sx={{ color: '#ff9800', fontSize: 20 }} />;
    }
    
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />;
      case 'failed':
        return <Cancel sx={{ color: '#f44336', fontSize: 20 }} />;
      case 'processing':
      case 'queued':
        return <PlayArrow sx={{ color: '#2196f3', fontSize: 20 }} />;
      case 'waiting_for_approval':
      case 'pending':
        return <HourglassEmpty sx={{ color: '#ff9800', fontSize: 20 }} />;
      default:
        return <AccessTime sx={{ color: '#9e9e9e', fontSize: 20 }} />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'success';
      case 'failed':
      case 'rejected':
        return 'error';
      case 'processing':
      case 'queued':
        return 'info';
      case 'waiting_for_approval':
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const renderVerticalTimeline = () => {
    if (!timelineData || timelineData.events.length === 0) {
      return <Typography color="text.secondary">No timeline events available</Typography>;
    }

    return (
      <Box sx={{ position: 'relative', pl: 4 }}>
        {/* Timeline line */}
        <Box
          sx={{
            position: 'absolute',
            left: 20,
            top: 0,
            bottom: 0,
            width: 2,
            bgcolor: 'divider',
          }}
        />

        <Stack spacing={2}>
          {timelineData.events.map((event, index) => {
            const eventId = `${event.event_type}_${event.job_id}_${index}`;
            const isExpanded = expandedEvents.has(eventId);
            const isJobBoundary = event.event_type === 'job_boundary';
            const isApproval = event.event_type === 'approval';
            const isStep = event.event_type === 'step';
            
            // Track current execution context for grouping
            const prevEvent = index > 0 ? timelineData.events[index - 1] : null;
            const prevContextId = prevEvent?.execution_context_id;
            const currentContextId = event.execution_context_id;
            const isNewContext = currentContextId && currentContextId !== prevContextId;
            const isNewJob = isJobBoundary || (isStep && isNewContext);

            // Get context label
            const getContextLabel = (contextId?: string) => {
              if (!contextId) return 'Initial Execution';
              const contextNum = parseInt(contextId, 10);
              if (contextNum === 0) return 'Initial Execution (Context 0)';
              return `Resume After Approval ${contextNum} (Context ${contextNum})`;
            };

            return (
              <React.Fragment key={eventId}>
                {isNewContext && (isStep || isJobBoundary) && (
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      {getContextLabel(currentContextId)}
                    </Typography>
                  </Box>
                )}
                {isNewJob && isJobBoundary && !isNewContext && (
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      {event.is_root ? 'Original Job' : `Subjob ${event.position}`}
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    position: 'relative',
                    cursor: onEventClick ? 'pointer' : 'default',
                  }}
                  onClick={() => onEventClick?.(event)}
                >
                {/* Timeline dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: -28,
                    top: 4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: isJobBoundary ? 'primary.main' : 'background.paper',
                    border: 2,
                    borderColor: isJobBoundary ? 'primary.main' : 'divider',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isApproval && (
                    <Security sx={{ fontSize: 10, color: 'primary.main' }} />
                  )}
                </Box>

                <Card
                  sx={{
                    border: isJobBoundary ? 2 : 1,
                    borderColor: isJobBoundary ? 'primary.main' : 'divider',
                    '&:hover': onEventClick
                      ? {
                          boxShadow: 3,
                        }
                      : {},
                  }}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {getStatusIcon(event.status, event.event_type)}
                      
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body2" fontWeight="medium">
                            {isJobBoundary
                              ? event.is_root
                                ? 'Original Job'
                                : `Subjob ${event.position}`
                              : isApproval
                              ? `Approval: ${event.step_name || event.agent_name}`
                              : event.step_name
                              ? `${event.step_number || ''}. ${event.step_name.replace(/_/g, ' ').toUpperCase()}`
                              : 'Event'}
                          </Typography>
                          {event.execution_context_id && (
                            <Chip
                              label={`Context ${event.execution_context_id}`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                          {isJobBoundary && event.total_jobs && (
                            <Typography variant="caption" color="text.secondary">
                              ({event.total_jobs} job{event.total_jobs !== 1 ? 's' : ''})
                            </Typography>
                          )}
                          {event.status && (
                            <Chip
                              label={event.status}
                              size="small"
                              color={getStatusColor(event.status) as any}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                          {isJobBoundary && (
                            <Chip
                              label={event.job_type || 'job'}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(event.timestamp)}
                        </Typography>
                        {event.time_since_previous && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            (+{formatDuration(event.time_since_previous)})
                          </Typography>
                        )}
                      </Box>

                      {event.execution_time && (
                        <Typography variant="caption" color="text.secondary">
                          {formatDuration(event.execution_time)}
                        </Typography>
                      )}
                    </Box>

                    {/* Additional details */}
                    {(event.execution_time || event.tokens_used || event.error_message) && (
                      <Accordion
                        expanded={isExpanded}
                        onChange={() => toggleEvent(eventId)}
                        sx={{ mt: 1, boxShadow: 'none', '&:before': { display: 'none' } }}
                      >
                        <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 32, py: 0 }}>
                          <Typography variant="caption" color="text.secondary">
                            Details
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          <Stack spacing={0.5}>
                            {event.execution_time && (
                              <Typography variant="caption" color="text.secondary">
                                Execution Time: {formatDuration(event.execution_time)}
                              </Typography>
                            )}
                            {event.tokens_used && (
                              <Typography variant="caption" color="text.secondary">
                                Tokens: {event.tokens_used.toLocaleString()}
                              </Typography>
                            )}
                            {event.error_message && (
                              <Typography variant="caption" color="error">
                                Error: {event.error_message}
                              </Typography>
                            )}
                            {event.reviewed_by && (
                              <Typography variant="caption" color="text.secondary">
                                Reviewed by: {event.reviewed_by}
                              </Typography>
                            )}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </Box>
              </React.Fragment>
            );
          })}
        </Stack>
      </Box>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading timeline...</Typography>
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

  if (!timelineData || timelineData.events.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">No timeline data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon />
            <Typography variant="h6">Pipeline Timeline</Typography>
            {timelineData.chain_length > 1 && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                {timelineData.chain_length - 1} subjob{timelineData.chain_length - 1 !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
          <Chip
            label={`${timelineData.total_events} events`}
            size="small"
            color="default"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {renderVerticalTimeline()}

        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Chain: {timelineData.chain_length} job{timelineData.chain_length !== 1 ? 's' : ''} |{' '}
            {timelineData.events.filter((e) => e.event_type === 'approval').length} approval
            {timelineData.events.filter((e) => e.event_type === 'approval').length !== 1 ? 's' : ''} |{' '}
            {timelineData.events.filter((e) => e.event_type === 'step').length} steps
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EnhancedTimeline;

