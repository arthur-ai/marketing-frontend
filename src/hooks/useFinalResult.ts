import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { FinalResult } from '@/types/results';
import { normalizeResultStructure } from '@/utils/jobTransformers';

interface UseFinalResultReturn {
  finalResult: FinalResult | null;
  loading: boolean;
  fetchFinalResult: (jobId: string, onStepDataAdd?: (key: string, value: unknown) => void) => Promise<void>;
  setFinalResult: (result: FinalResult | null) => void;
}

export function useFinalResult(): UseFinalResultReturn {
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFinalResult = useCallback(async (
    jobId: string,
    onStepDataAdd?: (key: string, value: unknown) => void
  ) => {
    try {
      setLoading(true);
      const response = await api.getJobResult(jobId);
      if (response.status === 200) {
        const data = response.data;
        console.log('Final result API response:', data);
        
        // Handle nested result structure: result.pipeline_result or result.result
        let resultData = data.result;
        if (resultData) {
          resultData = normalizeResultStructure(resultData);
          
          // Extract step_results and populate stepData if callback provided
          if (resultData && typeof resultData === 'object') {
            const resultObj = resultData as Record<string, unknown>;
            if (resultObj.step_results && onStepDataAdd) {
              const stepResults = resultObj.step_results as Record<string, unknown>;
              const stepInfo = (resultObj.metadata as Record<string, unknown>)?.step_info as Array<{
                step_number?: number;
                step_name?: string;
              }> || [];
              
              stepInfo.forEach((step, idx) => {
                const stepName = step.step_name || `step_${idx}`;
                const stepResult = stepResults[stepName];
                if (stepResult) {
                  const cacheKey = `${jobId}_step_${step.step_number ?? idx}.json`;
                  onStepDataAdd(cacheKey, stepResult);
                }
              });
            }
            
            // Also include input_content from the outer result if available
            if (data.result && typeof data.result === 'object') {
              const outerResult = data.result as Record<string, unknown>;
              if (outerResult.input_content && !resultObj.input_content) {
                resultObj.input_content = outerResult.input_content;
              }
            }
          }
        }
        
        if (resultData) {
          console.log('Final result data:', resultData);
          const resultObj = resultData as Record<string, unknown>;
          console.log('Final content:', resultObj.final_content);
          setFinalResult(resultData as FinalResult);
        } else {
          console.log('No result in API response');
          setFinalResult(null);
        }
      } else if (response.status === 202) {
        // Job still processing
        console.log('Job still processing');
        setFinalResult(null);
      } else {
        // Try to get from job details
        console.log('Result API failed, trying job details endpoint');
        const jobResponse = await api.getJob(jobId);
        if (jobResponse.status === 200) {
          const jobData = jobResponse.data;
          console.log('Job details response:', jobData);
          if (jobData.job?.result) {
            // Handle nested result structure: pipeline_result or result
            let resultData = jobData.job.result;
            if (resultData) {
              resultData = normalizeResultStructure(resultData);
              
              // Extract step_results and populate stepData if callback provided
              if (resultData && typeof resultData === 'object') {
                const resultObj = resultData as Record<string, unknown>;
                if (resultObj.step_results && onStepDataAdd) {
                  const stepResults = resultObj.step_results as Record<string, unknown>;
                  const stepInfo = (resultObj.metadata as Record<string, unknown>)?.step_info as Array<{
                    step_number?: number;
                    step_name?: string;
                  }> || [];
                  
                  stepInfo.forEach((step, idx) => {
                    const stepName = step.step_name || `step_${idx}`;
                    const stepResult = stepResults[stepName];
                    if (stepResult) {
                      const cacheKey = `${jobId}_step_${step.step_number ?? idx}.json`;
                      onStepDataAdd(cacheKey, stepResult);
                    }
                  });
                }
                
                // Also include input_content from the outer result if available
                if (jobData.job.result && typeof jobData.job.result === 'object') {
                  const outerResult = jobData.job.result as Record<string, unknown>;
                  if (outerResult.input_content && !resultObj.input_content) {
                    resultObj.input_content = outerResult.input_content;
                  }
                }
              }
            }
            
            console.log('Job result from details:', resultData);
            const resultObj = resultData as Record<string, unknown>;
            console.log('Final content from details:', resultObj.final_content);
            setFinalResult(resultData as FinalResult);
          } else {
            console.log('No result in job details');
            setFinalResult(null);
          }
        } else {
          console.log('Job details API also failed');
          setFinalResult(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch final result:', err);
      setFinalResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    finalResult,
    loading,
    fetchFinalResult,
    setFinalResult,
  };
}
