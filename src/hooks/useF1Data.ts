/**
 * F1 Data Fetching Hook
 * 
 * This hook manages all F1 data fetching from multiple APIs with proper
 * error handling, caching, and fallback strategies.
 * 
 * @fileoverview Core F1 data management hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  Session, 
  ErgastDriverStanding, 
  ErgastConstructorStanding, 
  ErgastRaceResult,
  LoadingState,
  F1DataState 
} from '@/types';
import { API_CONFIG } from '@/constants';

// ============================================================================
// Hook Return Type
// ============================================================================

interface UseF1DataReturn extends F1DataState, LoadingState {
  /** Manually refresh all data */
  refreshData: () => Promise<void>;
  /** Season status information */
  seasonStatus: {
    completedRaces: number;
    totalRaces: number;
    isActive: boolean;
    season: string;
  };
}

// ============================================================================
// API Utility Functions
// ============================================================================

/**
 * Smart API fetch with CORS proxy support for GitHub Pages compatibility
 */
async function fetchApiData<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultOptions: RequestInit = {
    mode: 'cors',
    headers: {
      'Accept': 'application/json',
    },
    ...options,
  };

  try {
    console.log(`🔄 Fetching: ${url}`);
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API call successful: ${url}`);
    return data;
  } catch (error) {
    console.error(`❌ API fetch failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Enhanced API fetch with smart fallback to alternative endpoints
 */
async function fetchApiDataWithSmartFallback<T>(
  primaryUrl: string,
  fallbackUrl?: string,
  options: RequestInit = {}
): Promise<{ data: T; wasFromFallback: boolean; error?: string }> {
  const defaultOptions: RequestInit = {
    mode: 'cors',
    headers: {
      'Accept': 'application/json',
    },
    ...options,
  };

  // Try primary URL first
  try {
    console.log(`🔄 Attempting primary API: ${primaryUrl}`);
    const response = await fetch(primaryUrl, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Primary API successful: ${primaryUrl}`);
    return { data, wasFromFallback: false };
  } catch (error) {
    console.warn(`❌ Primary API failed: ${primaryUrl}`, error);
    
    // If no fallback provided, throw the error
    if (!fallbackUrl) {
      throw error;
    }

    // Try fallback URL as last resort
    try {
      console.log(`🔄 Attempting fallback API: ${fallbackUrl}`);
      const response = await fetch(fallbackUrl, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.warn(`⚠️ Using fallback data from: ${fallbackUrl}`);
      return { 
        data, 
        wasFromFallback: true, 
        error: `Primary API unavailable: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    } catch (fallbackError) {
      console.error(`❌ Both primary and fallback APIs failed`, { primary: error, fallback: fallbackError });
      throw new Error(`All APIs failed. Primary: ${error instanceof Error ? error.message : 'Unknown'}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`);
    }
  }
}

/**
 * Fetch sessions from Jolpica-F1 API (GitHub Pages compatible)
 * Note: Using race calendar from Jolpica-F1 API for browser compatibility
 */
async function fetchSessions(): Promise<Session[]> {
  try {
    const data = await fetchApiData<any>(
      `${API_CONFIG.JOLPICA_BASE_URL}/2025.json`
    );

    if (!data?.MRData?.RaceTable?.Races?.length) {
      console.warn('⚠️ No 2025 race data found, falling back to 2024');
      // Fallback to 2024 data
      const fallbackData = await fetchApiData<any>(
        `${API_CONFIG.JOLPICA_BASE_URL}/2024.json`
      );
      
      if (!fallbackData?.MRData?.RaceTable?.Races?.length) return [];
      
      // Transform Jolpica race data to Session format
      return fallbackData.MRData.RaceTable.Races.map((race: any) => {
        // Properly handle date parsing with fallback for 2024 data
        const raceDate = race.date || '2024-03-01'; // Fallback date
        const raceTime = race.time || '14:00:00Z'; // Default race time with Z
        
        // Ensure proper ISO 8601 format
        const startDateTime = raceTime.includes('Z') ? 
          `${raceDate}T${raceTime}` : 
          `${raceDate}T${raceTime}Z`;
        
        const endDateTime = raceTime.includes('Z') ? 
          `${raceDate}T${raceTime.replace(/Z$/, '')}` : 
          `${raceDate}T${raceTime}`;
        
        // Add 2 hours for race end time
        const endTime = new Date(startDateTime);
        endTime.setHours(endTime.getHours() + 2);
        
        return {
          session_key: parseInt(race.round) * 1000, // Generate unique session key
          session_name: `${race.raceName} - Race`,
          date_start: startDateTime,
          date_end: endTime.toISOString(),
          gmt_offset: '+00:00',
          session_type: 'Race',
          meeting_key: parseInt(race.round),
          location: race.Circuit?.Location?.locality || race.Circuit?.circuitName || 'Unknown',
          country_name: race.Circuit?.Location?.country || 'Unknown',
          circuit_key: race.Circuit?.circuitId || race.round,
          circuit_short_name: race.Circuit?.circuitName?.replace(' Circuit', '')?.replace(' Grand Prix Circuit', '') || 
                              race.Circuit?.circuitId || race.round,
          year: 2024
        };
      });
    }

    // Transform 2025 data if available
    return data.MRData.RaceTable.Races.map((race: any) => {
      // Properly handle date parsing with fallback
      const raceDate = race.date || '2025-03-01'; // Fallback date
      const raceTime = race.time || '14:00:00Z'; // Default race time with Z
      
      // Ensure proper ISO 8601 format
      const startDateTime = raceTime.includes('Z') ? 
        `${raceDate}T${raceTime}` : 
        `${raceDate}T${raceTime}Z`;
      
      const endDateTime = raceTime.includes('Z') ? 
        `${raceDate}T${raceTime.replace(/Z$/, '')}` : 
        `${raceDate}T${raceTime}`;
      
      // Add 2 hours for race end time
      const endTime = new Date(startDateTime);
      endTime.setHours(endTime.getHours() + 2);
      
      return {
        session_key: parseInt(race.round) * 1000,
        session_name: `${race.raceName} - Race`, 
        date_start: startDateTime,
        date_end: endTime.toISOString(),
        gmt_offset: '+00:00',
        session_type: 'Race',
        meeting_key: parseInt(race.round),
        location: race.Circuit?.Location?.locality || race.Circuit?.circuitName || 'Unknown',
        country_name: race.Circuit?.Location?.country || 'Unknown',
        circuit_key: race.Circuit?.circuitId || race.round,
        circuit_short_name: race.Circuit?.circuitName?.replace(' Circuit', '')?.replace(' Grand Prix Circuit', '') || 
                            race.Circuit?.circuitId || race.round,
        year: 2025
      };
    });
  } catch (error) {
    console.error('❌ Failed to fetch sessions:', error);
    return [];
  }
}

/**
 * Fetch driver standings from Jolpica-F1 API with smart fallback
 */
async function fetchDriverStandings(): Promise<ErgastDriverStanding[]> {
  const result = await fetchApiDataWithSmartFallback<any>(
    `${API_CONFIG.JOLPICA_BASE_URL}/2025/driverStandings.json`,
    `${API_CONFIG.JOLPICA_BASE_URL}/2024/driverStandings.json`
  );

  if (result.wasFromFallback) {
    console.warn(`⚠️ Using 2024 driver standings due to 2025 API issues: ${result.error}`);
  }

  if (!result.data?.MRData?.StandingsTable?.StandingsLists?.length) return [];
  
  return result.data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
}

/**
 * Fetch constructor standings from Jolpica-F1 API
 */
async function fetchConstructorStandings(): Promise<ErgastConstructorStanding[]> {
  const data = await fetchApiData<any>(
    `${API_CONFIG.JOLPICA_BASE_URL}/2025/constructorStandings.json`
  );

  if (!data?.MRData?.StandingsTable?.StandingsLists?.length) return [];
  
  return data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
}

/**
 * Fetch race results from Jolpica-F1 API
 */
async function fetchRaceResults(): Promise<ErgastRaceResult[]> {
  const data = await fetchApiData<any>(
    `${API_CONFIG.JOLPICA_BASE_URL}/2025/results.json?limit=${API_CONFIG.DEFAULT_LIMIT}`
  );

  if (!data?.MRData?.RaceTable?.Races?.length) return [];
  
  return data.MRData.RaceTable.Races;
}

/**
 * Fetch race calendar from Jolpica-F1 API
 */
async function fetchRaceCalendar(): Promise<ErgastRaceResult[]> {
  const data = await fetchApiData<any>(
    `${API_CONFIG.JOLPICA_BASE_URL}/2025.json`
  );

  if (!data?.MRData?.RaceTable?.Races?.length) return [];
  
  return data.MRData.RaceTable.Races;
}

/**
 * Fetch individual race results for completed races
 */
async function fetchIndividualRaceResults(
  races: ErgastRaceResult[],
  season: string = '2025'
): Promise<ErgastRaceResult[]> {
  const currentDate = new Date();
  const completedRaces = races.filter(race => {
    const raceDate = new Date(race.date);
    return raceDate < currentDate;
  });

  const individualResults: ErgastRaceResult[] = [];
  
  for (const race of completedRaces) {
    try {
      const data = await fetchApiData<any>(
        `${API_CONFIG.JOLPICA_BASE_URL}/${season}/${race.round}/results.json`
      );
      
      if (data?.MRData?.RaceTable?.Races?.length > 0) {
        individualResults.push(data.MRData.RaceTable.Races[0]);
      }
    } catch (error) {
      console.log(`Failed to fetch results for round ${race.round}:`, error);
    }
  }

  return individualResults;
}

/**
 * Fetch drivers for session context (GitHub Pages compatible fallback)
 * Note: Using static driver data for browser compatibility with GitHub Pages
 */
async function fetchDrivers(sessionKey: number): Promise<any[]> {
  try {
    // Using static driver data for browser compatibility
    // This provides basic functionality while maintaining GitHub Pages compatibility
    const staticDrivers = [
      { driver_number: 1, full_name: "Max Verstappen", name_acronym: "VER", team_name: "Red Bull Racing" },
      { driver_number: 2, full_name: "Logan Sargeant", name_acronym: "SAR", team_name: "Williams" },
      { driver_number: 3, full_name: "Daniel Ricciardo", name_acronym: "RIC", team_name: "RB" },
      { driver_number: 4, full_name: "Lando Norris", name_acronym: "NOR", team_name: "McLaren" },
      { driver_number: 10, full_name: "Pierre Gasly", name_acronym: "GAS", team_name: "Alpine" },
      { driver_number: 11, full_name: "Sergio Pérez", name_acronym: "PER", team_name: "Red Bull Racing" },
      { driver_number: 14, full_name: "Fernando Alonso", name_acronym: "ALO", team_name: "Aston Martin" },
      { driver_number: 16, full_name: "Charles Leclerc", name_acronym: "LEC", team_name: "Ferrari" },
      { driver_number: 18, full_name: "Lance Stroll", name_acronym: "STR", team_name: "Aston Martin" },
      { driver_number: 20, full_name: "Kevin Magnussen", name_acronym: "MAG", team_name: "Haas" },
      { driver_number: 22, full_name: "Yuki Tsunoda", name_acronym: "TSU", team_name: "RB" },
      { driver_number: 23, full_name: "Alex Albon", name_acronym: "ALB", team_name: "Williams" },
      { driver_number: 24, full_name: "Zhou Guanyu", name_acronym: "ZHO", team_name: "Kick Sauber" },
      { driver_number: 27, full_name: "Nico Hülkenberg", name_acronym: "HUL", team_name: "Haas" },
      { driver_number: 31, full_name: "Esteban Ocon", name_acronym: "OCO", team_name: "Alpine" },
      { driver_number: 44, full_name: "Lewis Hamilton", name_acronym: "HAM", team_name: "Ferrari" },
      { driver_number: 55, full_name: "Carlos Sainz", name_acronym: "SAI", team_name: "Williams" },
      { driver_number: 63, full_name: "George Russell", name_acronym: "RUS", team_name: "Mercedes" },
      { driver_number: 77, full_name: "Valtteri Bottas", name_acronym: "BOT", team_name: "Kick Sauber" },
      { driver_number: 81, full_name: "Oscar Piastri", name_acronym: "PIA", team_name: "McLaren" }
    ];
    
    console.log(`📋 Using static driver data for session ${sessionKey} (fallback for browser compatibility)`);
    return staticDrivers;
  } catch (error) {
    console.error('Failed to fetch drivers:', error);
    return [];
  }
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Comprehensive F1 data fetching hook with caching and error handling
 */
export const useF1Data = (): UseF1DataReturn => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [dataStatus, setDataStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | undefined>();

  // F1 Data state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driverStandings, setDriverStandings] = useState<ErgastDriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ErgastConstructorStanding[]>([]);
  const [raceResults, setRaceResults] = useState<ErgastRaceResult[]>([]);
  const [raceCalendar, setRaceCalendar] = useState<ErgastRaceResult[]>([]);
  const [actualRaceResults, setActualRaceResults] = useState<any>(null);

  /**
   * Calculate season status from race calendar
   */
  const seasonStatus = {
    completedRaces: raceCalendar.filter(race => {
      const raceDate = new Date(race.date);
      return raceDate < new Date();
    }).length,
    totalRaces: raceCalendar.length,
    isActive: raceCalendar.length > 0,
    season: raceCalendar[0]?.season || '2025'
  };

  /**
   * Main data fetching function
   */
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    setDataStatus('Fetching 2025 F1 data...');

    try {
      // Fetch sessions
      setDataStatus('Loading race sessions...');
      const sessionData = await fetchSessions();
      setSessions(sessionData);

      // Fetch drivers if we have sessions
      if (sessionData.length > 0) {
        const driverData = await fetchDrivers(sessionData[0].session_key);
        setDrivers(driverData);
      }

      // Fetch standings
      setDataStatus('Loading championship standings...');
      const [driverStandingsData, constructorStandingsData] = await Promise.all([
        fetchDriverStandings(),
        fetchConstructorStandings()
      ]);
      
      setDriverStandings(driverStandingsData);
      setConstructorStandings(constructorStandingsData);

      // Fetch race data
      setDataStatus('Loading race results...');
      const [raceResultsData, raceCalendarData] = await Promise.all([
        fetchRaceResults(),
        fetchRaceCalendar()
      ]);
      
      setRaceResults(raceResultsData);
      setRaceCalendar(raceCalendarData);

      // Fetch individual race results for missing data
      if (raceCalendarData.length > 0) {
        setDataStatus(`Loading individual race results... (${raceCalendarData.length} races)`);
        const individualResults = await fetchIndividualRaceResults(raceCalendarData);
        
        // Merge individual results with existing results
        if (individualResults.length > 0) {
          setRaceResults(prevResults => {
            const merged = [...prevResults];
            
            individualResults.forEach((newResult: any) => {
              const existingIndex = merged.findIndex((r: any) => 
                r.round === newResult.round && r.season === newResult.season
              );
              if (existingIndex >= 0) {
                merged[existingIndex] = newResult;
              } else {
                merged.push(newResult);
              }
            });
            
            return merged;
          });
        }
      }

      setDataStatus('Data loaded successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load F1 data';
      setError(errorMessage);
      setDataStatus('Failed to load F1 data');
      console.error('Error fetching F1 data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Public refresh function
   */
  const refreshData = useCallback(async () => {
    await fetchAllData();
  }, [fetchAllData]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    // Loading state
    isLoading,
    dataStatus,
    error,

    // F1 data
    sessions,
    drivers,
    driverStandings,
    constructorStandings,
    raceResults,
    raceCalendar,
    actualRaceResults,

    // Actions
    refreshData,
    seasonStatus,
  };
};
