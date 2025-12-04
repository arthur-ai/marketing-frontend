'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PipelineFlowResponse } from '@/types/api'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import ScheduleIcon from '@mui/icons-material/Schedule'
import CodeIcon from '@mui/icons-material/Code'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs'

SyntaxHighlighter.registerLanguage('json', json)

interface PipelineFlowViewerProps {
  jobId: string
}

export function PipelineFlowViewer({ jobId }: PipelineFlowViewerProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  const { data, isLoading, error } = useQuery({
    queryKey: ['pipeline-flow', jobId],
    queryFn: async () => {
      const response = await api.getPipelineFlow(jobId)
      return response.data as PipelineFlowResponse
    },
    enabled: !!jobId,
  })

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber)
      } else {
        newSet.add(stepNumber)
      }
      return newSet
    })
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'success'
      case 'failed':
      case 'error':
        return 'error'
      case 'pending':
      case 'waiting':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return <CheckCircleIcon sx={{ fontSize: 18 }} />
      case 'failed':
      case 'error':
        return <ErrorIcon sx={{ fontSize: 18 }} />
      default:
        return <ScheduleIcon sx={{ fontSize: 18 }} />
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load pipeline flow: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    )
  }

  if (!data) {
    return <Alert severity="info">No pipeline flow data available</Alert>
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Input Section */}
      <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CodeIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Input Content
            </Typography>
          </Box>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" color="text.secondary">
                View input content
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper
                elevation={0}
                sx={{
                  bgcolor: 'grey.900',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 400,
                }}
              >
                <SyntaxHighlighter
                  language="json"
                  style={vs2015}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    background: 'transparent',
                  }}
                >
                  {JSON.stringify(data.input_content, null, 2)}
                </SyntaxHighlighter>
              </Paper>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Steps Flow */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Pipeline Steps ({data.steps.length})
        </Typography>
        {data.steps.map((step, index) => (
          <Box key={step.step_number} sx={{ mb: 2 }}>
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={`Step ${step.step_number}`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {step.step_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Typography>
                    {step.execution_metadata.status && (
                      <Chip
                        icon={getStatusIcon(step.execution_metadata.status)}
                        label={step.execution_metadata.status}
                        size="small"
                        color={getStatusColor(step.execution_metadata.status) as any}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {step.execution_metadata.execution_time && (
                      <Chip
                        icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                        label={`${step.execution_metadata.execution_time.toFixed(2)}s`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {step.execution_metadata.tokens_used && (
                      <Chip
                        label={`${step.execution_metadata.tokens_used} tokens`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>

                {/* Input Snapshot */}
                <Accordion
                  expanded={expandedSteps.has(step.step_number * 2)}
                  onChange={() => toggleStep(step.step_number * 2)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Input Snapshot
                    </Typography>
                    {step.context_keys_used.length > 0 && (
                      <Chip
                        label={`${step.context_keys_used.length} context keys`}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    )}
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: 'grey.900',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 300,
                      }}
                    >
                      <SyntaxHighlighter
                        language="json"
                        style={vs2015}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          background: 'transparent',
                        }}
                      >
                        {JSON.stringify(step.input_snapshot, null, 2)}
                      </SyntaxHighlighter>
                    </Paper>
                    {step.context_keys_used.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Context keys used: {step.context_keys_used.join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Output */}
                <Accordion
                  expanded={expandedSteps.has(step.step_number * 2 + 1)}
                  onChange={() => toggleStep(step.step_number * 2 + 1)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Output
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: 'grey.900',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 300,
                      }}
                    >
                      <SyntaxHighlighter
                        language="json"
                        style={vs2015}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          background: 'transparent',
                        }}
                      >
                        {JSON.stringify(step.output, null, 2)}
                      </SyntaxHighlighter>
                    </Paper>
                  </AccordionDetails>
                </Accordion>

                {step.execution_metadata.error_message && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {step.execution_metadata.error_message}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Arrow between steps */}
            {index < data.steps.length - 1 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  my: 1,
                }}
              >
                <ArrowForwardIcon sx={{ color: 'primary.main', fontSize: 32 }} />
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Final Output */}
      {data.final_output && Object.keys(data.final_output).length > 0 && (
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircleIcon sx={{ color: 'success.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Final Output
              </Typography>
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2" color="text.secondary">
                  View final output
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'grey.900',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 400,
                  }}
                >
                  <SyntaxHighlighter
                    language="json"
                    style={vs2015}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      background: 'transparent',
                    }}
                  >
                    {JSON.stringify(data.final_output, null, 2)}
                  </SyntaxHighlighter>
                </Paper>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Execution Summary */}
      {data.execution_summary && (
        <Card elevation={1} sx={{ mt: 3, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Execution Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {data.execution_summary.total_execution_time_seconds && (
                <Chip
                  icon={<ScheduleIcon />}
                  label={`Total Time: ${data.execution_summary.total_execution_time_seconds.toFixed(2)}s`}
                  variant="outlined"
                />
              )}
              {data.execution_summary.total_tokens_used && (
                <Chip
                  label={`Total Tokens: ${data.execution_summary.total_tokens_used}`}
                  variant="outlined"
                />
              )}
              <Chip
                label={`Total Steps: ${data.execution_summary.total_steps}`}
                variant="outlined"
              />
            </Box>
            {data.execution_summary.quality_warnings &&
              data.execution_summary.quality_warnings.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="warning">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Quality Warnings:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {data.execution_summary.quality_warnings.map((warning, idx) => (
                        <li key={idx}>
                          <Typography variant="body2">{warning}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Alert>
                </Box>
              )}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}


