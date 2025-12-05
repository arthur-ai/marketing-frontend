'use client'

import { Box, Typography, Chip, Stack, LinearProgress, Card, CardContent, Divider, Accordion, AccordionSummary, AccordionDetails, Tooltip, IconButton } from '@mui/material'
import { CheckCircle, Circle, Cancel, Security, AccessTime, ExpandMore, ContentCopy } from '@mui/icons-material'
import type { JobResultsSummary, ApprovalListItem } from '@/types/api'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { CopyButton } from '@/components/shared/CopyButton'

export interface SubjobStep {
  id: string
  name: string
  status: 'completed' | 'pending' | 'failed'
  timestamp?: string
  execution_time?: number
  tokens_used?: number
  job_id?: string
  error_message?: string
  execution_context_id?: string
}

interface SubjobData {
  title?: string
  input?: string | Record<string, unknown>
  output?: string | Record<string, unknown>
  step_results?: Record<string, unknown>
  final_content?: string
  metadata?: Record<string, unknown>
  input_content?: string
}

interface SubjobVisualizerProps {
  jobResults: JobResultsSummary
  approvalTimestamp?: string
  onSubjobClick?: (subjobId: string) => void
  subjobApprovals?: Record<string, ApprovalListItem[]>
  subjobResults?: Record<string, SubjobData>
}

