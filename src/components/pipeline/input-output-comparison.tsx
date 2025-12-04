'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Chip from '@mui/material/Chip'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'

SyntaxHighlighter.registerLanguage('json', json)

interface InputOutputComparisonProps {
  input: Record<string, any>
  output: Record<string, any>
  title?: string
  showDiff?: boolean
}

export function InputOutputComparison({
  input,
  output,
  title = 'Input vs Output',
  showDiff = false,
}: InputOutputComparisonProps) {
  const [tabValue, setTabValue] = useState(0) // 0 = Side by Side, 1 = Diff

  const inputJson = JSON.stringify(input, null, 2)
  const outputJson = JSON.stringify(output, null, 2)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card elevation={2} sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareArrowsIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Side by Side" />
            <Tab label="Diff View" />
          </Tabs>
        </Box>

        {tabValue === 0 ? (
          // Side by Side View
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card elevation={1} sx={{ borderRadius: 1 }}>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                      bgcolor: 'info.50',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'info.main' }}>
                      Input
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => handleCopy(inputJson, 'Input')}
                      >
                        Copy
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(inputJson, 'input.json')}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: 'grey.900',
                      p: 2,
                      borderRadius: 0,
                      overflow: 'auto',
                      maxHeight: 500,
                    }}
                  >
                    <SyntaxHighlighter
                      language="json"
                      style={vs2015}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: '0.875rem',
                        background: 'transparent',
                      }}
                    >
                      {inputJson}
                    </SyntaxHighlighter>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={1} sx={{ borderRadius: 1 }}>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                      bgcolor: 'success.50',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                      Output
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => handleCopy(outputJson, 'Output')}
                      >
                        Copy
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(outputJson, 'output.json')}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: 'grey.900',
                      p: 2,
                      borderRadius: 0,
                      overflow: 'auto',
                      maxHeight: 500,
                    }}
                  >
                    <SyntaxHighlighter
                      language="json"
                      style={vs2015}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: '0.875rem',
                        background: 'transparent',
                      }}
                    >
                      {outputJson}
                    </SyntaxHighlighter>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          // Diff View (simplified - showing both with visual separation)
          <Box>
            <Accordion defaultExpanded={true}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Input (Before)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'grey.900',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 300,
                  }}
                >
                  <SyntaxHighlighter
                    language="json"
                    style={vs2015}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      background: 'transparent',
                    }}
                  >
                    {inputJson}
                  </SyntaxHighlighter>
                </Paper>
              </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded={true}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Output (After)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'grey.900',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 300,
                  }}
                >
                  <SyntaxHighlighter
                    language="json"
                    style={vs2015}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      background: 'transparent',
                    }}
                  >
                    {outputJson}
                  </SyntaxHighlighter>
                </Paper>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}


