'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { useState } from 'react'
import ArticleIcon from '@mui/icons-material/Article'
import SourceIcon from '@mui/icons-material/Source'
import ListAltIcon from '@mui/icons-material/ListAlt'
import { ContentList } from '@/components/content/content-list'
import { ContentSources } from '@/components/content/content-sources'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`content-tabpanel-${index}`}
      aria-labelledby={`content-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ContentPage() {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <ArticleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Content Management
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Browse, manage, and process your marketing content
        </Typography>
      </Box>

      {/* Content Area */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="content tabs">
            <Tab
              icon={<ListAltIcon />}
              iconPosition="start"
              label="Content List"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              icon={<SourceIcon />}
              iconPosition="start"
              label="Content Sources"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <ContentList sourceName="all" limit={20} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <ContentSources />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  )
}