export function SubjobVisualizer({ 
  jobResults, 
  approvalTimestamp,
  onSubjobClick,
  subjobApprovals = {},
  subjobResults = {}
}: SubjobVisualizerProps) {

  // Group steps by job_id
  const allSteps = jobResults.steps || []
  
  // Find where the approval occurred (first step with different job_id)
  const parentJobId = jobResults.parent_job_id || jobResults.job_id
  const parentSteps = allSteps.filter(s => !s.job_id || s.job_id === parentJobId)
  const resumeSteps = allSteps.filter(s => s.job_id && s.job_id !== parentJobId)
  
  // Combine steps with metadata
  const combinedSteps: SubjobStep[] = allSteps.map((step, idx) => ({
    id: step.filename || `step-${idx}`,
    name: step.step_name.replace(/_/g, ' '),
    status: step.status === 'failed' ? 'failed' : step.status === 'success' ? 'completed' : 'completed',
    timestamp: step.timestamp,
    execution_time: step.execution_time,
    tokens_used: step.tokens_used,
    job_id: step.job_id,
    error_message: step.error_message,
    execution_context_id: step.execution_context_id
  }))
  
  const approvalIndex = parentSteps.length > 0 && resumeSteps.length > 0 ? parentSteps.length : -1
  const completedCount = combinedSteps.filter(s => s.status === 'completed').length
  const progressPercentage = combinedSteps.length > 0 ? (completedCount / combinedSteps.length) * 100 : 0
  
  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Pipeline Timeline</Typography>
          {jobResults.subjobs && jobResults.subjobs.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {jobResults.subjobs.length} subjob{jobResults.subjobs.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        
        {/* Job segments info */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          {parentSteps.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary">
                Original Job ({parentSteps.length} steps)
              </Typography>
            </Box>
          )}
          {approvalIndex >= 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security sx={{ fontSize: 16, color: 'warning.main' }} />
              <Typography variant="caption" color="text.secondary">
                Approval Point
              </Typography>
            </Box>
          )}
          {resumeSteps.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
              <Typography variant="caption" color="text.secondary">
                Resume Job ({resumeSteps.length} steps)
              </Typography>
            </Box>
          )}
        </Stack>
        
        {/* Progress bar */}
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ height: 6, borderRadius: 3, mb: 3 }}
        />
      </Box>
      
      {/* Steps grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, position: 'relative' }}>
        {combinedSteps.map((step, index) => {
          const isApprovalPoint = index === approvalIndex
          const isParentStep = !step.job_id || step.job_id === parentJobId
          
          return (
            <Box 
              key={step.id} 
              sx={{ 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 120,
                p: 2,
                borderRadius: 2,
                border: 1,
                borderColor: isParentStep ? 'primary.main' : 'success.main',
                bgcolor: isParentStep ? 'primary.50' : 'success.50'
              }}
            >
              {/* Approval marker */}
              {isApprovalPoint && (
                <Box sx={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Security sx={{ fontSize: 24, color: 'warning.main', mb: 0.5 }} />
                    <Typography variant="caption" fontWeight="bold" color="warning.main">
                      Approval
                    </Typography>
                    {approvalTimestamp && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {new Date(approvalTimestamp).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              
              {/* Step indicator */}
              <Box sx={{ mb: 1 }}>
                {step.status === 'completed' && (
                  <CheckCircle 
                    sx={{ 
                      fontSize: 32, 
                      color: isParentStep ? 'primary.main' : 'success.main' 
                    }} 
                  />
                )}
                {step.status === 'failed' && (
                  <Cancel sx={{ fontSize: 32, color: 'error.main' }} />
                )}
                {step.status === 'pending' && (
                  <Circle sx={{ fontSize: 32, color: 'grey.300' }} />
                )}
              </Box>
              
              {/* Step name */}
              <Typography 
                variant="caption" 
                fontWeight="medium"
                sx={{ 
                  textAlign: 'center',
                  mb: 0.5,
                  color: step.status === 'failed' ? 'error.main' : 'text.primary'
                }}
              >
                {step.name}
              </Typography>
              
              {/* Job indicator badge */}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', mb: 0.5 }}>
                {step.job_id && step.job_id !== parentJobId && (
                  <Chip
                    label="Resume"
                    size="small"
                    color="success"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
                {step.execution_context_id && (
                  <Chip
                    label={`Context ${step.execution_context_id}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
              
              {/* Execution time */}
              {step.execution_time && step.status === 'completed' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <AccessTime sx={{ fontSize: 12, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {(step.execution_time * 1000).toFixed(0)}ms
                  </Typography>
                </Box>
              )}
              
              {/* Tokens used */}
              {step.tokens_used && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {step.tokens_used.toLocaleString()} tokens
                </Typography>
              )}
              
              {/* Error message */}
              {step.error_message && (
                <Typography 
                  variant="caption" 
                  color="error" 
                  sx={{ mt: 0.5, textAlign: 'center' }}
                  title={step.error_message}
                >
                  Error
                </Typography>
              )}
            </Box>
          )
        })}
      </Box>
      
      {/* Subjob summary - Only show for parent jobs (jobs that have subjobs, not subjobs themselves) */}
      {jobResults.subjobs && jobResults.subjobs.length > 0 && !jobResults.parent_job_id && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Subjobs ({jobResults.subjobs.length})
          </Typography>
          <Stack spacing={2}>
            {jobResults.subjobs.map((subjobId) => {
              // Get content type from parent job (subjobs have the same content type as parent)
              const contentType = jobResults.metadata?.content_type || 'resume_pipeline';
              const approvals = subjobApprovals[subjobId] || [];
              const subjobResult = subjobResults[subjobId];
              
              // Extract title from result
              const title = subjobResult?.metadata?.title ||
                          subjobResult?.step_results?.article_generation?.article_title ||
                          subjobResult?.step_results?.seo_optimization?.meta_title ||
                          `Resume Job (${contentType})`;
              
              // Extract input - try to get from root level first, then metadata
              // Input is typically the original content that was processed
              const input = subjobResult?.input_content ||
                          subjobResult?.metadata?.input_content ||
                          subjobResult?.metadata?.original_content ||
                          (subjobResult?.step_results && Object.keys(subjobResult.step_results).length > 0 ? {
                            content: 'Original content processed through pipeline',
                            step_results: Object.keys(subjobResult.step_results)
                          } : null);
              
              // Extract output - prefer final_content, then step_results
              // Check if step_results exists and has data
              const hasStepResults = subjobResult?.step_results && Object.keys(subjobResult.step_results).length > 0;
              const output = subjobResult?.final_content || 
                          (hasStepResults ? subjobResult.step_results : null) ||
                          (subjobResult?.metadata ? { metadata: subjobResult.metadata } : null);
              
              return (
                <Card 
                  key={subjobId} 
                  sx={{ 
                    cursor: onSubjobClick ? 'pointer' : 'default',
                    '&:hover': onSubjobClick ? {
                      boxShadow: 3,
                    } : {},
                  }}
                  onClick={() => onSubjobClick?.(subjobId)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                          {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {subjobId}
                        </Typography>
                      </Box>
                      {onSubjobClick && (
                        <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                          View Details →
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Input Section */}
                    {input && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" fontWeight="medium" color="text.secondary">
                            Input
                          </Typography>
                          <Tooltip title="Copy input to clipboard">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const inputString = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
                                copyToClipboard(inputString, 'Subjob Input');
                              }}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Box
                          component="pre"
                          sx={{
                            bgcolor: 'grey.50',
                            p: 1.5,
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: 200,
                            fontSize: '0.75rem',
                            mb: 2,
                            position: 'relative',
                          }}
                        >
                          {typeof input === 'string' ? input : JSON.stringify(input, null, 2)}
                        </Box>
                      </>
                    )}
                    
                    {/* Output Section */}
                    {output && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" fontWeight="medium" color="text.secondary">
                            Export
                          </Typography>
                          <CopyButton
                            text={
                              typeof output === 'string'
                                ? output
                                : subjobResult?.final_content
                                ? subjobResult.final_content
                                : JSON.stringify(output, null, 2)
                            }
                            label="Subjob Export"
                          />
                        </Box>
                        {typeof output === 'string' ? (
                          <Box
                            component="pre"
                            sx={{
                              bgcolor: 'grey.50',
                              p: 1.5,
                              borderRadius: 1,
                              overflow: 'auto',
                              maxHeight: 300,
                              fontSize: '0.875rem',
                              position: 'relative',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {output}
                          </Box>
                        ) : subjobResult?.step_results ? (
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              Step Results ({Object.keys(subjobResult.step_results).length} steps)
                            </Typography>
                            <Stack spacing={1}>
                              {Object.entries(subjobResult.step_results).map(([stepName, stepData]) => (
                                <Accordion key={stepName} sx={{ bgcolor: 'grey.50' }}>
                                  <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="caption" fontWeight="medium">
                                      {stepName.replace(/_/g, ' ').toUpperCase()}
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Box
                                      component="pre"
                                      sx={{
                                        bgcolor: 'white',
                                        p: 1,
                                        borderRadius: 1,
                                        overflow: 'auto',
                                        maxHeight: 200,
                                        fontSize: '0.7rem',
                                      }}
                                    >
                                      {JSON.stringify(stepData, null, 2)}
                                    </Box>
                                  </AccordionDetails>
                                </Accordion>
                              ))}
                            </Stack>
                            {subjobResult?.final_content && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                  Final Content
                                </Typography>
                                <Box
                                  component="pre"
                                  sx={{
                                    bgcolor: 'grey.50',
                                    p: 1.5,
                                    borderRadius: 1,
                                    overflow: 'auto',
                                    maxHeight: 300,
                                    fontSize: '0.875rem',
                                    position: 'relative',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {subjobResult.final_content}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        ) : (
                          <Box
                            component="pre"
                            sx={{
                              bgcolor: 'grey.50',
                              p: 1.5,
                              borderRadius: 1,
                              overflow: 'auto',
                              maxHeight: 300,
                              fontSize: '0.75rem',
                              position: 'relative',
                            }}
                          >
                            {JSON.stringify(output, null, 2)}
                          </Box>
                        )}
                      </>
                    )}
                    
                    {/* Approvals Section */}
                    {approvals.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Approvals ({approvals.length} total)
                        </Typography>
                        <Stack spacing={1}>
                          {approvals.map((approval) => (
                            <Box 
                              key={approval.id}
                              sx={{ 
                                p: 1, 
                                bgcolor: 'grey.50', 
                                borderRadius: 1,
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" fontWeight="medium">
                                  {approval.step_name}
                                </Typography>
                                <Chip 
                                  label={approval.status}
                                  size="small"
                                  color={
                                    approval.status === 'approved' ? 'success' :
                                    approval.status === 'pending' ? 'warning' :
                                    approval.status === 'rejected' ? 'error' :
                                    'info'
                                  }
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      </>
                    )}
                    
                    {/* Fallback: Show raw data if extraction didn't work but data exists */}
                    {!input && !output && approvals.length === 0 && subjobResult && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Raw Data
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            bgcolor: 'grey.50',
                            p: 1.5,
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: 300,
                            fontSize: '0.75rem',
                          }}
                        >
                          {JSON.stringify(subjobResult, null, 2)}
                        </Box>
                      </>
                    )}
                    
                    {/* Only show "No data available" if there's truly no data at all */}
                    {!input && !output && approvals.length === 0 && !subjobResult && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No data available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  )
}
