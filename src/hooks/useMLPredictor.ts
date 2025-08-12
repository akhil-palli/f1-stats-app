/**
 * ML Predictor Hook
 * 
 * This hook manages all ML prediction functionality including qualifying data
 * fetching, prediction execution, and state management.
 * 
 * @fileoverview ML predictor data management hook
 */

import { useState, useCallback } from 'react';
import type { 
  Session, 
  ModelMetrics, 
  QualifyingDriver, 
  PredictionResult,
  PredictorState,
  ErgastDriverStanding,
  ErgastRaceResult
} from '@/types';
import { API_CONFIG } from '@/constants';
import { makeSecurePrediction, makeBatchPredictions } from '@/utils/secureApiClient';

// Import the API client types
interface DriverData {
  driver_name: string;
  constructor: string;
  circuit: string;
  qualifying_position: number;
  championship_position?: number;
  cumulative_points?: number;
  driver_avg_finish_3?: number;
  driver_avg_quali_3?: number;
  constructor_avg_finish_3?: number;
  driver_dnf_rate?: number;
}

interface APIPredictionResult {
  driver_name: string;
  predicted_position: number;
  confidence_interval?: [number, number];
  status: string;
}

// ============================================================================
// Hook Parameters and Return Type
// ============================================================================

interface UseMLPredictorParams {
  driverStandings: ErgastDriverStanding[];
  raceResults: ErgastRaceResult[];
}

