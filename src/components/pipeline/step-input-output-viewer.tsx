'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import DownloadIcon from '@mui/icons-material/Download'
import CodeIcon from '@mui/icons-material/Code'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { JsonDisplay } from '@/components/shared/JsonDisplay'
import { CopyButton } from '@/components/shared/CopyButton'

interface StepInputOutputViewerProps {
  jobId: string
  stepName: string
}

export function StepInputOutputViewer({ jobId, stepName }: StepInputOutputViewerProps) {
  const [expandedInput, setExpandedInput] = useState(true)
  const [expandedOutput, setExpandedOutput] = useState(true)

  const { data, isLoading, error } = useQuery({
    queryKey: ['step-result', jobId, stepName],
    queryFn: async () => {
      const response = await api.getStepResult(jobId, stepName)
      return response.data
    },
    enabled: !!jobId && !!stepName,
  })

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
        Failed to load step data: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    )
  }

  if (!data) {
    return <Alert severity="info">No step data available</Alert>
  }

  const inputSnapshot = data.input_snapshot || {}
  const output = data.result || {}
  const contextKeysUsed = data.context_keys_used || []
  const metadata = data.metadata || {}

  const inputJson = JSON.stringify(inputSnapshot, null, 2)
  const outputJson = JSON.stringify(output, null, 2)

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Step Header */}
      <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CodeIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Step {data.step_number}: {stepName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Typography>
            {metadata.status && (
              <Chip
                label={metadata.status}
                size="small"
                color={
                  metadata.status === 'success' || metadata.status === 'completed'
                    ? 'success'
                    : metadata.status === 'failed'
                    ? 'error'
                    : 'default'
                }
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {metadata.execution_time && (
              <Chip label={`Execution Time: ${metadata.execution_time.toFixed(2)}s`} size="small" variant="outlined" />
            )}
            {metadata.tokens_used && (
              <Chip label={`Tokens: ${metadata.tokens_used}`} size="small" variant="outlined" />
            )}
            {contextKeysUsed.length > 0 && (
              <Chip label={`${contextKeysUsed.length} Context Keys`} size="small" variant="outlined" />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Input and Output Side by Side */}
      <Grid container spacing={2}>
        {/* Input Snapshot */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: 'info.50',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'info.main' }}>
                  Input Snapshot
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CopyButton text={inputJson} label="Input" />
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(inputJson, `${stepName}_input.json`)}
                  >
                    Download
                  </Button>
                </Box>
              </Box>
              <AccordionSection
                title={
                  <Typography variant="caption" color="text.secondary">
                    {expandedInput ? 'Collapse' : 'Expand'} input data
                  </Typography>
                }
                defaultExpanded={true}
                onChange={(expanded) => setExpandedInput(expanded)}
              >
                <JsonDisplay data={inputSnapshot} maxHeight={600} />
              </AccordionSection>
              {contextKeysUsed.length > 0 && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Context Keys Used:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {contextKeysUsed.map((key: string) => (
                      <Chip key={key} label={key} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Arrow */}
        <Grid size={{ xs: 12, md: 0 }} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowForwardIcon sx={{ color: 'primary.main', fontSize: 40 }} />
        </Grid>

        {/* Output */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: 'success.50',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                  Output
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CopyButton text={outputJson} label="Output" />
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(outputJson, `${stepName}_output.json`)}
                  >
                    Download
                  </Button>
                </Box>
              </Box>
              <AccordionSection
                title={
                  <Typography variant="caption" color="text.secondary">
                    {expandedOutput ? 'Collapse' : 'Expand'} output data
                  </Typography>
                }
                defaultExpanded={true}
                onChange={(expanded) => setExpandedOutput(expanded)}
              >
                <JsonDisplay data={output} maxHeight={600} />
              </AccordionSection>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Message if any */}
      {metadata.error_message && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Error:
          </Typography>
          {metadata.error_message}
        </Alert>
      )}
    </Box>
  )
}


