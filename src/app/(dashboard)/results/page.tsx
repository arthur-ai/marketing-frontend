'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useSearchParams } from 'next/navigation';
import { useResumeJob, useForceDeleteJob } from '@/hooks/useApi';
import { useJobList } from '@/hooks/useJobList';
import { useJobDetails } from '@/hooks/useJobDetails';
import { useFinalResult } from '@/hooks/useFinalResult';
import { useAuth } from '@/hooks/useAuth';
import { JobListPanel } from '@/components/results/job-list-panel';
import { JobDetailsPanel } from '@/components/results/job-details-panel';
import { ComparisonModals } from '@/components/results/comparison-modals';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

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
    filterUserId,
    setFilterUserId,
    contentTypes,
    uniqueUsers,
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

  // Force-delete job mutation (admin)
  const forceDeleteJobMutation = useForceDeleteJob();

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

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

  // Handle approval decision — auto-resume pipeline on approve, then refresh UI
  const handleDecisionMade = useCallback(
    async (decision: string) => {
      if (decision === 'approve' && selectedJob) {
        try {
          const result = await resumeJobMutation.mutateAsync(selectedJob.job_id);
          showSuccessToast(
            'Approved & Resumed',
            `Pipeline resumed from step ${result.data.resuming_from_step}.`
          );
        } catch (error) {
          showErrorToast(
            'Resume Failed',
            error instanceof Error ? error.message : 'Failed to resume pipeline'
          );
        }
      }
      // Refresh job details and list AFTER the mutation completes (not before),
      // so the UI reflects post-resume state. Also refresh on 'fail' so the job
      // list shows the updated status from the backend.
      if (selectedJob) {
        fetchJobDetails(selectedJob.job_id);
      }
      refetchJobs();
    },
    [selectedJob, fetchJobDetails, resumeJobMutation, refetchJobs]
  );

  // Admin: initiate delete confirmation
  const handleDeleteJobClick = useCallback((jobId: string) => {
    setJobToDelete(jobId);
    setDeleteDialogOpen(true);
  }, []);

  // Admin: confirm and execute delete
  const handleDeleteConfirm = useCallback(async () => {
    if (!jobToDelete) return;
    setDeleteDialogOpen(false);
    try {
      await forceDeleteJobMutation.mutateAsync(jobToDelete);
      showSuccessToast('Job Deleted', `Job ${jobToDelete.substring(0, 8)}... permanently deleted.`);
      refetchJobs();
    } catch (error) {
      showErrorToast(
        'Delete Failed',
        error instanceof Error ? error.message : 'Failed to delete job'
      );
    } finally {
      setJobToDelete(null);
    }
  }, [jobToDelete, forceDeleteJobMutation, refetchJobs]);

  // Initial fetch
  useEffect(() => {
    refetchJobs();
  }, [refetchJobs]);

  // Auto-select job from ?job=<id> query param (deep link from dashboard)
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    const jobId = searchParams.get('job');
    if (jobId && jobs.length > 0 && !deepLinkHandled.current) {
      deepLinkHandled.current = true;
      fetchJobDetails(jobId);
    }
  }, [jobs, searchParams, fetchJobDetails]);

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
            isAdmin={isAdmin}
            uniqueUsers={uniqueUsers}
            filterUserId={filterUserId}
            setFilterUserId={setFilterUserId}
            onDeleteJob={isAdmin ? handleDeleteJobClick : undefined}
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

      {/* Admin: Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Job Permanently?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Job <strong>{jobToDelete?.substring(0, 8)}...</strong> will be permanently removed from the database. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={forceDeleteJobMutation.isPending}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
