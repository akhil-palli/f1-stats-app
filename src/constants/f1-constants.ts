/**
 * F1 Team Colors and Visual Constants
 * 
 * This file contains all visual constants used throughout the F1 dashboard,
 * including team colors, brand colors, and other design system constants.
 * 
 * @fileoverview F1 team colors and visual constants
 */

// ============================================================================
// F1 Team Colors (2025 Season)
// ============================================================================

/**
 * Official F1 team colors mapping for the 2025 season
 * Includes multiple name variations to handle different API responses
 * 
 * Colors are based on official team branding and liveries
 */
export const F1_TEAM_COLORS: Record<string, string> = {
  // Red Bull Racing
  "Red Bull Racing": "#3671C6",
  "Red Bull": "#3671C6",
  
  // McLaren
  "McLaren": "#FF8000", 
  "McLaren F1 Team": "#FF8000",
  
  // Ferrari
  "Ferrari": "#E8002D",
  "Scuderia Ferrari": "#E8002D",
  
  // Mercedes
  "Mercedes": "#27F4D2",
  "Mercedes-AMG Petronas F1 Team": "#27F4D2",
  
  // Aston Martin
  "Aston Martin": "#229971",
  "Aston Martin Aramco Cognizant F1 Team": "#229971",
  
  // Alpine
  "Alpine": "#0093CC",
  "Alpine F1 Team": "#0093CC",
  
  // Williams
  "Williams": "#64C4FF",
  "Williams Racing": "#64C4FF",
  
  // RB F1 Team (formerly AlphaTauri)
  "RB F1 Team": "#6692FF",
  "RB": "#6692FF",
  "VCARB": "#6692FF",
  "Visa Cash App RB F1 Team": "#6692FF",
  "AlphaTauri": "#6692FF", // Legacy name
  
  // Kick Sauber (formerly Alfa Romeo)
  "Kick Sauber": "#52E252",
  "Sauber": "#52E252",
  "Stake F1 Team Kick Sauber": "#52E252",
  "Alfa Romeo": "#52E252", // Legacy name
  
  // Haas
  "Haas F1 Team": "#B6BABD",
  "Haas": "#B6BABD",
  "MoneyGram Haas F1 Team": "#B6BABD",
  
  // Fallback for unknown teams
  "Unknown Team": "#808080"
} as const;

// ============================================================================
// UI Color Constants
// ============================================================================

/**
 * Dashboard-specific color palette
 */
export const DASHBOARD_COLORS = {
  // Status colors
  PRIMARY: "#3671C6",
  SUCCESS: "#10B981",
  WARNING: "#F59E0B", 
  ERROR: "#EF4444",
  
  // Background colors
  BACKGROUND_PRIMARY: "#1F2937",
  BACKGROUND_SECONDARY: "#374151",
  BACKGROUND_CARD: "#111827",
  
  // Text colors
  TEXT_PRIMARY: "#F9FAFB",
  TEXT_SECONDARY: "#D1D5DB",
  TEXT_MUTED: "#9CA3AF",
  
  // Border colors
  BORDER_PRIMARY: "#374151",
  BORDER_SECONDARY: "#4B5563",
  
  // Accent colors
  ACCENT_GOLD: "#F59E0B", // For winners, trophies
  ACCENT_SILVER: "#94A3B8", // For second place
  ACCENT_BRONZE: "#F97316", // For third place
} as const;

// ============================================================================
// Component Size Constants
// ============================================================================

/**
 * Consistent sizing for dashboard components
 */
export const COMPONENT_SIZES = {
  // Card padding
  CARD_PADDING_SMALL: "p-2",
  CARD_PADDING_MEDIUM: "p-4", 
  CARD_PADDING_LARGE: "p-6",
  
  // Icon sizes
  ICON_SMALL: "h-3 w-3",
  ICON_MEDIUM: "h-4 w-4",
  ICON_LARGE: "h-5 w-5",
  ICON_XLARGE: "h-6 w-6",
  
  // Text sizes
  TEXT_SMALL: "text-xs",
  TEXT_MEDIUM: "text-sm", 
  TEXT_LARGE: "text-lg",
  TEXT_XLARGE: "text-xl",
  
  // Spacing
  SPACING_SMALL: "gap-2",
  SPACING_MEDIUM: "gap-4",
  SPACING_LARGE: "gap-6",
} as const;

// ============================================================================
// API Configuration Constants
// ============================================================================

/**
 * API endpoints and configuration
 */
export const API_CONFIG = {
  // Jolpica-F1 (Ergast successor) API - supports CORS
  JOLPICA_BASE_URL: "https://api.jolpi.ca/ergast/f1",
  
  // OpenF1 API - CORS blocked for browser access from static sites
  // Note: OpenF1 doesn't support CORS headers, making it incompatible with GitHub Pages
  OPENF1_BASE_URL: "https://api.openf1.org/v1", // Reference only - not usable from browser
  
  // Request limits
  DEFAULT_LIMIT: 100,
  
  // Cache duration (in milliseconds)
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // Timeout settings
  REQUEST_TIMEOUT: 10000, // 10 seconds
} as const;

// ============================================================================
// Race Status Constants  
// ============================================================================

/**
 * Race status types and their display properties
 */
export const RACE_STATUS = {
  COMPLETED: {
    label: "Completed",
    variant: "default" as const,
    color: DASHBOARD_COLORS.SUCCESS,
  },
  UPCOMING: {
    label: "Upcoming", 
    variant: "outline" as const,
    color: DASHBOARD_COLORS.TEXT_MUTED,
  },
  IN_PROGRESS: {
    label: "Live",
    variant: "destructive" as const, 
    color: DASHBOARD_COLORS.ERROR,
  },
} as const;

// ============================================================================
// Animation Constants
// ============================================================================

/**
 * Consistent animation durations and easings
 */
export const ANIMATIONS = {
  // Duration
  FAST: "150ms",
  MEDIUM: "300ms", 
  SLOW: "500ms",
  
  // Easing
  EASE_IN_OUT: "cubic-bezier(0.4, 0, 0.2, 1)",
  EASE_OUT: "cubic-bezier(0, 0, 0.2, 1)",
  
  // Transitions
  DEFAULT_TRANSITION: "transition-colors duration-200 ease-in-out",
  HOVER_TRANSITION: "transition-all duration-150 ease-in-out",
} as const;
