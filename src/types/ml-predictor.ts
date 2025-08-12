/**
 * ML Predictor Type Definitions
 * 
 * This file contains TypeScript interfaces for the F1 Machine Learning
 * predictor system, including model metrics, predictions, and qualifying data.
 * 
 * @fileoverview ML predictor type definitions
 */

// ============================================================================
// ML Model Types
// ============================================================================

/**
 * Machine learning model performance metrics
 * Used to display model accuracy and reliability statistics
 */
export interface ModelMetrics {
  /** Percentage of predictions within 1 position of actual result */
  accuracy_within_1: number;
  /** Percentage of predictions within 2 positions of actual result */
  accuracy_within_2: number;
  /** Percentage of predictions within 3 positions of actual result */
  accuracy_within_3: number;
  /** Average absolute error in position prediction */
  mean_absolute_error: number;
  /** R-squared score (coefficient of determination) */
  r2_score: number;
  /** Correlation coefficient between predicted and actual positions */
  correlation: number;
}

/**
 * Individual race position prediction result
 */
export interface PredictionResult {
  /** Full driver name */
  driver_name: string;
  /** Constructor/team name */
  constructor: string;
  /** Starting position from qualifying */
  qualifying_position: number;
  /** Predicted final race position (decimal) */
  predicted_position: number;
  /** Predicted final race position (rounded integer) */
  predicted_position_int: number;
  /** Confidence level of prediction (High/Medium/Low) */
  confidence: string;
}

/**
 * Data source type for qualifying information
 */
export type QualifyingDataSource = 'real_qualifying' | 'starting_grid' | 'mock';

/**
 * Qualifying driver data used for ML predictions
 * Can come from real qualifying results, starting grid, or mock data
 */
export interface QualifyingDriver {
  /** Full driver name */
  driver_name: string;
  /** Constructor/team name */
  constructor: string;
  /** Final qualifying position */
  qualifying_position: number;
  /** Grid position (may differ from qualifying due to penalties) */
  grid_position?: number;
  /** OpenF1 session key for data traceability */
  session_key?: number;
  /** Circuit name where qualifying took place */
  circuit?: string;
  /** Driver's car number */
  driver_number?: number;
  /** Fastest lap time in qualifying (optional) */
  fastest_lap?: number;
  /** Whether this is fallback/mock data */
  fallback?: boolean;
  /** Source of the qualifying data */
  data_source?: QualifyingDataSource;
}

// ============================================================================
// ML API Response Types
// ============================================================================

/**
 * Response from ML prediction API for single race prediction
 */
export interface PredictionResponse {
  /** Array of individual driver predictions */
  predictions: PredictionResult[];
  /** Model performance metrics */
  model_metrics: ModelMetrics;
  /** Circuit name for the prediction */
  circuit: string;
  /** Session information */
  session_info?: {
    session_key: number;
    location: string;
    date: string;
  };
}

/**
 * Response from batch ML prediction API
 */
export interface BatchPredictionResponse {
  /** Predictions organized by session/race */
  predictions: Record<string, PredictionResult[]>;
  /** Overall model metrics */
  model_metrics: ModelMetrics;
  /** Number of races predicted */
  races_predicted: number;
}
