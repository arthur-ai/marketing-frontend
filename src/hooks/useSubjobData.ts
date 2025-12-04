import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { api, apiClient } from '@/lib/api';
import type { ApprovalListItem } from '@/types/api';
import type { SubjobResults } from '@/types/results';
import { normalizeResultStructure } from '@/utils/jobTransformers';

interface UseSubjobDataProps {
  subjobIds: string[] | undefined;
  enabled: boolean;
}

interface UseSubjobDataReturn {
  subjobApprovals: Record<string, ApprovalListItem[]>;
  subjobResults: SubjobResults;
}

export function useSubjobData({
  subjobIds = [],
  enabled,
}: UseSubjobDataProps): UseSubjobDataReturn {
  // Fetch approvals for all subjobs in parallel
  const subjobApprovalsQueries = useQueries({
    queries: subjobIds.map((subjobId) => ({
      queryKey: ['approvals', 'job', subjobId],
      queryFn: async () => {
        try {
          const result = await api.getJobApprovals(subjobId);
          return result ?? { approvals: [], total: 0, pending: 0 };
        } catch (err) {
          console.error(`Failed to fetch subjob approvals for ${subjobId}:`, err);
          return { approvals: [], total: 0, pending: 0 };
        }
      },
      enabled: !!subjobId && enabled,
      refetchInterval: 5000,
    })),
  });
  
  // Fetch results for all subjobs in parallel
  const subjobResultsQueries = useQueries({
    queries: subjobIds.map((subjobId) => ({
      queryKey: ['job-result', subjobId],
      queryFn: async () => {
        try {
          const response = await api.getJobResult(subjobId);
          if (response.status === 200) {
            const data = response.data;
            // Handle nested result structure: result.result
            let resultData = data.result;
            if (resultData) {
              resultData = normalizeResultStructure(resultData);
            }
            // Ensure we always return a value, not undefined
            return resultData ?? null;
          }
          return null;
        } catch (err) {
          console.error(`Failed to fetch subjob result for ${subjobId}:`, err);
          return null;
        }
      },
      enabled: !!subjobId && enabled,
      refetchInterval: 10000,
    })),
  });
  
  // Transform subjob approvals into a record for easy lookup
  const subjobApprovals = useMemo(() => {
    const approvals: Record<string, ApprovalListItem[]> = {};
    subjobIds.forEach((subjobId, index) => {
      const queryResult = subjobApprovalsQueries[index];
      if (queryResult?.data?.data?.approvals) {
        approvals[subjobId] = queryResult.data.data.approvals;
      }
    });
    return approvals;
  }, [subjobIds, subjobApprovalsQueries]);
  
  // Transform subjob results into a record for easy lookup
  const subjobResults = useMemo(() => {
    const results: SubjobResults = {};
    subjobIds.forEach((subjobId, index) => {
      const queryResult = subjobResultsQueries[index];
      if (queryResult?.data) {
        // The data might be nested in different ways depending on API response structure
        // Handle both direct result and nested result.result structures
        let resultData = queryResult.data;
        if (resultData && typeof resultData === 'object') {
          resultData = normalizeResultStructure(resultData);
          // Also handle job.result structure (from main job API)
          if (resultData && typeof resultData === 'object') {
            const resultObj = resultData as Record<string, unknown>;
            if (resultObj.job && typeof resultObj.job === 'object') {
              const jobObj = resultObj.job as Record<string, unknown>;
              if (jobObj.result) {
                resultData = normalizeResultStructure(jobObj.result);
              }
            }
          }
        }
        results[subjobId] = resultData as SubjobResults[string];
      }
    });
    return results;
  }, [subjobIds, subjobResultsQueries]);
  
  return {
    subjobApprovals,
    subjobResults,
  };
}
