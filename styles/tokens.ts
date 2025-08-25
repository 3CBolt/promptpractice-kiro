/**
 * Design Token System for Prompt Practice App
 * 
 * Centralized design tokens for consistent styling across components.
 * Includes colors, spacing, typography, and accessibility-compliant focus rings.
 */

export const tokens = {
  // Color System
  colors: {
    // Primary brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main primary
      600: '#2563eb', // Primary hover
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Semantic colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a', // Main success
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706', // Main warning
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626', // Main error
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Neutral grays
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    
    // Background colors
    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#f3f4f6',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    // Text colors
    text: {
      primary: '#212529',
      secondary: '#495057',
      tertiary: '#6c757d',
      inverse: '#ffffff',
      muted: '#9ca3af',
    },
    
    // Border colors
    border: {
      light: '#e9ecef',
      medium: '#dee2e6',
      dark: '#ced4da',
      focus: '#80bdff',
    },
    
    // Status colors for badges and indicators
    status: {
      hosted: {
        bg: '#e3f2fd',
        text: '#1976d2',
      },
      sample: {
        bg: '#fff3e0',
        text: '#f57c00',
      },
      local: {
        bg: '#f3e5f5',
        text: '#7b1fa2',
      },
      demo: {
        bg: '#ffeaa7',
        text: '#856404',
      },
    },
  },

  // Spacing System (based on 0.25rem = 4px)
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem', // 2px
    1: '0.25rem',    // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem',     // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem',    // 12px
    3.5: '0.875rem', // 14px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    7: '1.75rem',    // 28px
    8: '2rem',       // 32px
    9: '2.25rem',    // 36px
    10: '2.5rem',    // 40px
    11: '2.75rem',   // 44px
    12: '3rem',      // 48px
    14: '3.5rem',    // 56px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    28: '7rem',      // 112px
    32: '8rem',      // 128px
  },

  // Typography System
  typography: {
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ],
      mono: [
        '"JetBrains Mono"',
        'Monaco',
        'Menlo',
        '"Ubuntu Mono"',
        'Consolas',
        'monospace',
      ],
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    lineHeight: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
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

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Box Shadow
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },

  // Focus Ring System (WCAG AA compliant)
  focus: {
    // Primary focus ring (4.5:1 contrast ratio)
    ring: {
      width: '2px',
      style: 'solid',
      color: '#2563eb',
      offset: '2px',
    },
    
    // High contrast focus ring for better visibility
    ringHighContrast: {
      width: '3px',
      style: 'solid',
      color: '#1d4ed8',
      offset: '2px',
    },
    
    // Focus ring for dark backgrounds
    ringInverse: {
      width: '2px',
      style: 'solid',
      color: '#60a5fa',
      offset: '2px',
    },
    
    // Box shadow focus rings for complex components
    boxShadow: {
      primary: '0 0 0 2px rgba(37, 99, 235, 0.5)',
      success: '0 0 0 2px rgba(22, 163, 74, 0.5)',
      warning: '0 0 0 2px rgba(217, 119, 6, 0.5)',
      error: '0 0 0 2px rgba(220, 38, 38, 0.5)',
    },
  },

  // Animation & Transitions
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1020,
    banner: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    skipLink: 1070,
    tooltip: 1080,
  },

  // Breakpoints for responsive design (mobile-first)
  breakpoints: {
    xs: '320px',   // Small phones
    sm: '480px',   // Medium phones
    md: '640px',   // Large phones / small tablets
    lg: '768px',   // Tablets
    xl: '1024px',  // Small laptops
    '2xl': '1280px', // Large laptops
    '3xl': '1536px', // Desktops
  },

  // Touch target sizes for mobile accessibility (WCAG AA compliance)
  touchTarget: {
    minimum: '44px',    // WCAG AA minimum
    comfortable: '48px', // Recommended comfortable size
    large: '56px',      // Large touch targets
    extraLarge: '64px', // Extra large for primary actions
  },

  // Mobile-specific spacing system
  mobile: {
    padding: {
      xs: '0.5rem',   // 8px - tight spacing
      sm: '0.75rem',  // 12px - compact spacing
      md: '1rem',     // 16px - standard spacing
      lg: '1.5rem',   // 24px - comfortable spacing
      xl: '2rem',     // 32px - generous spacing
    },
    margin: {
      xs: '0.5rem',   // 8px - tight margins
      sm: '0.75rem',  // 12px - compact margins
      md: '1rem',     // 16px - standard margins
      lg: '1.5rem',   // 24px - comfortable margins
      xl: '2rem',     // 32px - generous margins
    },
    fontSize: {
      xs: '0.875rem', // 14px - minimum readable on mobile
      sm: '1rem',     // 16px - base mobile size (prevents zoom on iOS)
      md: '1.125rem', // 18px - comfortable reading
      lg: '1.25rem',  // 20px - headings
      xl: '1.5rem',   // 24px - large headings
    },
    lineHeight: {
      tight: '1.2',   // Tight line height for mobile
      normal: '1.4',  // Normal line height for mobile
      relaxed: '1.6', // Relaxed line height for mobile
    },
    // Mobile-specific grid and layout
    grid: {
      columns: {
        single: '1fr',
        double: 'repeat(2, 1fr)',
        auto: 'repeat(auto-fit, minmax(280px, 1fr))',
      },
      gap: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
      },
    },
  },

  // Responsive typography scale
  responsiveTypography: {
    // Fluid typography that scales with viewport
    fluidScale: {
      xs: 'clamp(0.75rem, 2vw, 0.875rem)',   // 12-14px
      sm: 'clamp(0.875rem, 2.5vw, 1rem)',    // 14-16px
      base: 'clamp(1rem, 3vw, 1.125rem)',    // 16-18px
      lg: 'clamp(1.125rem, 3.5vw, 1.25rem)', // 18-20px
      xl: 'clamp(1.25rem, 4vw, 1.5rem)',     // 20-24px
      '2xl': 'clamp(1.5rem, 5vw, 2rem)',     // 24-32px
      '3xl': 'clamp(1.875rem, 6vw, 2.5rem)', // 30-40px
    },
  },

  // Mobile interaction states
  mobileInteraction: {
    // Tap highlight colors
    tapHighlight: {
      primary: 'rgba(37, 99, 235, 0.3)',
      success: 'rgba(22, 163, 74, 0.3)',
      warning: 'rgba(217, 119, 6, 0.3)',
      error: 'rgba(220, 38, 38, 0.3)',
      transparent: 'transparent',
    },
    // Touch feedback timing
    feedback: {
      fast: '100ms',
      normal: '150ms',
      slow: '200ms',
    },
  },
} as const;

