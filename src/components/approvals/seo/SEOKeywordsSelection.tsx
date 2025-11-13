'use client'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Divider,
  Button,
  Chip,
  Alert,
} from '@mui/material'

export interface SelectedKeywords {
  main_keyword: string
  primary: string[]
  secondary: string[]
  lsi: string[]
  long_tail: string[]
}

interface SEOKeywordsSelectionProps {
  outputData: any
  selectedKeywords: SelectedKeywords
  onMainKeywordChange: (keyword: string) => void
  onKeywordToggle: (type: 'primary' | 'secondary' | 'lsi' | 'long_tail', keyword: string) => void
  onSelectAll: (type: 'primary' | 'secondary' | 'lsi' | 'long_tail') => void
  onDeselectAll: (type: 'primary' | 'secondary' | 'lsi' | 'long_tail') => void
  onPromoteToMain: (keyword: string, fromCategory: 'primary' | 'secondary' | 'lsi' | 'long_tail') => void
}

export function SEOKeywordsSelection({
  outputData,
  selectedKeywords,
  onMainKeywordChange,
  onKeywordToggle,
  onSelectAll,
  onDeselectAll,
  onPromoteToMain,
}: SEOKeywordsSelectionProps) {
  if (!outputData) {
    return null
  }

  const primaryKeywords = outputData.primary_keywords || []
  const secondaryKeywords = outputData.secondary_keywords || []
  const lsiKeywords = outputData.lsi_keywords || []
  const longTailKeywords = outputData.long_tail_keywords || []

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Select Keywords to Keep
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          <strong>Required:</strong> Select ONE main keyword that will be the primary focus. Then select any additional supporting keywords.
        </Typography>
        
        {/* Keyword Category Explanations */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Keyword Categories Explained
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
            <li>
              <Typography variant="body2" component="span" fontWeight="bold">Primary Keywords:</Typography>
              <Typography variant="body2" component="span"> Used in title, headings, and main content focus. These are your core SEO targets.</Typography>
            </li>
            <li>
              <Typography variant="body2" component="span" fontWeight="bold">Secondary Keywords:</Typography>
              <Typography variant="body2" component="span"> Supporting content, natural variations. Used throughout the article to provide context and depth.</Typography>
            </li>
            <li>
              <Typography variant="body2" component="span" fontWeight="bold">LSI Keywords:</Typography>
              <Typography variant="body2" component="span"> Semantic depth, related concepts. Help search engines understand topic context and improve relevance.</Typography>
            </li>
            <li>
              <Typography variant="body2" component="span" fontWeight="bold">Long-tail Keywords:</Typography>
              <Typography variant="body2" component="span"> Specific sections, FAQ-style content. Used in detailed explanations and answer specific user queries.</Typography>
            </li>
          </Box>
          <Typography variant="caption" display="block" sx={{ mt: 1.5, fontStyle: 'italic' }}>
            <strong>Downstream Usage:</strong> All selected keywords will be used in the article generation step to create comprehensive, SEO-optimized content. The main keyword will be emphasized in the title and headings, while other categories will be naturally integrated throughout the content.
          </Typography>
        </Alert>

        <Stack spacing={3}>
          {/* Main Keyword Selection (Required) */}
          {primaryKeywords.length > 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  Select Main Keyword (Required)
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Choose the single most important keyword that will be the primary focus for this content.
                </Typography>
              </Alert>
              <FormControl component="fieldset" required fullWidth>
                <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Main Keyword
                </FormLabel>
                <RadioGroup
                  value={selectedKeywords.main_keyword}
                  onChange={(e) => onMainKeywordChange(e.target.value)}
                >
                  {primaryKeywords.map((keyword: string) => {
                    const keywordDensity = outputData.keyword_density?.[keyword]
                    const isAISuggested = outputData.main_keyword === keyword
                    return (
                      <FormControlLabel
                        key={keyword}
                        value={keyword}
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">{keyword}</Typography>
                            {isAISuggested && (
                              <Chip
                                label="AI Suggested"
                                size="small"
                                color="primary"
                                sx={{ height: 20 }}
                              />
                            )}
                            {keywordDensity !== null && keywordDensity !== undefined && (
                              <Chip
                                label={`${keywordDensity.toFixed(1)}% density`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20 }}
                              />
                            )}
                          </Box>
                        }
                      />
                    )
                  })}
                </RadioGroup>
              </FormControl>
              {!selectedKeywords.main_keyword && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  Please select a main keyword to continue.
                </Typography>
              )}
            </Box>
          )}

          {/* Supporting Primary Keywords */}
          {primaryKeywords.length > 0 && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Additional Primary Keywords (Optional)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    label={`${selectedKeywords.primary.length} of ${primaryKeywords.length}`}
                    size="small"
                    color="primary"
                  />
                  <Button size="small" onClick={() => onSelectAll('primary')}>
                    Select All
                  </Button>
                  <Button size="small" onClick={() => onDeselectAll('primary')}>
                    Deselect All
                  </Button>
                </Box>
              </Box>
              <FormGroup>
                {primaryKeywords.map((keyword: string) => (
                  <FormControlLabel
                    key={keyword}
                    control={
                      <Checkbox
                        checked={selectedKeywords.primary.includes(keyword)}
                        onChange={() => onKeywordToggle('primary', keyword)}
                        disabled={keyword === selectedKeywords.main_keyword}
                      />
                    }
                    label={keyword}
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {/* Secondary Keywords */}
          {secondaryKeywords.length > 0 && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Secondary Keywords
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    label={`${selectedKeywords.secondary.length} of ${secondaryKeywords.length}`}
                    size="small"
                    color="secondary"
                  />
                  <Button size="small" onClick={() => onSelectAll('secondary')}>
                    Select All
                  </Button>
                  <Button size="small" onClick={() => onDeselectAll('secondary')}>
                    Deselect All
                  </Button>
                </Box>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="caption">
                  <strong>Usage:</strong> Supporting content, natural variations. Used throughout the article to provide context and depth.
                </Typography>
              </Alert>
              <FormGroup>
                {secondaryKeywords.map((keyword: string) => (
                  <FormControlLabel
                    key={keyword}
                    control={
                      <Checkbox
                        checked={selectedKeywords.secondary.includes(keyword)}
                        onChange={() => onKeywordToggle('secondary', keyword)}
                        disabled={keyword === selectedKeywords.main_keyword}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="body2">{keyword}</Typography>
                        {keyword === selectedKeywords.main_keyword && (
                          <Chip label="Main" size="small" color="primary" sx={{ height: 20 }} />
                        )}
                        {keyword !== selectedKeywords.main_keyword && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation()
                              onPromoteToMain(keyword, 'secondary')
                            }}
                            sx={{ ml: 'auto', height: 24, fontSize: '0.7rem' }}
                          >
                            Promote to Main
                          </Button>
                        )}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {/* LSI Keywords */}
          {lsiKeywords.length > 0 && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  LSI Keywords
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    label={`${selectedKeywords.lsi.length} of ${lsiKeywords.length}`}
                    size="small"
                    color="info"
                  />
                  <Button size="small" onClick={() => onSelectAll('lsi')}>
                    Select All
                  </Button>
                  <Button size="small" onClick={() => onDeselectAll('lsi')}>
                    Deselect All
                  </Button>
                </Box>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="caption">
                  <strong>Usage:</strong> Semantic depth, related concepts. Help search engines understand topic context and improve relevance.
                </Typography>
              </Alert>
              <FormGroup>
                {lsiKeywords.map((keyword: string) => (
                  <FormControlLabel
                    key={keyword}
                    control={
                      <Checkbox
                        checked={selectedKeywords.lsi.includes(keyword)}
                        onChange={() => onKeywordToggle('lsi', keyword)}
                        disabled={keyword === selectedKeywords.main_keyword}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="body2">{keyword}</Typography>
                        {keyword === selectedKeywords.main_keyword && (
                          <Chip label="Main" size="small" color="primary" sx={{ height: 20 }} />
                        )}
                        {keyword !== selectedKeywords.main_keyword && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation()
                              onPromoteToMain(keyword, 'lsi')
                            }}
                            sx={{ ml: 'auto', height: 24, fontSize: '0.7rem' }}
                          >
                            Promote to Main
                          </Button>
                        )}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {/* Long-tail Keywords */}
          {longTailKeywords.length > 0 && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Long-tail Keywords
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    label={`${selectedKeywords.long_tail.length} of ${longTailKeywords.length}`}
                    size="small"
                    color="success"
                  />
                  <Button size="small" onClick={() => onSelectAll('long_tail')}>
                    Select All
                  </Button>
                  <Button size="small" onClick={() => onDeselectAll('long_tail')}>
                    Deselect All
                  </Button>
                </Box>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="caption">
                  <strong>Usage:</strong> Specific sections, FAQ-style content. Used in detailed explanations and answer specific user queries.
                </Typography>
              </Alert>
              <FormGroup>
                {longTailKeywords.map((keyword: string) => (
                  <FormControlLabel
                    key={keyword}
                    control={
                      <Checkbox
                        checked={selectedKeywords.long_tail.includes(keyword)}
                        onChange={() => onKeywordToggle('long_tail', keyword)}
                        disabled={keyword === selectedKeywords.main_keyword}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="body2">{keyword}</Typography>
                        {keyword === selectedKeywords.main_keyword && (
                          <Chip label="Main" size="small" color="primary" sx={{ height: 20 }} />
                        )}
                        {keyword !== selectedKeywords.main_keyword && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation()
                              onPromoteToMain(keyword, 'long_tail')
                            }}
                            sx={{ ml: 'auto', height: 24, fontSize: '0.7rem' }}
                          >
                            Promote to Main
                          </Button>
                        )}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {/* Summary */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Main Keyword:</strong> {selectedKeywords.main_keyword || 'Not selected'}
            </Typography>
            <Typography variant="body2">
              <strong>Total Supporting Keywords Selected:</strong>{' '}
              {selectedKeywords.primary.length + selectedKeywords.secondary.length + selectedKeywords.lsi.length + selectedKeywords.long_tail.length} keyword(s)
            </Typography>
            {!selectedKeywords.main_keyword && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                Error: Main keyword is required. Please select a main keyword above.
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

