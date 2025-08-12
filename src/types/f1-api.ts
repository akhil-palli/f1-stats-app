/**
 * F1 API Type Definitions
 * 
 * This file contains all TypeScript interfaces for F1 data from various APIs:
 * - OpenF1 API (real-time session data)
 * - Jolpica-F1/Ergast API (historical race data, standings)
 * 
 * @fileoverview Centralized type definitions for F1 data structures
 */

// ============================================================================
// OpenF1 API Types
// ============================================================================

/**
 * Session data from OpenF1 API
 * Represents a single F1 session (Practice, Qualifying, Race, etc.)
 */
export interface Session {
  /** Unique identifier for the session */
  session_key: number;
  /** Unique identifier for the race weekend */
  meeting_key: number;
  /** Name of the session (e.g., "Practice 1", "Qualifying", "Race") */
  session_name: string;
  /** ISO 8601 start date/time of the session */
  date_start: string;
  /** Session location (city/country) */
  location: string;
  /** Country name where the session takes place */
  country_name: string;
  /** Short name of the circuit */
  circuit_short_name: string;
  /** ISO 8601 end date/time of the session */
  date_end: string;
  /** Type of session */
  session_type: string;
}

// ============================================================================
// Ergast/Jolpica-F1 API Types  
// ============================================================================

/**
 * Driver information from Ergast API
 */
export interface Driver {
  /** Unique driver identifier */
  driverId: string;
  /** Permanent racing number */
  permanentNumber: string;
  /** Three-letter driver code */
  code: string;
  /** URL to driver information */
  url: string;
  /** Driver's first name */
  givenName: string;
  /** Driver's last name */
  familyName: string;
  /** Date of birth (YYYY-MM-DD format) */
  dateOfBirth: string;
  /** Driver's nationality */
  nationality: string;
}

/**
 * Constructor/Team information from Ergast API
 */
export interface Constructor {
  /** Unique constructor identifier */
  constructorId: string;
  /** URL to constructor information */
  url: string;
  /** Full team name */
  name: string;
  /** Team's nationality */
  nationality: string;
}

/**
 * Circuit location information
 */
export interface CircuitLocation {
  /** Latitude coordinate */
  lat: string;
  /** Longitude coordinate */
  long: string;
  /** City/locality name */
  locality: string;
  /** Country name */
  country: string;
}

/**
 * Circuit information from Ergast API
 */
export interface Circuit {
  /** Unique circuit identifier */
  circuitId: string;
  /** URL to circuit information */
  url: string;
  /** Full circuit name */
  circuitName: string;
  /** Circuit location details */
  Location: CircuitLocation;
}

/**
 * Race result for individual driver
 */
export interface RaceResult {
  /** Car number */
  number: string;
  /** Final position in race */
  position: string;
  /** Position as text (handles "R" for retired, etc.) */
  positionText: string;
  /** Points awarded */
  points: string;
  /** Driver information */
  Driver: Driver;
  /** Constructor information */
  Constructor: Constructor;
  /** Starting grid position */
  grid: string;
  /** Number of laps completed */
  laps: string;
  /** Race status (e.g., "Finished", "Retired") */
  status: string;
  /** Race finish time (if applicable) */
  Time?: {
    /** Time in milliseconds */
    millis: string;
    /** Formatted time string */
    time: string;
  };
  /** Fastest lap information (if applicable) */
  FastestLap?: {
    /** Fastest lap rank */
    rank: string;
    /** Lap number */
    lap: string;
    /** Lap time */
    Time: {
      time: string;
    };
    /** Average speed during fastest lap */
    AverageSpeed: {
      units: string;
      speed: string;
    };
  };
}

/**
 * Complete race information from Ergast API
 * Used for both race calendar and race results
 */
export interface ErgastRaceResult {
  /** Season year */
  season: string;
  /** Round number in season */
  round: string;
  /** URL to race information */
  url: string;
  /** Official race name */
  raceName: string;
  /** Circuit information */
  Circuit: Circuit;
  /** Race date (YYYY-MM-DD format) */
  date: string;
  /** Race start time (optional) */
  time?: string;
  /** Race results (present only if race has finished) */
  Results?: RaceResult[];
}

/**
 * Driver championship standing
 */
export interface ErgastDriverStanding {
  /** Current championship position */
  position: string;
  /** Position as text */
  positionText: string;
  /** Total points */
  points: string;
  /** Number of wins */
  wins: string;
  /** Driver information */
  Driver: Driver;
  /** List of constructors (usually one, but drivers can change teams) */
  Constructors: Constructor[];
}

/**
 * Constructor championship standing
 */
export interface ErgastConstructorStanding {
  /** Current championship position */
  position: string;
  /** Position as text */
  positionText: string;
  /** Total points */
  points: string;
  /** Number of wins */
  wins: string;
  /** Constructor information */
  Constructor: Constructor;
}