// Type definitions for better TypeScript support
export type ColorScale = typeof tokens.colors.primary;
export type SpacingValue = keyof typeof tokens.spacing;
export type FontSize = keyof typeof tokens.typography.fontSize;
export type FontWeight = keyof typeof tokens.typography.fontWeight;

// Utility functions for working with tokens
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = tokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '#000000';
};

export const getSpacing = (value: SpacingValue): string => {
  return tokens.spacing[value];
};

export const getFocusRing = (variant: 'primary' | 'success' | 'warning' | 'error' = 'primary') => {
  return {
    outline: `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${
      variant === 'primary' ? tokens.focus.ring.color :
      variant === 'success' ? tokens.colors.success[600] :
      variant === 'warning' ? tokens.colors.warning[600] :
      tokens.colors.error[600]
    }`,
    outlineOffset: tokens.focus.ring.offset,
  };
};

export const getFocusBoxShadow = (variant: 'primary' | 'success' | 'warning' | 'error' = 'primary') => {
  return tokens.focus.boxShadow[variant];
};

// CSS Custom Properties generator for runtime theming
export const generateCSSCustomProperties = () => {
  const cssVars: Record<string, string> = {};
  
  // Generate color variables
  Object.entries(tokens.colors).forEach(([category, colors]) => {
    if (typeof colors === 'object' && colors !== null) {
      Object.entries(colors).forEach(([shade, value]) => {
        if (typeof value === 'string') {
          cssVars[`--color-${category}-${shade}`] = value;
        }
      });
    }
  });
  
  // Generate spacing variables
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });
  
  return cssVars;
};