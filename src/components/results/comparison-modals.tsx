'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import type { ComparisonType } from '@/types/results';
import type { JobResults } from '@/types/results';
import type { FinalResult } from '@/types/results';
import { InputOutputComparison } from '@/components/pipeline/input-output-comparison';
import { StepInputOutputViewer } from '@/components/pipeline/step-input-output-viewer';

interface ComparisonModalsProps {
  open: boolean;
  comparisonType: ComparisonType;
  selectedStepForComparison: string | null;
  selectedJob: JobResults | null;
  finalResult: FinalResult | null;
  onClose: () => void;
  onStepClose: () => void;
}

export function ComparisonModals({
  open,
  comparisonType,
  selectedStepForComparison,
  selectedJob,
  finalResult,
  onClose,
  onStepClose,
}: ComparisonModalsProps) {
  return (
    <>
      {/* Input vs Output Comparison Modal */}
      <Dialog
        open={open && comparisonType === 'input-output'}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Compare Input vs Final Output</DialogTitle>
        <DialogContent>
          {selectedJob && (
            <InputOutputComparison
              input={
                (selectedJob.metadata.input_content as Record<string, unknown>) ||
                (finalResult?.input_content as Record<string, unknown>) ||
                {}
              }
              output={(finalResult?.final_content as Record<string, unknown>) || finalResult || {}}
              title="Input vs Final Output"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Step I/O Viewer Modal */}
      <Dialog
        open={open && comparisonType === 'step' && !!selectedStepForComparison}
        onClose={onStepClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Step Input/Output:{' '}
          {selectedStepForComparison
            ?.replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </DialogTitle>
        <DialogContent>
          {selectedJob && selectedStepForComparison && (
            <StepInputOutputViewer
              jobId={selectedJob.job_id}
              stepName={selectedStepForComparison}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onStepClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
