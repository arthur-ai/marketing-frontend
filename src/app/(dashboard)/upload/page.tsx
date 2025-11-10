'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import DescriptionIcon from '@mui/icons-material/Description'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import FolderIcon from '@mui/icons-material/Folder'
import SettingsIcon from '@mui/icons-material/Settings'
import { FileUpload } from '@/components/content/file-upload'

export default function UploadPage() {
  const uploadInfo = [
    {
      icon: <DescriptionIcon />,
      title: 'Supported Formats',
      items: ['JSON, Markdown, Text files', 'Word documents (.docx, .doc)', 'PDF files', 'CSV, RTF, YAML files'],
    },
    {
      icon: <FolderIcon />,
      title: 'Content Types',
      items: ['Blog Posts', 'Transcripts', 'Release Notes', 'Custom Content'],
    },
    {
      icon: <SettingsIcon />,
      title: 'Features',
      items: ['Max 25MB per file', 'Auto-processing', 'Real-time validation', 'OCR support for PDFs'],
    },
  ]

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CloudUploadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Upload Content
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Upload files or extract content from URLs to process through your marketing pipeline
        </Typography>
      </Box>

      {/* Info Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {uploadInfo.map((info, index) => (
          <Grid size={{ xs: 12, md: 4 }} key={index}>
            <Card elevation={0} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  color: 'primary.main',
                }}>
                  {info.icon}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {info.title}
                  </Typography>
                </Box>
                <List dense>
                  {info.items.map((item, itemIndex) => (
                    <ListItem key={itemIndex} sx={{ py: 0.5, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          bgcolor: 'primary.main' 
                        }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={item}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* File Upload Component */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3 }}>
        <FileUpload />
      </Paper>
    </Box>
  )
}

