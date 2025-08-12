/**
 * F1 Dashboard Component Props and State Types
 * 
 * This file contains TypeScript interfaces for React component props,
 * state management, and UI-specific types used throughout the dashboard.
 * 
 * @fileoverview Dashboard component type definitions
 */

import { 
  ErgastDriverStanding, 
  ErgastConstructorStanding, 
  ErgastRaceResult, 
  Session 
} from './f1-api';
import { ModelMetrics, QualifyingDriver, PredictionResult } from './ml-predictor';

// ============================================================================
// Component State Types
// ============================================================================

/**
 * Current page/tab selection in the dashboard
 */
export type DashboardPage = 'dashboard' | 'races' | 'analysis' | 'predictor';

/**
 * Loading and error states for async operations
 */
export interface LoadingState {
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Current loading status message */
  dataStatus: string;
  /** Error message if fetch failed */
  error?: string;
}

/**
 * F1 data state - all the data fetched from various APIs
 */
export interface F1DataState {
  /** Available F1 sessions from OpenF1 API */
  sessions: Session[];
  /** Driver information */
  drivers: any[]; // TODO: Type this properly when we extract driver data
  /** Current driver championship standings */
  driverStandings: ErgastDriverStanding[];
  /** Current constructor championship standings */
  constructorStandings: ErgastConstructorStanding[];
  /** Race results with winners */
  raceResults: ErgastRaceResult[];
  /** Complete race calendar for the season */
  raceCalendar: ErgastRaceResult[];
  /** Actual race results from OpenF1 (for selected session) */
  actualRaceResults: any; // TODO: Type this properly
}

/**
 * ML Predictor state
 */
export interface PredictorState {
  /** Current model performance metrics */
  modelMetrics: ModelMetrics;
  /** Currently selected session for prediction */
  selectedSession: Session | null;
  /** Qualifying data for current session */
  qualifyingData: QualifyingDriver[];
  /** Latest prediction results */
  predictions: PredictionResult[];
  /** Whether predictor is currently running */
  isPredicting: boolean;
  /** Predictor-specific loading state */
  predictorStatus: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for standings-related components
 */
export interface StandingsProps {
  /** Driver championship standings */
  driverStandings: ErgastDriverStanding[];
  /** Constructor championship standings */
  constructorStandings: ErgastConstructorStanding[];
  /** Whether data is currently loading */
  isLoading: boolean;
}

/**
 * Props for race calendar/results components
 */
export interface RacesProps {
  /** Complete race calendar */
  raceCalendar: ErgastRaceResult[];
  /** Race results with winners */
  raceResults: ErgastRaceResult[];
  /** Whether data is currently loading */
  isLoading: boolean;
}

/**
 * Props for individual race card component
 */
export interface RaceCardProps {
  /** Race information */
  race: ErgastRaceResult;
  /** Whether this race has happened */
  hasHappened: boolean;
  /** Whether this race has results available */
  hasResults: boolean;
  /** Winner information (if available) */
  winner?: {
    Driver: {
      givenName: string;
      familyName: string;
    };
    Constructor: {
      name: string;
    };
  };
  /** Whether to show in compact mode (for upcoming races) */
  compact?: boolean;
}

/**
 * Props for standings card component
 */
export interface StandingCardProps {
  /** Driver standing information */
  standing: ErgastDriverStanding;
  /** Position in championship */
  position: number;
  /** Whether to show detailed information */
  detailed?: boolean;
}

/**
 * Props for constructor standings card
 */
export interface ConstructorStandingCardProps {
  /** Constructor standing information */
  standing: ErgastConstructorStanding;
  /** Position in championship */
  position: number;
  /** Whether to show detailed information */
  detailed?: boolean;
}

/**
 * Props for ML predictor section
 */
export interface PredictorSectionProps {
  /** Available sessions for prediction */
  sessions: Session[];
  /** Current predictor state */
  predictorState: PredictorState;
  /** Callback when session is selected */
  onSessionSelect: (session: Session) => void;
  /** Callback to run prediction */
  onRunPrediction: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Season status calculation result
 */
export interface SeasonStatus {
  /** Number of completed races */
  completedRaces: number;
  /** Total races in season */
  totalRaces: number;
  /** Whether season is active */
  isActive: boolean;
  /** Current season year */
  season: string;
}

/**
 * Navigation tab configuration
 */
export interface TabConfig {
  /** Unique tab identifier */
  id: DashboardPage;
  /** Display label */
  label: string;
  /** Icon component or string */
  icon: string;
  /** Whether tab is currently disabled */
  disabled?: boolean;
}
