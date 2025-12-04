'use client';

import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
} from '@mui/material';
import { ExpandMore, Code, PlayArrow, Visibility } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import type { StepInfo } from '@/types/api';

interface JobStepsListProps {
  steps: StepInfo[];
  jobId: string;
  onViewStepIO: (stepName: string) => void;
}

export function JobStepsList({ steps, jobId, onViewStepIO }: JobStepsListProps) {
  const router = useRouter();

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Code sx={{ color: '#2196f3' }} />
            <Typography variant="h6">Pipeline Steps ({steps.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {steps.map((step) => (
              <ListItem
                key={`${step.step_number}_${step.step_name}_${step.job_id || jobId}`}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {step.has_result && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PlayArrow />}
                        onClick={() => {
                          router.push(`/pipeline?jobId=${jobId}&stepName=${step.step_name}`);
                        }}
                      >
                        Use in Step
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => onViewStepIO(step.step_name)}
                    >
                      View I/O
                    </Button>
                  </Box>
                }
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: step.has_result ? 'background.paper' : 'grey.50',
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight="medium">
                      {step.step_number !== undefined ? `${step.step_number}. ` : ''}
                      {step.step_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      {step.status && (
                        <Chip
                          label={step.status}
                          size="small"
                          color={
                            step.status === 'success' || step.status === 'completed'
                              ? 'success'
                              : step.status === 'failed'
                                ? 'error'
                                : 'default'
                          }
                          sx={{ mr: 1, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      {step.execution_time !== undefined && (
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                          {step.execution_time.toFixed(2)}s
                        </Typography>
                      )}
                      {step.tokens_used !== undefined && (
                        <Typography variant="caption" color="text.secondary">
                          {step.tokens_used.toLocaleString()} tokens
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
