// Design System Configuration for Streviz
// This file contains the design tokens and configuration for the professional broadcast theme

export const designSystem = {
  // Color palette
  colors: {
    // Primary brand colors
    primary: {
      50: '#E6F2FF',
      100: '#BAE0FF',
      200: '#7EC5FF',
      300: '#42A7FF',
      400: '#0066FF',  // Main primary color
      500: '#0052CC',
      600: '#0041A8',
      700: '#003387',
      800: '#002766',
      900: '#001D4D',
    },

    // Status colors
    success: {
      50: '#D1FAE5',
      100: '#A7F3D0',
      200: '#6EE7B7',
      300: '#34D399',
      400: '#10B981',  // Main success color
      500: '#059669',
      600: '#047857',
      700: '#065F46',
      800: '#064E3B',
      900: '#022C22',
    },

    warning: {
      50: '#FEF3C7',
      100: '#FDE68A',
      200: '#FCD34D',
      300: '#FBBF24',
      400: '#F59E0B',  // Main warning color
      500: '#D97706',
      600: '#B45309',
      700: '#92400E',
      800: '#78350F',
      900: '#451A03',
    },

    error: {
      50: '#FEE2E2',
      100: '#FECACA',
      200: '#FCA5A5',
      300: '#F87171',
      400: '#EF4444',  // Main error color
      500: '#DC2626',
      600: '#B91C1C',
      700: '#991B1B',
      800: '#7F1D1D',
      900: '#450A0A',
    },

    // Neutral colors (dark theme optimized)
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      850: '#1A202C',
      900: '#0A0A0A',  // Main background color
      950: '#030712',
    },

    // Glass surface variants
    surface: {
      '01': 'rgba(255, 255, 255, 0.05)',  // Lightest glass
      '02': 'rgba(255, 255, 255, 0.05)',  // Default glass (updated to match Tailwind)
      '03': 'rgba(255, 255, 255, 0.15)',  // Medium glass (updated to match Tailwind)
      '04': 'rgba(255, 255, 255, 0.15)',  // Heavy glass (updated to match Tailwind)
    },
  },

  // Typography scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // Spacing system
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    // Custom glass shadows
    glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
    'glass-lg': '0 16px 64px 0 rgba(0, 0, 0, 0.45)',
  },

  // Animation durations
  transitionDuration: {
    DEFAULT: '150ms',
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },

  // Animation timing functions
  transitionTimingFunction: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

// Export design tokens for easy access
export const { colors, typography, spacing, borderRadius, shadows, transitionDuration, transitionTimingFunction } = designSystem