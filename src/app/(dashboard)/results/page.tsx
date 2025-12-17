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
import { useJobApprovals, useResumeJob } from '@/hooks/useApi';
import { useJobList } from '@/hooks/useJobList';
import { useJobDetails } from '@/hooks/useJobDetails';
import { useSubjobData } from '@/hooks/useSubjobData';
import { useFinalResult } from '@/hooks/useFinalResult';
import { JobListPanel } from '@/components/results/job-list-panel';
import { JobDetailsPanel } from '@/components/results/job-details-panel';
import { ComparisonModals } from '@/components/results/comparison-modals';
import type { ComparisonType } from '@/types/results';
import type { FinalResult } from '@/types/results';
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
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    contentTypes,
    refetch: refetchJobs,
  } = useJobList();

  // Step data management (for backward compatibility - data is stored but not displayed)
  const [, setStepData] = useState<Record<string, unknown>>({});
  const addToStepData = useCallback((key: string, value: unknown) => {
    setStepData((prev) => {
      const updated = { ...prev, [key]: value };
      const keys = Object.keys(updated);
      // Limit to last 50 entries to prevent memory issues
      if (keys.length > 50) {
        const entries = Object.entries(updated);
        const recentEntries = entries.slice(-50);
        return Object.fromEntries(recentEntries);
      }
      return updated;
    });
  }, []);

  // Final result management
  const {
    finalResult,
    loading: loadingFinalResult,
    fetchFinalResult: fetchFinalResultInternal,
    setFinalResult: setFinalResultInternal,
  } = useFinalResult();

  const handleFinalResultReset = useCallback(() => {
    // This will be handled by the hook's state management
  }, []);

  const handleFinalResultFetch = useCallback(
    async (jobId: string) => {
      await fetchFinalResultInternal(jobId, addToStepData);
    },
    [fetchFinalResultInternal, addToStepData]
  );

  // Job details management
  const {
    selectedJob,
    error: jobDetailsError,
    fetchJobDetails,
    fetchSubjobDetails,
  } = useJobDetails({
    jobs,
    onFinalResultReset: handleFinalResultReset,
    onFinalResultFetch: handleFinalResultFetch,
    onStepDataAdd: addToStepData,
  });

  // Subjob data
  const { subjobApprovals, subjobResults } = useSubjobData({
    subjobIds: selectedJob?.subjobs,
    enabled: !!selectedJob && !selectedJob.parent_job_id,
  });

  // Approvals
  const { data: approvalsData } = useJobApprovals(selectedJob?.job_id || '', undefined);

  // Resume job mutation
  const resumeJobMutation = useResumeJob();

  // Comparison modal state
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonType, setComparisonType] = useState<ComparisonType>(null);
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
        // Refresh jobs list
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
    setComparisonType('step');
    setComparisonModalOpen(true);
  }, []);

  // Handle comparison
  const handleCompare = useCallback(() => {
    setComparisonType('input-output');
    setComparisonModalOpen(true);
  }, []);

  // Handle comparison modal close
  const handleComparisonClose = useCallback(() => {
    setComparisonModalOpen(false);
    setComparisonType(null);
  }, []);

  // Handle step comparison close
  const handleStepComparisonClose = useCallback(() => {
    setComparisonModalOpen(false);
    setComparisonType(null);
    setSelectedStepForComparison(null);
  }, []);

  // Handle final result update (for post editor)
  const handleFinalResultUpdate = useCallback(
    (result: FinalResult) => {
      setFinalResultInternal(result);
    },
    [setFinalResultInternal]
  );

  // Initial fetch
  useEffect(() => {
    refetchJobs();
  }, [refetchJobs]);

  if (jobsLoading && jobs.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading results...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Pipeline Results
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
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
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
              subjobApprovals={subjobApprovals}
              subjobResults={subjobResults}
              approvalsData={approvalsData}
              loadingFinalResult={loadingFinalResult}
              onNavigateToParent={handleSelectJob}
              onNavigateToSubjob={fetchSubjobDetails}
              onViewStepIO={handleViewStepIO}
              onCompare={handleCompare}
              onResumePipeline={handleResumePipeline}
              isResuming={resumeJobMutation.isPending}
              onFinalResultUpdate={handleFinalResultUpdate}
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

      {/* Comparison Modals */}
      <ComparisonModals
        open={comparisonModalOpen}
        comparisonType={comparisonType}
        selectedStepForComparison={selectedStepForComparison}
        selectedJob={selectedJob}
        finalResult={finalResult}
        onClose={handleComparisonClose}
        onStepClose={handleStepComparisonClose}
      />
    </Container>
  );
}
