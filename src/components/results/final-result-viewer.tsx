'use client'

import { useState } from 'react'
import { Box, Typography, Chip, Tabs, Tab, Button } from '@mui/material'
import { CheckCircle, CompareArrows, Download } from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import type { FinalResult } from '@/types/results'
import { htmlToMarkdown } from '@/utils/contentFormatters'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { CopyButton } from '@/components/shared/CopyButton'

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
  const [outputViewTab, setOutputViewTab] = useState(0)

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
      <AccordionSection
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <CheckCircle sx={{ color: '#4caf50' }} />
            <Typography variant="h6">Output</Typography>
            <Chip label="Completed" size="small" color="success" sx={{ ml: 'auto' }} />
          </Box>
        }
        defaultExpanded={false}
      >
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
              <CopyButton
                text={
                  outputViewTab === 0
                    ? contentString
                    : isBlogPost
                    ? htmlToMarkdown(contentString)
                    : contentString
                }
                label="Output"
              />
            </Box>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            {onCompare && (
              <Button size="small" variant="outlined" startIcon={<CompareArrows />} onClick={onCompare}>
                Compare Input/Output
              </Button>
            )}
            <Button size="small" variant="outlined" startIcon={<Download />} onClick={handleDownload}>
              Download Final Result
            </Button>
          </Box>
      </AccordionSection>
    </Box>
  )
}
