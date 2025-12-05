'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import DownloadIcon from '@mui/icons-material/Download'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { JsonDisplay } from '@/components/shared/JsonDisplay'
import { CopyButton } from '@/components/shared/CopyButton'

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
                      <CopyButton text={inputJson} label="Input" />
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(inputJson, 'input.json')}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>
                  <JsonDisplay data={input} maxHeight={500} />
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
                      <CopyButton text={outputJson} label="Output" />
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(outputJson, 'output.json')}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>
                  <JsonDisplay data={output} maxHeight={500} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Box>
            <AccordionSection title="Input (Before)" defaultExpanded={true}>
              <JsonDisplay data={input} maxHeight={300} />
            </AccordionSection>
            <AccordionSection title="Output (After)" defaultExpanded={true}>
              <JsonDisplay data={output} maxHeight={300} />
            </AccordionSection>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}