interface UseMLPredictorReturn extends PredictorState {
  /** Select a session for prediction */
  selectSession: (session: Session) => Promise<void>;
  /** Run prediction for selected session */
  runPrediction: () => Promise<void>;
  /** Run batch predictions for multiple sessions */
  runBatchPredictions: (sessions: Session[]) => Promise<void>;
  /** Clear current predictions */
  clearPredictions: () => void;
  /** Reset predictor state */
  resetPredictor: () => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Fetch qualifying data for a specific session from Jolpica-F1 API
 */
async function fetchQualifyingDataForSession(session: Session): Promise<QualifyingDriver[]> {
  if (!session) return [];

  try {
    console.log('🏁 Fetching qualifying data from Jolpica-F1 for:', session.location);
    
    // Get qualifying results from Jolpica API using round number
    const round = session.meeting_key || session.session_key.toString().slice(0, -3); // Extract round from session_key
    const qualifyingResponse = await fetch(
      `${API_CONFIG.JOLPICA_BASE_URL}/2025/${round}/qualifying.json`,
      {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!qualifyingResponse.ok) {
      console.warn('⚠️ No qualifying data found - using mock data for predictions');
      return generateMockQualifyingData(session);
    }

    const qualifyingData = await qualifyingResponse.json();
    
    if (!qualifyingData?.MRData?.RaceTable?.Races?.length || 
        !qualifyingData.MRData.RaceTable.Races[0]?.QualifyingResults?.length) {
      console.warn('⚠️ No qualifying results in response - using mock data');
      return generateMockQualifyingData(session);
    }

    const qualifyingResults = qualifyingData.MRData.RaceTable.Races[0].QualifyingResults;
    
    // Transform Jolpica qualifying data to our format
    return qualifyingResults.map((result: any, index: number) => ({
      driver_number: parseInt(result.Driver.permanentNumber) || (index + 1),
      driver_name: `${result.Driver.givenName} ${result.Driver.familyName}`,
      team_name: result.Constructor.name,
      qualifying_position: parseInt(result.position),
      grid_position: parseInt(result.position), // Assuming no grid penalties
      q1_time: result.Q1 || null,
      q2_time: result.Q2 || null,
      q3_time: result.Q3 || null,
      session_key: session.session_key,
      meeting_key: session.meeting_key
    }));

  } catch (error) {
    console.error('Error fetching qualifying data:', error);
    return generateMockQualifyingData(session);
  }
}

/**
 * Fetch starting grid data as fallback (GitHub Pages compatible)
 */
async function fetchStartingGridData(session: Session): Promise<QualifyingDriver[]> {
  try {
    console.log('📍 Using race starting grid from Jolpica-F1 for:', session.location);
    
    // Get race results which include grid positions
    const round = session.meeting_key || session.session_key.toString().slice(0, -3);
    const raceResponse = await fetch(
      `${API_CONFIG.JOLPICA_BASE_URL}/2025/${round}/results.json`,
      {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!raceResponse.ok) {
      return generateMockQualifyingData(session);
    }

    const raceData = await raceResponse.json();
    
    if (!raceData?.MRData?.RaceTable?.Races?.length || 
        !raceData.MRData.RaceTable.Races[0]?.Results?.length) {
      return generateMockQualifyingData(session);
    }

    const results = raceData.MRData.RaceTable.Races[0].Results;
    
    // Transform race results to get grid positions
    return results.map((result: any, index: number) => ({
      driver_number: parseInt(result.Driver.permanentNumber) || (index + 1),
      driver_name: `${result.Driver.givenName} ${result.Driver.familyName}`,
      team_name: result.Constructor.name,
      qualifying_position: parseInt(result.grid) || (index + 1), // Grid position from race results
      grid_position: parseInt(result.grid) || (index + 1),
      q1_time: null,
      q2_time: null,
      q3_time: null,
      session_key: session.session_key,
      meeting_key: session.meeting_key
    }));

  } catch (error) {
    console.error('Error fetching starting grid:', error);
    return generateMockQualifyingData(session);
  }
}

/**
 * Generate mock qualifying data when API data is unavailable
 */
function generateMockQualifyingData(session: Session): QualifyingDriver[] {
  console.log('🎭 Generating mock qualifying data for:', session.location);
  
  const mockDrivers = [
    { name: 'Max Verstappen', team: 'Red Bull Racing' },
    { name: 'Lando Norris', team: 'McLaren' },
    { name: 'Charles Leclerc', team: 'Ferrari' },
    { name: 'Oscar Piastri', team: 'McLaren' },
    { name: 'Carlos Sainz', team: 'Ferrari' },
    { name: 'Lewis Hamilton', team: 'Mercedes' },
    { name: 'George Russell', team: 'Mercedes' },
    { name: 'Fernando Alonso', team: 'Aston Martin' },
    { name: 'Lance Stroll', team: 'Aston Martin' },
    { name: 'Pierre Gasly', team: 'Alpine' }
  ];

  return mockDrivers.map((driver, index) => ({
    driver_name: driver.name,
    constructor: driver.team,
    qualifying_position: index + 1,
    grid_position: index + 1,
    session_key: session.session_key,
    circuit: session.circuit_short_name,
    data_source: 'mock' as const,
    fallback: true
  }));
}

// ============================================================================
// Metric Calculation Functions
// ============================================================================

/**
 * Calculate real performance metrics for a driver using historical data
 */
function calculateDriverMetrics(
  driverName: string, 
  driverStandings: ErgastDriverStanding[], 
  raceResults: ErgastRaceResult[]
) {
  // Get driver's championship standing
  const driverStanding = driverStandings.find(standing => {
    const standingName = `${standing.Driver?.givenName || ''} ${standing.Driver?.familyName || ''}`.trim();
    return standingName && driverName && 
           standingName.toUpperCase() === driverName.toUpperCase();
  });
  
  // Get driver's recent race results (last 3 races)
  const driverRaceResults: number[] = [];
  const driverQualiResults: number[] = [];
  let dnfCount = 0;
  let totalRaces = 0;
  
  // Look through race results to find this driver's performance
  raceResults.forEach(race => {
    if (race.Results) {
      const driverResult = race.Results.find(result => {
        const resultName = `${result.Driver?.givenName || ''} ${result.Driver?.familyName || ''}`.trim();
        return resultName && driverName && 
               resultName.toUpperCase() === driverName.toUpperCase();
      });
      
      if (driverResult) {
        totalRaces++;
        
        // Race finish position
        if (driverResult.positionText !== 'R' && driverResult.positionText !== 'D' && 
            driverResult.positionText !== 'E' && driverResult.positionText !== 'W') {
          const finishPos = parseInt(driverResult.position);
          if (!isNaN(finishPos)) {
            driverRaceResults.push(finishPos);
          }
        } else {
          dnfCount++;
        }
        
        // Grid position (qualifying result)
        const gridPos = parseInt(driverResult.grid);
        if (!isNaN(gridPos) && gridPos > 0) {
          driverQualiResults.push(gridPos);
        }
      }
    }
  });
  
  // Calculate averages for last 3 races
  const recentRaceResults = driverRaceResults.slice(-3);
  const recentQualiResults = driverQualiResults.slice(-3);
  
  const avgFinish = recentRaceResults.length > 0 
    ? recentRaceResults.reduce((a, b) => a + b, 0) / recentRaceResults.length 
    : 12.0;
    
  const avgQuali = recentQualiResults.length > 0 
    ? recentQualiResults.reduce((a, b) => a + b, 0) / recentQualiResults.length 
    : 12.0;
  
  const dnfRate = totalRaces > 0 ? dnfCount / totalRaces : 0.15;
  
  return {
    championship_position: driverStanding ? Number(driverStanding.position) : 15,
    cumulative_points: driverStanding ? Number(driverStanding.points) : 0,
    driver_avg_finish_3: Number(avgFinish),
    driver_avg_quali_3: Number(avgQuali),
    driver_dnf_rate: Number(dnfRate),
    totalRaces,
    recentRaces: recentRaceResults.length
  };
}

/**
 * Calculate constructor performance metrics using historical data
 */
function calculateConstructorMetrics(
  constructorName: string, 
  raceResults: ErgastRaceResult[]
) {
  const constructorResults: number[] = [];
  
  // Look through race results to find constructor's performance
  raceResults.forEach(race => {
    if (race.Results) {
      race.Results.forEach(result => {
        // Add null checks before calling toLowerCase()
        const resultConstructorName = result.Constructor?.name;
        if (resultConstructorName && typeof resultConstructorName === 'string' && 
            constructorName && typeof constructorName === 'string') {
          
          if (resultConstructorName.toLowerCase().includes(constructorName.toLowerCase()) ||
              constructorName.toLowerCase().includes(resultConstructorName.toLowerCase())) {
            
            if (result.positionText !== 'R' && result.positionText !== 'D' && 
                result.positionText !== 'E' && result.positionText !== 'W') {
              const finishPos = parseInt(result.position);
              if (!isNaN(finishPos)) {
                constructorResults.push(finishPos);
              }
            }
          }
        }
      });
    }
  });
  
  // Calculate average for last 6 results (3 races * 2 drivers)
  const recentResults = constructorResults.slice(-6);
  const avgFinish = recentResults.length > 0 
    ? recentResults.reduce((a, b) => a + b, 0) / recentResults.length 
    : 12.0;
  
  return {
    constructor_avg_finish_3: Number(avgFinish),
    sampleSize: recentResults.length
  };
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * ML Predictor hook with qualifying data fetching and prediction execution
 */
export const useMLPredictor = (params: UseMLPredictorParams): UseMLPredictorReturn => {
  const { driverStandings, raceResults } = params;
  // Default model metrics
  const [modelMetrics] = useState<ModelMetrics>({
    accuracy_within_1: 19.0,
    accuracy_within_2: 40.1,
    accuracy_within_3: 58.8,
    mean_absolute_error: 2.31,
    r2_score: 0.42,
    correlation: 0.68
  });

  // Predictor state
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [qualifyingData, setQualifyingData] = useState<QualifyingDriver[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictorStatus, setPredictorStatus] = useState('Ready');

  /**
   * Select a session and fetch its qualifying data
   */
  const selectSession = useCallback(async (session: Session) => {
    setSelectedSession(session);
    setPredictorStatus('Loading qualifying data...');
    
    try {
      const qualData = await fetchQualifyingDataForSession(session);
      setQualifyingData(qualData);
      setPredictorStatus(`Loaded ${qualData.length} drivers for ${session.location}`);
    } catch (error) {
      console.error('Error selecting session:', error);
      setPredictorStatus('Failed to load qualifying data');
    }
  }, []);

  /**
   * Run prediction for the selected session
   */
  const runPrediction = useCallback(async () => {
    if (!selectedSession || qualifyingData.length === 0) {
      setPredictorStatus('No session or qualifying data available');
      return;
    }

    setIsPredicting(true);
    setPredictorStatus('Running ML prediction...');

    try {
      // Convert qualifying data to API format and run predictions
      const predictions: PredictionResult[] = [];
      
      for (const driver of qualifyingData) {
        try {
          // Calculate real performance metrics for this driver
          const driverMetrics = calculateDriverMetrics(driver.driver_name, driverStandings, raceResults);
          const constructorMetrics = calculateConstructorMetrics(driver.constructor, raceResults);
          
          const driverData: DriverData = {
            driver_name: driver.driver_name,
            constructor: driver.constructor,
            circuit: driver.circuit || selectedSession.circuit_short_name,
            qualifying_position: driver.qualifying_position,
            // Real calculated metrics (ensuring numbers, not strings)
            championship_position: Number(driverMetrics.championship_position),
            cumulative_points: Number(driverMetrics.cumulative_points),
            driver_avg_finish_3: Number(driverMetrics.driver_avg_finish_3),
            driver_avg_quali_3: Number(driverMetrics.driver_avg_quali_3),
            constructor_avg_finish_3: Number(constructorMetrics.constructor_avg_finish_3),
            driver_dnf_rate: Number(driverMetrics.driver_dnf_rate),
          };

          console.log(`🔢 Calculated metrics for ${driver.driver_name}:`, {
            championship_position: driverMetrics.championship_position,
            cumulative_points: driverMetrics.cumulative_points,
            driver_avg_finish_3: driverMetrics.driver_avg_finish_3.toFixed(2),
            constructor_avg_finish_3: constructorMetrics.constructor_avg_finish_3.toFixed(2)
          });

          const result = await makeSecurePrediction(driverData);
          
          predictions.push({
            driver_name: result.driver_name,
            constructor: driver.constructor,
            qualifying_position: driver.qualifying_position,
            predicted_position: result.predicted_position,
            predicted_position_int: Math.round(result.predicted_position),
            confidence: result.status || 'Medium'
          });
        } catch (error) {
          console.error(`Prediction failed for ${driver.driver_name}:`, error);
        }
      }
      
      setPredictions(predictions);
      setPredictorStatus(`Prediction complete for ${selectedSession.location}`);
    } catch (error) {
      console.error('Prediction error:', error);
      setPredictorStatus('Prediction failed');
    } finally {
      setIsPredicting(false);
    }
  }, [selectedSession, qualifyingData, driverStandings, raceResults]);

  /**
   * Run batch predictions for multiple sessions
   */
  const runBatchPredictions = useCallback(async (sessions: Session[]) => {
    if (sessions.length === 0) return;

    setIsPredicting(true);
    setPredictorStatus(`Running batch predictions for ${sessions.length} sessions...`);

    try {
      // Fetch qualifying data for all sessions
      const allQualifyingData = await Promise.all(
        sessions.map(session => fetchQualifyingDataForSession(session))
      );

      // Convert to API format with real calculated metrics
      const allDriverData: DriverData[] = [];
      allQualifyingData.forEach((sessionData, sessionIndex) => {
        sessionData.forEach(driver => {
          // Calculate real performance metrics for this driver
          const driverMetrics = calculateDriverMetrics(driver.driver_name, driverStandings, raceResults);
          const constructorMetrics = calculateConstructorMetrics(driver.constructor, raceResults);
          
          allDriverData.push({
            driver_name: driver.driver_name,
            constructor: driver.constructor,
            circuit: driver.circuit || sessions[sessionIndex].circuit_short_name,
            qualifying_position: driver.qualifying_position,
            // Real calculated metrics (ensuring numbers, not strings)
            championship_position: Number(driverMetrics.championship_position),
            cumulative_points: Number(driverMetrics.cumulative_points),
            driver_avg_finish_3: Number(driverMetrics.driver_avg_finish_3),
            driver_avg_quali_3: Number(driverMetrics.driver_avg_quali_3),
            constructor_avg_finish_3: Number(constructorMetrics.constructor_avg_finish_3),
            driver_dnf_rate: Number(driverMetrics.driver_dnf_rate)
          });
        });
      });

      // Run batch prediction
      const results = await makeBatchPredictions(allDriverData);
      
      // Convert results to our format
      const predictions: PredictionResult[] = results.map(result => ({
        driver_name: result.driver_name,
        constructor: allDriverData.find(d => d.driver_name === result.driver_name)?.constructor || 'Unknown',
        qualifying_position: allDriverData.find(d => d.driver_name === result.driver_name)?.qualifying_position || 0,
        predicted_position: result.predicted_position,
        predicted_position_int: Math.round(result.predicted_position),
        confidence: result.status || 'Medium'
      }));
      
      setPredictions(predictions);
      setPredictorStatus(`Batch prediction complete for ${sessions.length} sessions`);
    } catch (error) {
      console.error('Batch prediction error:', error);
      setPredictorStatus('Batch prediction failed');
    } finally {
      setIsPredicting(false);
    }
  }, [driverStandings, raceResults]);

  /**
   * Clear current predictions
   */
  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setPredictorStatus('Predictions cleared');
  }, []);

  /**
   * Reset predictor state
   */
  const resetPredictor = useCallback(() => {
    setSelectedSession(null);
    setQualifyingData([]);
    setPredictions([]);
    setIsPredicting(false);
    setPredictorStatus('Ready');
  }, []);

  return {
    // State
    modelMetrics,
    selectedSession,
    qualifyingData,
    predictions,
    isPredicting,
    predictorStatus,

    // Actions
    selectSession,
    runPrediction,
    runBatchPredictions,
    clearPredictions,
    resetPredictor,
  };
};
