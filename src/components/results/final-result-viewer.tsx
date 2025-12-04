'use client';

import { useState } from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  ContentCopy,
  CompareArrows,
  Download,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import type { FinalResult } from '@/types/results';
import type { JobMetadata } from '@/types/results';
import { htmlToMarkdown } from '@/utils/contentFormatters';
import { showSuccessToast } from '@/lib/toast-utils';

interface FinalResultViewerProps {
  finalResult: FinalResult;
  contentType: string;
  jobId: string;
  onCompare?: () => void;
}

export function FinalResultViewer({
  finalResult,
  contentType,
  jobId,
  onCompare,
}: FinalResultViewerProps) {
  const [outputViewTab, setOutputViewTab] = useState(0);

  const copyToClipboard = async (text: string, label: string = 'Content') => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccessToast('Copied!', `${label} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownload = () => {
    const content =
      typeof finalResult.final_content === 'string'
        ? finalResult.final_content
        : JSON.stringify(finalResult.final_content, null, 2);
    const blob = new Blob([content], {
      type: contentType === 'blog_post' ? 'text/html' : 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `final_result_${jobId.substring(0, 8)}.${contentType === 'blog_post' ? 'html' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!finalResult?.final_content) {
    return null;
  }

  const isBlogPost = contentType === 'blog_post';
  const contentString =
    typeof finalResult.final_content === 'string'
      ? finalResult.final_content
      : JSON.stringify(finalResult.final_content, null, 2);

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <CheckCircle sx={{ color: '#4caf50' }} />
            <Typography variant="h6">Output</Typography>
            <Chip label="Completed" size="small" color="success" sx={{ ml: 'auto' }} />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 2 }}>
            <Tabs value={outputViewTab} onChange={(_, newValue) => setOutputViewTab(newValue)}>
              <Tab label="Preview" />
              <Tab label="Markdown" />
            </Tabs>
          </Box>
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              bgcolor: 'background.paper',
              maxHeight: '600px',
              overflow: 'auto',
              position: 'relative',
            }}
          >
            {outputViewTab === 0 ? (
              // Preview View
              isBlogPost ? (
                <Box
                  sx={{
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                      mt: 2,
                      mb: 1,
                      fontWeight: 'bold',
                    },
                    '& p': {
                      mb: 1.5,
                      lineHeight: 1.8,
                    },
                    '& ul, & ol': {
                      mb: 1.5,
                      pl: 3,
                    },
                    '& li': {
                      mb: 0.5,
                    },
                    '& code': {
                      bgcolor: 'grey.100',
                      px: 0.5,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: '0.875em',
                    },
                    '& pre': {
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      mb: 1.5,
                    },
                    '& blockquote': {
                      borderLeft: 3,
                      borderColor: 'primary.main',
                      pl: 2,
                      ml: 0,
                      fontStyle: 'italic',
                      color: 'text.secondary',
                    },
                  }}
                >
                  <ReactMarkdown>{htmlToMarkdown(contentString)}</ReactMarkdown>
                </Box>
              ) : (
                <Box
                  component="pre"
                  sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {contentString}
                </Box>
              )
            ) : (
              // Markdown View
              <Box
                sx={{
                  '& p': { mb: 1.5 },
                  '& h1, & h2, & h3, & h4': { mt: 2, mb: 1, fontWeight: 600 },
                  '& ul, & ol': { pl: 2, mb: 1.5 },
                  '& code': {
                    bgcolor: 'grey.200',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                  },
                  '& pre': {
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    mb: 1.5,
                    '& code': {
                      bgcolor: 'transparent',
                      color: 'inherit',
                      p: 0,
                    },
                  },
                }}
              >
                {isBlogPost ? (
                  <ReactMarkdown>{htmlToMarkdown(contentString)}</ReactMarkdown>
                ) : (
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {contentString}
                  </Box>
                )}
              </Box>
            )}
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
              <Tooltip title="Copy to clipboard">
                <IconButton
                  size="small"
                  onClick={() => {
                    const contentToCopy =
                      outputViewTab === 0
                        ? contentString
                        : isBlogPost
                          ? htmlToMarkdown(contentString)
                          : contentString;
                    copyToClipboard(contentToCopy, 'Output');
                  }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            {onCompare && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<CompareArrows />}
                onClick={onCompare}
              >
                Compare Input/Output
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownload}
            >
              Download Final Result
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
