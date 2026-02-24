'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useResumeJob } from '@/hooks/useApi';
import { useJobList } from '@/hooks/useJobList';
import { useJobDetails } from '@/hooks/useJobDetails';
import { useFinalResult } from '@/hooks/useFinalResult';
import { JobListPanel } from '@/components/results/job-list-panel';
import { JobDetailsPanel } from '@/components/results/job-details-panel';
import { ComparisonModals } from '@/components/results/comparison-modals';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';

export default function ResultsPage() {
  // Job list management
  const {
    jobs,
    filteredJobs,
    loading: jobsLoading,
    error: jobsError,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    contentTypes,
    refetch: refetchJobs,
  } = useJobList();

  // Final result management
  const {
    finalResult,
    loading: loadingFinalResult,
    fetchFinalResult: fetchFinalResultInternal,
  } = useFinalResult();

  const handleFinalResultFetch = useCallback(
    async (jobId: string) => {
      await fetchFinalResultInternal(jobId, () => {});
    },
    [fetchFinalResultInternal]
  );

  // Job details management
  const {
    selectedJob,
    error: jobDetailsError,
    fetchJobDetails,
    fetchSubjobDetails,
  } = useJobDetails({
    jobs,
    onFinalResultReset: () => {},
    onFinalResultFetch: handleFinalResultFetch,
    onStepDataAdd: () => {},
  });

  // Resume job mutation
  const resumeJobMutation = useResumeJob();

  // Step comparison modal state
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [selectedStepForComparison, setSelectedStepForComparison] = useState<string | null>(null);

  // Handle resume pipeline
  const handleResumePipeline = useCallback(
    async (jobId: string) => {
      try {
        const result = await resumeJobMutation.mutateAsync(jobId);
        showSuccessToast(
          'Pipeline Resumed',
          `Pipeline resumed from step ${result.data.resuming_from_step}. New job ID: ${result.data.resume_job_id.substring(0, 8)}...`
        );
        refetchJobs();
      } catch (error) {
        showErrorToast(
          'Resume Failed',
          error instanceof Error ? error.message : 'Failed to resume pipeline'
        );
      }
    },
    [resumeJobMutation, refetchJobs]
  );

  // Handle job selection
  const handleSelectJob = useCallback(
    (jobId: string) => {
      fetchJobDetails(jobId);
    },
    [fetchJobDetails]
  );

  // Handle step I/O view
  const handleViewStepIO = useCallback((stepName: string) => {
    setSelectedStepForComparison(stepName);
    setComparisonModalOpen(true);
  }, []);

  // Handle approval decision — refresh job details (re-embeds approvals) and list
  const handleDecisionMade = useCallback(() => {
    if (selectedJob) {
      fetchJobDetails(selectedJob.job_id);
    }
    refetchJobs();
  }, [selectedJob, fetchJobDetails, refetchJobs]);

  // Initial fetch
  useEffect(() => {
    refetchJobs();
  }, [refetchJobs]);

  if (jobsLoading && jobs.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading jobs...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Jobs
        </Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={refetchJobs}>
          Refresh
        </Button>
      </Box>

      {(jobsError || jobDetailsError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {jobsError || jobDetailsError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Jobs List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <JobListPanel
            jobs={jobs}
            filteredJobs={filteredJobs}
            selectedJobId={selectedJob?.job_id}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterType={filterType}
            setFilterType={setFilterType}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            contentTypes={contentTypes}
            onSelectJob={handleSelectJob}
          />
        </Grid>

        {/* Job Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          {selectedJob ? (
            <JobDetailsPanel
              selectedJob={selectedJob}
              finalResult={finalResult}
              loadingFinalResult={loadingFinalResult}
              onNavigateToParent={handleSelectJob}
              onNavigateToSubjob={fetchSubjobDetails}
              onViewStepIO={handleViewStepIO}
              onResumePipeline={handleResumePipeline}
              isResuming={resumeJobMutation.isPending}
              onDecisionMade={handleDecisionMade}
            />
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  Select a job to view details
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Step Comparison Modal */}
      <ComparisonModals
        open={comparisonModalOpen}
        comparisonType="step"
        selectedStepForComparison={selectedStepForComparison}
        selectedJob={selectedJob}
        finalResult={finalResult}
        onClose={() => { setComparisonModalOpen(false); setSelectedStepForComparison(null); }}
        onStepClose={() => { setComparisonModalOpen(false); setSelectedStepForComparison(null); }}
      />
    </Container>
  );
}
