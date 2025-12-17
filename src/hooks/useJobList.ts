import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import type { JobListItem } from '@/types/api';

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
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
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
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the results jobs API endpoint with date filtering
      const response = await api.listResultsJobs(50, dateFrom || undefined, dateTo || undefined);
      const data = response.data;
      
      // The results endpoint returns JobListItem format directly
      const jobsList: JobListItem[] = (data.jobs || []);
      
      setJobs(jobsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

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

  // Refetch when date filters change
  useEffect(() => {
    fetchJobs();
  }, [dateFrom, dateTo, fetchJobs]);

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
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    contentTypes,
    refetch: fetchJobs,
  };
}
