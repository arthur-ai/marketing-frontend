import { useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import type { JobListItem } from '@/types/api';
import { transformJobResponseToListItem } from '@/utils/jobTransformers';
import type { JobResponse } from '@/types/results';

interface UseJobListReturn {
  jobs: JobListItem[];
  filteredJobs: JobListItem[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  contentTypes: string[];
  refetch: () => Promise<void>;
}

export function useJobList(): UseJobListReturn {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the jobs API endpoint with subjob status included
      const response = await api.listJobs(undefined, undefined, 50, true);
      const data = response.data;
      
      // Transform Job objects to JobListItem format
      const jobsList: JobListItem[] = (data.jobs || [])
        // Filter out cancelled jobs, resume_pipeline jobs, and jobs with original_job_id (subjobs)
        .filter((job: JobResponse) => 
          job.status !== 'cancelled' && 
          job.type !== 'resume_pipeline' && 
          !job.metadata?.original_job_id
        )
        .map((job: JobResponse) => transformJobResponseToListItem(job));
      
      setJobs(jobsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter jobs based on search and filters
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          job.job_id.toLowerCase().includes(query) ||
          job.content_type?.toLowerCase().includes(query) ||
          job.content_id?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Type filter
      if (filterType !== 'all' && job.content_type !== filterType) {
        return false;
      }
      
      // Status filter
      if (filterStatus !== 'all' && job.status !== filterStatus) {
        return false;
      }
      
      return true;
    });
  }, [jobs, searchQuery, filterType, filterStatus]);

  // Get unique content types for filter
  const contentTypes = useMemo(() => {
    return Array.from(new Set(jobs.map(j => j.content_type).filter(Boolean))) as string[];
  }, [jobs]);

  return {
    jobs,
    filteredJobs,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    contentTypes,
    refetch: fetchJobs,
  };
}
