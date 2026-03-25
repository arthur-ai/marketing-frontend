'use client'

import { createTheme } from '@mui/material/styles'

// Design system: Profound AI — Precision Instrument
// Warm dark mode. Amber accent. No purple. No gradients.
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E8A238',       // amber
      light: '#F0B85A',
      dark: '#C4871E',
      contrastText: '#0F0D0A',
      // Tonal variants for dark mode (replaces auto-generated light-mode values)
      50: '#1E1B15',
      100: '#2A2419',
      200: '#3A3120',
      300: '#C4871E',
    },
    secondary: {
      main: '#4A7C6F',       // aged copper teal
      light: '#5E9689',
      dark: '#38604F',
      contrastText: '#F0E8D8',
      50: '#141D1B',
      100: '#1C2B27',
    },
    success: {
      main: '#4A7C6F',
      light: '#5E9689',
      dark: '#38604F',
      50: '#141D1B',
      100: '#1C2B27',
    },
    warning: {
      main: '#D4903A',       // darker amber variant
      light: '#E8A238',
      dark: '#B07520',
      50: '#1D1913',
      100: '#2A2318',
    },
    error: {
      main: '#C45C3B',       // burnt sienna
      light: '#D4735A',
      dark: '#A4432A',
      50: '#1E1510',
      100: '#2D1E16',
    },
    info: {
      main: '#5B8DB8',       // muted steel blue — only cool hue
      light: '#7AA8CC',
      dark: '#4070A0',
      50: '#131A21',
      100: '#1A2733',
      200: '#23384A',
    },
    // Warm-dark grey scale — overrides MUI default (which keeps light-mode greys)
    grey: {
      50: '#1E1B17',
      100: '#232019',
      200: '#2A251F',
      300: '#38322A',
      400: '#4A4540',
      500: '#6B6154',
      600: '#7A7060',
      700: '#90806A',
      800: '#B0A080',
      900: '#D4C8A8',
    },
    background: {
      default: '#0F0D0A',    // warm black
      paper: '#1A1713',      // surface
    },
    text: {
      primary: '#F0E8D8',    // warm parchment
      secondary: '#6B6154',  // faded ink
      disabled: '#4A4540',
    },
    divider: '#2A251F',
  },
  typography: {
    // Geist for UI/body; Instrument Serif applied manually via className/sx for display
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
    h1: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontSize: '2.25rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontSize: '1.75rem',
      fontWeight: 400,
      lineHeight: 1.3,
    },
    h3: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontSize: '1.375rem',
      fontWeight: 400,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '0.9375rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.8125rem',
      fontWeight: 600,
      lineHeight: 1.5,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    subtitle1: {
      fontSize: '0.9375rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    subtitle2: {
      fontSize: '0.8125rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
    },
    caption: {
      fontFamily: 'var(--font-mono), monospace',
      fontSize: '0.6875rem',
      lineHeight: 1.4,
      letterSpacing: '0.02em',
    },
    overline: {
      fontFamily: 'var(--font-mono), monospace',
      fontSize: '0.6875rem',
      letterSpacing: '0.06em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 6,         // 6px — tighter than MUI default
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.3)',
    '0px 2px 6px rgba(0,0,0,0.35)',
    '0px 4px 10px rgba(0,0,0,0.4)',
    '0px 6px 14px rgba(0,0,0,0.4)',
    '0px 8px 18px rgba(0,0,0,0.42)',
    '0px 10px 22px rgba(0,0,0,0.44)',
    '0px 12px 26px rgba(0,0,0,0.46)',
    '0px 14px 30px rgba(0,0,0,0.48)',
    '0px 16px 34px rgba(0,0,0,0.5)',
    '0px 18px 38px rgba(0,0,0,0.5)',
    '0px 20px 42px rgba(0,0,0,0.5)',
    '0px 22px 46px rgba(0,0,0,0.5)',
    '0px 24px 50px rgba(0,0,0,0.5)',
    '0px 26px 54px rgba(0,0,0,0.5)',
    '0px 28px 58px rgba(0,0,0,0.5)',
    '0px 30px 62px rgba(0,0,0,0.5)',
    '0px 32px 66px rgba(0,0,0,0.5)',
    '0px 34px 70px rgba(0,0,0,0.5)',
    '0px 36px 74px rgba(0,0,0,0.5)',
    '0px 38px 78px rgba(0,0,0,0.5)',
    '0px 40px 82px rgba(0,0,0,0.5)',
    '0px 42px 86px rgba(0,0,0,0.5)',
    '0px 44px 90px rgba(0,0,0,0.5)',
    '0px 46px 94px rgba(0,0,0,0.5)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: '#E8A238',
          color: '#0F0D0A',
          '&:hover': {
            backgroundColor: '#F0B85A',
          },
        },
        outlinedPrimary: {
          borderColor: '#E8A23850',
          '&:hover': {
            borderColor: '#E8A238',
            backgroundColor: '#E8A23812',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: 'none',
          border: '1px solid #2A251F',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1A1713',
        },
        elevation1: {
          boxShadow: '0px 2px 6px rgba(0,0,0,0.35)',
          border: '1px solid #2A251F',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #2A251F',
          boxShadow: 'none',
          backgroundColor: '#1A1713',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #2A251F',
          backgroundColor: '#0F0D0A',
          color: '#F0E8D8',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          fontFamily: 'var(--font-mono), monospace',
          fontSize: '0.6875rem',
          fontWeight: 500,
          letterSpacing: '0.02em',
          height: 24,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            '& fieldset': {
              borderColor: '#2A251F',
            },
            '&:hover fieldset': {
              borderColor: '#6B6154',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#E8A238',
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#232019',
          border: '1px solid #2A251F',
          color: '#F0E8D8',
          fontSize: '0.75rem',
          borderRadius: 4,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#2A251F',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #2A251F',
          fontSize: '0.8125rem',
        },
        head: {
          color: '#6B6154',
          fontSize: '0.6875rem',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        },
      },
    },
  },
})

export default theme
