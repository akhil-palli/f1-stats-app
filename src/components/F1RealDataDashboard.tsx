"use client";

import { useState, useEffect, useCallback } from "react"
import { Trophy, Flag, Users, TrendingUp, Calendar, MapPin, Car, User, Award, Timer, Target, BarChart3, Brain, Activity, Zap, Settings, Play, LayoutDashboard, Crown, LineChart, CircuitBoard, Bot, Loader } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import F1PositionChart from './F1PositionChart'
import { RaceSelector } from './RaceSelector'
import { makeSecurePrediction, makeBatchPredictions } from '@/utils/secureApiClient'

// Types for real API data
type Session = {
  session_key: number;
  meeting_key: number;
  session_name: string;
  date_start: string;
  location: string;
  country_name: string;
  circuit_short_name: string;
  date_end: string;
  session_type: string;
};

type ErgastDriverStanding = {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: {
    driverId: string;
    permanentNumber: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
  };
  Constructors: Array<{
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  }>;
};

type ErgastConstructorStanding = {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: {
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  };
};

type ErgastRaceResult = {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    url: string;
    circuitName: string;
    Location: {
      lat: string;
      long: string;
      locality: string;
      country: string;
    };
  };
  date: string;
  time?: string;
  Results?: Array<{
    number: string;
    position: string;
    positionText: string;
    points: string;
    Driver: {
      driverId: string;
      permanentNumber: string;
      code: string;
      givenName: string;
      familyName: string;
    };
    Constructor: {
      constructorId: string;
      name: string;
    };
    grid: string;
    laps: string;
    status: string;
    Time?: {
      millis: string;
      time: string;
    };
    FastestLap?: {
      rank: string;
      lap: string;
      Time: {
        time: string;
      };
      AverageSpeed: {
        units: string;
        speed: string;
      };
    };
  }>;
};

// ML Predictor Types
type ModelMetrics = {
  accuracy_within_1: number;
  accuracy_within_2: number;
  accuracy_within_3: number;
  mean_absolute_error: number;
  r2_score: number;
  correlation: number;
};

type PredictionResult = {
  driver_name: string;
  constructor: string;
  qualifying_position: number;
  predicted_position: number;
  predicted_position_int: number;
  confidence: string;
};

type QualifyingDriver = {
  driver_name: string;
  constructor: string;
  qualifying_position: number;
  grid_position?: number;
  session_key?: number;
  circuit?: string;
  driver_number?: number;
  fastest_lap?: number;
  fallback?: boolean;
  data_source?: 'real_qualifying' | 'starting_grid' | 'mock';
};

// F1 team colors mapping (2025 season) - Updated with more name variations
const F1_TEAM_COLORS: Record<string, string> = {
  "Red Bull Racing": "#3671C6",
  "Red Bull": "#3671C6",
  "McLaren": "#FF8000", 
  "McLaren F1 Team": "#FF8000",
  "Ferrari": "#E8002D",
  "Scuderia Ferrari": "#E8002D",
  "Mercedes": "#27F4D2",
  "Mercedes-AMG Petronas F1 Team": "#27F4D2",
  "Aston Martin": "#229971",
  "Aston Martin Aramco Cognizant F1 Team": "#229971",
  "Alpine": "#0093CC",
  "Alpine F1 Team": "#0093CC",
  "Williams": "#64C4FF",
  "Williams Racing": "#64C4FF",
  "RB F1 Team": "#6692FF",
  "RB": "#6692FF",
  "VCARB": "#6692FF",
  "Visa Cash App RB F1 Team": "#6692FF",
  "Kick Sauber": "#52E252",
  "Sauber": "#52E252",
  "Stake F1 Team Kick Sauber": "#52E252",
  "Haas F1 Team": "#B6BABD",
  "Haas": "#B6BABD",
  "MoneyGram Haas F1 Team": "#B6BABD",
  // Legacy team names from Ergast
  "AlphaTauri": "#6692FF",
  "Alfa Romeo": "#52E252",
  "Unknown Team": "#808080"
};

export function F1RealDataDashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [sessions, setSessions] = useState<Session[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [driverStandings, setDriverStandings] = useState<ErgastDriverStanding[]>([])
  const [constructorStandings, setConstructorStandings] = useState<ErgastConstructorStanding[]>([])
  const [raceResults, setRaceResults] = useState<ErgastRaceResult[]>([])
  const [raceCalendar, setRaceCalendar] = useState<ErgastRaceResult[]>([])
  const [actualRaceResults, setActualRaceResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dataStatus, setDataStatus] = useState<string>("Loading...")

  // ML Predictor state
  const [modelMetrics] = useState<ModelMetrics>({
    accuracy_within_1: 19.0,
    accuracy_within_2: 40.1,
    accuracy_within_3: 57.5,
    mean_absolute_error: 3.00,
    r2_score: 0.562,
    correlation: 0.752
  });
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isPredictionsLoading, setIsPredictionsLoading] = useState(false);
  const [qualifyingData, setQualifyingData] = useState<QualifyingDriver[]>([]);
  const [selectedRaceCircuit, setSelectedRaceCircuit] = useState("Monaco");
  const [selectedPredictorSession, setSelectedPredictorSession] = useState<Session | null>(null);

  // Fetch all data on component mount
  useEffect(() => {
    async function fetchAllData() {
      setIsLoading(true)
      setDataStatus("Fetching 2025 F1 data...")

      try {
        // Fetch OpenF1 sessions
        setDataStatus("Loading race sessions...")
        try {
          // Try 2025 first
          let sessionResponse = await fetch('https://api.openf1.org/v1/sessions?year=2025', {
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          });
          
          // If 2025 fails due to CORS or other issues, try 2024
          if (!sessionResponse.ok) {
            console.warn("2025 data not available, falling back to 2024");
            sessionResponse = await fetch('https://api.openf1.org/v1/sessions?year=2024', {
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              }
            });
          }
          
          if (sessionResponse.ok) {
            const sessionList = await sessionResponse.json();
            const sortedSessions = sessionList.sort((a: any, b: any) => 
              new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
            );
            
            // Debug: Log session types to understand available data
            setSessions(sortedSessions.slice(0, 50)); // Increased limit to get more races
            
            // Fetch drivers for the latest session to get driver name mappings
            if (sortedSessions.length > 0) {
              try {
                const driversResponse = await fetch(`https://api.openf1.org/v1/drivers?session_key=${sortedSessions[0].session_key}`);
                if (driversResponse.ok) {
                  const driversData = await driversResponse.json();
                  setDrivers(driversData);
                }
              } catch (e) {
                console.error("Failed to fetch drivers:", e);
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch OpenF1 sessions:", e);
          // Try 2024 as final fallback
          try {
            console.warn("Trying 2024 data as fallback");
            const fallbackResponse = await fetch('https://api.openf1.org/v1/sessions?year=2024', {
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              }
            });
            if (fallbackResponse.ok) {
              const sessionList = await fallbackResponse.json();
              const sortedSessions = sessionList.sort((a: any, b: any) => 
                new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
              );
              setSessions(sortedSessions.slice(0, 50));
            } else {
              setSessions([]);
            }
          } catch (fallbackError) {
            console.error("Fallback to 2024 also failed:", fallbackError);
            setSessions([]);
          }
        }

        // Fetch current 2025 driver standings using Jolpica-F1 (Ergast successor)
        setDataStatus("Loading driver championship standings...")
        let driverData = null;
        try {
          const driverResponse = await fetch('https://api.jolpi.ca/ergast/f1/2025/driverStandings.json', {
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          });
          if (driverResponse.ok) {
            const data = await driverResponse.json();
            if (data.MRData.StandingsTable.StandingsLists.length > 0) {
              driverData = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
            }
          }
        } catch (e) {
          console.log("2025 data not available, trying 2024...", e);
          try {
            const driverResponse = await fetch('https://api.jolpi.ca/ergast/f1/2024/driverStandings.json', {
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              }
            });
            if (driverResponse.ok) {
              const data = await driverResponse.json();
              if (data.MRData.StandingsTable.StandingsLists.length > 0) {
                driverData = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
              }
            }
          } catch (e) {
            console.error("Failed to fetch driver standings:", e);
          }
        }

        if (driverData) {
          setDriverStandings(driverData);
        }

        // Fetch constructor standings using Jolpica-F1 (Ergast successor)
        setDataStatus("Loading constructor standings...")
        let constructorData = null;
        try {
          const constructorResponse = await fetch('https://api.jolpi.ca/ergast/f1/2025/constructorStandings.json', {
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          });
          if (constructorResponse.ok) {
            const data = await constructorResponse.json();
            if (data.MRData.StandingsTable.StandingsLists.length > 0) {
              constructorData = data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
            }
          }
        } catch (e) {
          console.log("2025 constructor data not available, trying 2024...", e);
          try {
            const constructorResponse = await fetch('https://api.jolpi.ca/ergast/f1/2024/constructorStandings.json', {
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              }
            });
            if (constructorResponse.ok) {
              const data = await constructorResponse.json();
              if (data.MRData.StandingsTable.StandingsLists.length > 0) {
                constructorData = data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
              }
            }
          } catch (e) {
            console.error("Failed to fetch constructor standings:", e);
          }
        }

        if (constructorData) {
          setConstructorStandings(constructorData);
        }

        // Fetch recent race results using Jolpica-F1 (Ergast successor)
        setDataStatus("Loading race results...")
        try {
          const resultsResponse = await fetch('https://api.jolpi.ca/ergast/f1/2025/results.json?limit=100', {
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          });
          if (resultsResponse.ok) {
            const data = await resultsResponse.json();
            if (data.MRData.RaceTable.Races.length > 0) {
              setRaceResults(data.MRData.RaceTable.Races);
            }
          }
        } catch (e) {
          console.log("2025 results not available, trying 2024...", e);
          try {
            const resultsResponse = await fetch('https://api.jolpi.ca/ergast/f1/2024/results.json?limit=100', {
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              }
            });
            if (resultsResponse.ok) {
              const data = await resultsResponse.json();
              if (data.MRData.RaceTable.Races.length > 0) {
                setRaceResults(data.MRData.RaceTable.Races);
              }
            }
          } catch (e) {
            console.error("Failed to fetch race results:", e);
          }
        }

        // Fetch 2025 race calendar for season status calculation
        setDataStatus("Loading race calendar...")
        try {
          const calendarResponse = await fetch('https://api.jolpi.ca/ergast/f1/2025.json', {
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          });
          if (calendarResponse.ok) {
            const data = await calendarResponse.json();
            if (data.MRData.RaceTable.Races.length > 0) {
              setRaceCalendar(data.MRData.RaceTable.Races);
              
              // Fetch individual race results for completed races that might be missing from bulk results
              const currentDate = new Date();
              const completedRaces = data.MRData.RaceTable.Races.filter(race => {
                const raceDate = new Date(race.date);
                return raceDate < currentDate;
              });
              
              setDataStatus(`Loading individual race results... (${completedRaces.length} completed races)`);
              
              // Try to fetch individual results for each completed race
              const individualResults = [];
              for (const race of completedRaces) {
                try {
                  const raceResultResponse = await fetch(`https://api.jolpi.ca/ergast/f1/2025/${race.round}/results.json`, {
                    mode: 'cors',
                    headers: {
                      'Accept': 'application/json',
                    }
                  });
                  if (raceResultResponse.ok) {
                    const raceData = await raceResultResponse.json();
                    if (raceData.MRData.RaceTable.Races.length > 0) {
                      individualResults.push(raceData.MRData.RaceTable.Races[0]);
                    }
                  }
                } catch (e) {
                  console.log(`Failed to fetch results for round ${race.round}:`, e);
                }
              }
              
              // Merge individual results with existing results
              if (individualResults.length > 0) {
                setRaceResults(prevResults => {
                  const merged = [...prevResults];
                  
                  individualResults.forEach(newResult => {
                    const existingIndex = merged.findIndex(r => r.round === newResult.round && r.season === newResult.season);
                    if (existingIndex >= 0) {
                      merged[existingIndex] = newResult; // Replace if exists
                    } else {
                      merged.push(newResult); // Add if new
                    }
                  });
                  
                  console.log(`Updated race results: ${merged.length} total, ${individualResults.length} individual results added`);
                  return merged;
                });
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch race calendar:", e);
        }

        setDataStatus("Data loaded successfully!");

      } catch (err) {
        console.error('Error fetching F1 data:', err);
        setDataStatus("Failed to load F1 data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllData();
  }, []);

  // Get actual race results for the selected session using OpenF1 position API (same as charts)
  const getActualRaceResults = async () => {
    if (!selectedPredictorSession) return null;
    
    try {
      console.log('🏁 Fetching REAL race results from OpenF1 position API...');
      
      // First validate that this is actually 2025 data
      const sessionDate = new Date(selectedPredictorSession.date_start);
      const sessionYear = sessionDate.getFullYear();
      
      if (sessionYear !== 2025) {
        console.log(`❌ Session is from ${sessionYear}, not 2025. Showing no data.`);
        return null;
      }
      
      // Use the same OpenF1 position API that works for your charts
      const positionUrl = `https://api.openf1.org/v1/position?session_key=${selectedPredictorSession.session_key}`;
      const response = await fetch(positionUrl);
      
      if (!response.ok) {
        console.log(`Failed to fetch position data: ${response.status}`);
        return null;
      }
      
      const positionData = await response.json();
      console.log(`📊 Found ${positionData.length} position records for session ${selectedPredictorSession.session_key}`);
      
      if (positionData.length === 0) {
        console.log('No position data available for this session');
        return null;
      }
      
      // Get final positions (latest timestamp for each driver)
      const finalPositions = new Map();
      
      positionData.forEach((pos: any) => {
        const driverKey = pos.driver_number;
        const currentEntry = finalPositions.get(driverKey);
        
        if (!currentEntry || new Date(pos.date) > new Date(currentEntry.date)) {
          finalPositions.set(driverKey, pos);
        }
      });
      
      // Validate we have current 2025 F1 drivers (including rookies)
      const current2025Drivers = [1, 4, 5, 6, 10, 11, 12, 14, 16, 18, 22, 23, 27, 30, 31, 43, 44, 55, 63, 77, 81, 87]; // All 2025 driver numbers including rookies
      const foundDriverNumbers = Array.from(finalPositions.keys());
      const has2025Drivers = current2025Drivers.some(num => foundDriverNumbers.includes(num));
      
      if (!has2025Drivers) {
        console.log(`❌ No current 2025 F1 drivers found - this appears to be old data.`);
        return null;
      }
      
      // Convert to race results format and sort by final position
      const raceResults = Array.from(finalPositions.values())
        .filter((pos: any) => pos.position && pos.position > 0)
        .sort((a: any, b: any) => a.position - b.position)
        .map((pos: any, index: number) => ({
          position: pos.position.toString(),
          Driver: {
            familyName: getDriverName(pos.driver_number).split(' ').pop() || 'Unknown',
            givenName: getDriverName(pos.driver_number).split(' ').slice(0, -1).join(' ') || 'Unknown'
          },
          driver_number: pos.driver_number,
          final_position: pos.position
        }));
      
      console.log(`✅ Found final race positions for ${raceResults.length} drivers (2025 season)`);
      
      return {
        Results: raceResults,
        raceName: `${selectedPredictorSession.location} Grand Prix`,
        season: new Date(selectedPredictorSession.date_start).getFullYear().toString(),
        date: selectedPredictorSession.date_start,
        session_key: selectedPredictorSession.session_key
      };
      
    } catch (error) {
      console.error('Failed to fetch real race results:', error);
      return null;
    }
  };

  // Fetch actual race results when session and predictions change
  useEffect(() => {
    if (selectedPredictorSession && predictions.length > 0) {
      getActualRaceResults().then(setActualRaceResults);
    }
  }, [selectedPredictorSession, predictions.length]);

  const renderDashboard = () => {
    const leader = driverStandings[0];
    const constructorLeader = constructorStandings[0];
    
    // Calculate completed races based on current date and race calendar
    const currentDate = new Date();
    const currentRaces = raceCalendar.length > 0 ? raceCalendar : [];
    
    // Count races that have already happened (race date is before current date)
    const completedRaces = currentRaces.filter(race => {
      const raceDate = new Date(race.date);
      return raceDate < currentDate;
    });
    
    const totalRaces = currentRaces.length || 24; // Default to 24 if calendar not loaded
    
    // Calculate season status
    const seasonStart = currentRaces.length > 0 ? new Date(currentRaces[0].date) : new Date('2025-03-16');
    const seasonEnd = currentRaces.length > 0 ? new Date(currentRaces[currentRaces.length - 1].date) : new Date('2025-12-07');
    
    let seasonStatus = "2025 Active";
    if (currentDate < seasonStart) {
      seasonStatus = "2025 Pre-Season";
    } else if (currentDate > seasonEnd) {
      seasonStatus = "2025 Completed";
    } else if (completedRaces.length === totalRaces) {
      seasonStatus = "2025 Completed";
    }
    
    return (
      <div className="space-y-8">
        {/* Data Source Notice */}
        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Badge variant="outline" className="bg-blue-600 w-fit">LIVE DATA</Badge>
            <span className="text-xs sm:text-sm">
              Championships from Jolpica-F1 API • Race calendar & results • Sessions from OpenF1 API • {dataStatus}
            </span>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Championship Leader</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {leader ? `${leader.Driver.givenName} ${leader.Driver.familyName}` : "Loading..."}
              </div>
              <p className="text-xs text-gray-400">
                {leader ? `${leader.points} points • ${leader.wins} wins` : "Fetching data..."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Season Status</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{seasonStatus}</div>
              <p className="text-xs text-gray-400">Formula 1 World Championship</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Races Completed</CardTitle>
              <Flag className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{completedRaces.length}/{totalRaces}</div>
              <p className="text-xs text-gray-400">2025 Season</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Constructor Leader</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {constructorLeader ? constructorLeader.Constructor.name : "Loading..."}
              </div>
              <p className="text-xs text-gray-400">
                {constructorLeader ? `${constructorLeader.points} points • ${constructorLeader.wins} wins` : "Fetching data..."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Standings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Top 6 Drivers (Real Standings)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {driverStandings.slice(0, 6).map((standing) => (
                  <div key={standing.Driver.driverId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                        {standing.position}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm md:text-base truncate">{standing.Driver.givenName} {standing.Driver.familyName}</p>
                        <p className="text-xs md:text-sm text-gray-400 truncate">{standing.Constructors[0]?.name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm md:text-base">{standing.points}</p>
                      <p className="text-xs md:text-sm text-gray-400">{standing.wins} wins</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Recent Race Winners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {raceResults
                  .filter(race => race.Results && race.Results.length > 0) // Only races with results
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date, newest first
                  .slice(0, 5) // Take first 5 (most recent)
                  .map((race) => {
                  const winner = race.Results?.[0];
                  return (
                    <div key={`${race.season}-${race.round}`} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm md:text-base truncate">{race.raceName}</p>
                        <p className="text-xs md:text-sm text-gray-400">{new Date(race.date + 'T12:00:00').toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-medium text-sm md:text-base truncate">
                          {winner ? `${winner.Driver.givenName} ${winner.Driver.familyName}` : 'TBD'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Round {race.round}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderStandings = () => (
    <Tabs defaultValue="drivers" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="drivers">Driver Standings</TabsTrigger>
        <TabsTrigger value="constructors">Constructor Standings</TabsTrigger>
      </TabsList>

      <TabsContent value="drivers">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Driver Championship Standings
            </CardTitle>
            <CardDescription>
              Real standings from Jolpica-F1 API (Ergast successor) • Updated regularly • 
              {driverStandings.length > 0 ? " Current season data" : " Loading..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Pos</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="w-20">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driverStandings.map((standing) => {
                  const maxPoints = Math.max(...driverStandings.map(s => parseInt(s.points)));
                  return (
                    <TableRow key={standing.Driver.driverId}>
                      <TableCell className="font-medium">{standing.position}</TableCell>
                      <TableCell className="font-medium">
                        {standing.Driver.givenName} {standing.Driver.familyName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: F1_TEAM_COLORS[standing.Constructors[0]?.name] || '#FFFFFF' }}
                          />
                          {standing.Constructors[0]?.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{standing.points}</TableCell>
                      <TableCell className="text-right">{standing.wins}</TableCell>
                      <TableCell>
                        <Progress value={(parseInt(standing.points) / maxPoints) * 100} className="w-full h-2" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="constructors">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Constructor Championship Standings
            </CardTitle>
            <CardDescription>
              Real team standings from Jolpica-F1 API (Ergast successor) • Updated regularly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Pos</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="w-20">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {constructorStandings.map((standing) => {
                  const maxPoints = Math.max(...constructorStandings.map(s => parseInt(s.points)));
                  return (
                    <TableRow key={standing.Constructor.constructorId}>
                      <TableCell className="font-medium">{standing.position}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: F1_TEAM_COLORS[standing.Constructor.name] || '#FFFFFF' }}
                          />
                          <span className="font-medium">{standing.Constructor.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{standing.points}</TableCell>
                      <TableCell className="text-right">{standing.wins}</TableCell>
                      <TableCell>
                        <Progress value={(parseInt(standing.points) / maxPoints) * 100} className="w-full h-2" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  const renderPositionChart = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            F1 Position Analysis
          </CardTitle>
          <CardDescription>
            Live telemetry from OpenF1 API • Real-time position tracking • Interactive race analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <F1PositionChart />
        </CardContent>
      </Card>
    </div>
  );

  const renderRaces = () => {
    // Merge race calendar with results to show complete season view
    const mergedRaces = raceCalendar.map(calendarRace => {
      // Find matching race result
      const raceResult = raceResults.find(result => 
        result.round === calendarRace.round && result.season === calendarRace.season
      );
      
      // Return calendar race with results if available
      return {
        ...calendarRace,
        Results: raceResult?.Results || null
      };
    });

    const currentDate = new Date();

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Race Results & Calendar
            </CardTitle>
            <CardDescription>
              Complete 2025 F1 season calendar with results • Race calendar from Jolpica-F1 API • Live session data from OpenF1
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {mergedRaces
                .sort((a, b) => parseInt(b.round) - parseInt(a.round)) // Sort by round number, newest first
                .map((race) => {
                const winner = race.Results?.[0];
                const hasResults = race.Results && race.Results.length > 0;
                const raceDate = new Date(race.date);
                const hasHappened = raceDate < currentDate;
                const isUpcoming = !hasHappened;
                
                return (
                  <div
                    key={`${race.season}-${race.round}`}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors ${
                      isUpcoming ? 'p-2 bg-gray-900/30' : 'p-4'
                    } gap-3 sm:gap-0`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className={`text-center flex-shrink-0 ${isUpcoming ? 'min-w-[40px]' : 'min-w-[60px]'}`}>
                        <div className={`font-bold ${isUpcoming ? 'text-sm' : 'text-lg'}`}>R{race.round}</div>
                        <Badge 
                          variant={(!isUpcoming && hasHappened) ? "default" : isUpcoming ? "outline" : "default"} 
                          className={isUpcoming ? "text-xs px-1" : "text-xs"}
                        >
                          {hasResults ? "Completed" : isUpcoming ? "Upcoming" : "Completed"}
                        </Badge>
                      </div>
                      <Separator orientation="vertical" className={`${isUpcoming ? "h-8" : "h-12"} hidden sm:block`} />
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-semibold ${isUpcoming ? 'text-sm' : 'text-lg'} truncate`}>{race.raceName}</h3>
                        <div className={`flex items-center gap-2 text-gray-400 ${isUpcoming ? 'text-xs' : 'text-sm'}`}>
                          <MapPin className={`${isUpcoming ? 'h-3 w-3' : 'h-4 w-4'} flex-shrink-0`} />
                          <span className="truncate">{race.Circuit.Location.locality}, {race.Circuit.Location.country}</span>
                        </div>
                        <p className={`text-gray-400 ${isUpcoming ? 'text-xs' : 'text-sm'}`}>
                          {raceDate.toLocaleDateString('en-US', { 
                            weekday: isUpcoming ? undefined : 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    {(winner || (!isUpcoming && hasHappened)) && (
                      <div className="text-right flex-shrink-0 sm:ml-4">
                        {winner ? (
                          <>
                            <div className={`flex items-center gap-2 justify-end ${isUpcoming ? 'text-sm' : ''}`}>
                              <Trophy className={`text-yellow-600 ${isUpcoming ? 'h-3 w-3' : 'h-4 w-4'} flex-shrink-0`} />
                              <span className="font-medium truncate">
                                {winner.Driver.givenName} {winner.Driver.familyName}
                              </span>
                            </div>
                            <p className={`text-gray-400 ${isUpcoming ? 'text-xs' : 'text-xs'} truncate`}>
                              {winner.Constructor.name}
                            </p>
                          </>
                        ) : hasHappened ? (
                          <div className={`text-gray-400 ${isUpcoming ? 'text-xs' : 'text-sm'}`}>
                            Results pending
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ML Predictor functions - Use real qualifying data from OpenF1
  const fetchQualifyingDataForSession = useCallback(async (session: Session) => {
    if (!session) return;
    
    try {
      setIsLoading(true);
      
      console.log('🏁 Fetching REAL qualifying data from OpenF1 for:', session.location);
      
      // First find the qualifying session for this race weekend
      const qualifyingSession = sessions.find(s => 
        s.meeting_key === session.meeting_key && 
        s.session_name === 'Qualifying'
      );
      
      if (!qualifyingSession) {
        console.warn('⚠️ No qualifying session found - using race starting grid instead');
        
        // Try to get starting grid from the race session itself
        try {
          const gridResponse = await fetch(`https://api.openf1.org/v1/position?session_key=${session.session_key}`);
          if (gridResponse.ok) {
            const gridData = await gridResponse.json();
            
            if (gridData.length > 0) {
              // Get starting positions (earliest timestamp for each driver)
              const startingPositions = new Map();
              
              gridData.forEach((pos: any) => {
                const driverKey = pos.driver_number;
                const currentEntry = startingPositions.get(driverKey);
                
                if (!currentEntry || new Date(pos.date) < new Date(currentEntry.date)) {
                  startingPositions.set(driverKey, pos);
                }
              });
              
              const gridResults = Array.from(startingPositions.values())
                .filter((pos: any) => pos.position && pos.position > 0)
                .sort((a: any, b: any) => a.position - b.position)
                .map((pos: any) => ({
                  driver_name: getDriverName(pos.driver_number),
                  constructor: getConstructorFromDriverName(getDriverName(pos.driver_number)),
                  qualifying_position: pos.position,
                  driver_number: pos.driver_number,
                  data_source: 'starting_grid' as const
                }));
              
              if (gridResults.length > 0) {
                setQualifyingData(gridResults);
                setSelectedRaceCircuit(session.circuit_short_name || session.location);
                console.log('✅ Real starting grid data loaded:', gridResults.length, 'drivers');
                return;
              }
            }
          }
        } catch (gridError) {
          console.warn('Failed to fetch starting grid:', gridError);
        }
        
        // No fallback data - show error instead
        console.error('🚨 NO QUALIFYING DATA AVAILABLE - Real data not found');
        setQualifyingData([]);
        setSelectedRaceCircuit(session.circuit_short_name || session.location);
        return;
      }
      
      // Fetch real qualifying positions
      const qualifyingResponse = await fetch(`https://api.openf1.org/v1/position?session_key=${qualifyingSession.session_key}`);
      
      if (!qualifyingResponse.ok) {
        throw new Error(`Failed to fetch qualifying data: ${qualifyingResponse.status}`);
      }
      
      const qualifyingPositions = await qualifyingResponse.json();
      console.log(`📊 Found ${qualifyingPositions.length} qualifying position records`);
      
      if (qualifyingPositions.length === 0) {
        throw new Error('No qualifying position data available');
      }
      
      // Get final qualifying positions (latest timestamp for each driver)
      const finalQualifying = new Map();
      
      qualifyingPositions.forEach((pos: any) => {
        const driverKey = pos.driver_number;
        const currentEntry = finalQualifying.get(driverKey);
        
        if (!currentEntry || new Date(pos.date) > new Date(currentEntry.date)) {
          finalQualifying.set(driverKey, pos);
        }
      });
      
      const qualifyingResults = Array.from(finalQualifying.values())
        .filter((pos: any) => pos.position && pos.position > 0)
        .sort((a: any, b: any) => a.position - b.position)
        .map((pos: any) => {
          const driverName = getDriverName(pos.driver_number);
          const constructor = getConstructorFromDriverName(driverName);
          console.log(`Driver #${pos.driver_number}: ${driverName} -> ${constructor}`);
          return {
            driver_name: driverName,
            constructor: constructor,
            qualifying_position: pos.position,
            driver_number: pos.driver_number,
            session_key: qualifyingSession.session_key,
            data_source: 'real_qualifying' as const
          };
        });
      
      setQualifyingData(qualifyingResults);
      setSelectedRaceCircuit(session.circuit_short_name || session.location);
      
      console.log('✅ Real qualifying data loaded:', qualifyingResults.length, 'drivers');
      
    } catch (error) {
      console.error('Error fetching real qualifying data:', error);
      console.error('🚨 FAILED TO LOAD QUALIFYING DATA');
      
      // No fallback data - clear qualifying data and show error
      setQualifyingData([]);
      setSelectedRaceCircuit(session.circuit_short_name || session.location);
    } finally {
      setIsLoading(false);
    }
  }, [sessions, drivers]);

  // Helper to get constructor from driver name
  const getConstructorFromDriverName = (driverName: string): string => {
    console.log(`Looking up constructor for driver: "${driverName}"`);
    
    // Normalize the driver name to proper case for lookup
    const normalizedName = driverName
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const constructorMap: Record<string, string> = {
      // Red Bull Racing
      "Max Verstappen": "Red Bull Racing",
      "Sergio Perez": "Red Bull Racing", 
      
      // McLaren
      "Lando Norris": "McLaren",
      "Oscar Piastri": "McLaren",
      
      // Ferrari  
      "Charles Leclerc": "Ferrari",
      "Carlos Sainz": "Ferrari",
      
      // Mercedes (2025: Hamilton + Antonelli)
      "Lewis Hamilton": "Mercedes",
      "George Russell": "Mercedes", 
      "Kimi Antonelli": "Mercedes",
      
      // Aston Martin
      "Fernando Alonso": "Aston Martin",
      "Lance Stroll": "Aston Martin",
      
      // Alpine
      "Pierre Gasly": "Alpine",
      "Esteban Ocon": "Alpine",
      
      // Williams (2025: Albon + Colapinto)
      "Alex Albon": "Williams",
      "Alexander Albon": "Williams",
      "Logan Sargeant": "Williams",
      "Franco Colapinto": "Williams",
      
      // Haas (2025: Hulkenberg + Bearman)
      "Nico Hulkenberg": "Haas F1 Team",
      "Kevin Magnussen": "Haas F1 Team",
      "Oliver Bearman": "Haas F1 Team",
      
      // Kick Sauber (2025: Bottas + Bortoleto)
      "Valtteri Bottas": "Kick Sauber",
      "Zhou Guanyu": "Kick Sauber",
      "Gabriel Bortoleto": "Kick Sauber",
      
      // RB F1 Team (2025: Tsunoda + Hadjar)
      "Yuki Tsunoda": "RB F1 Team",
      "Liam Lawson": "RB F1 Team",
      "Isack Hadjar": "RB F1 Team",
      
      // Legacy/backup drivers
      "Daniel Ricciardo": "RB F1 Team"
    };
    
    const result = constructorMap[normalizedName] || "Unknown Team";
    console.log(`Constructor lookup result: "${driverName}" -> normalized: "${normalizedName}" -> "${result}"`);
    return result;
  };

  const handleRaceSelection = useCallback(async (session: Session) => {
    setSelectedPredictorSession(session);
    await fetchQualifyingDataForSession(session);
  }, [fetchQualifyingDataForSession]);

  // Auto-generate predictions when session and qualifying data are ready
  useEffect(() => {
    if (selectedPredictorSession && qualifyingData.length > 0) {
      // Clear existing predictions when switching races
      setPredictions([]);
      setActualRaceResults(null);
      
      // Small delay to ensure all state updates are complete
      const timer = setTimeout(() => {
        generatePredictions();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedPredictorSession?.session_key, qualifyingData.length]); // Use session_key to detect race changes

  // Helper function to get driver name from driver number (using real driver data from API)
  const getDriverName = (driverNumber: number): string => {
    // First try to find the driver in our loaded drivers data
    const driverFromAPI = drivers.find(d => d.driver_number === driverNumber);
    if (driverFromAPI && driverFromAPI.full_name) {
      return driverFromAPI.full_name;
    }
    
    // Fallback to 2025 season mapping including rookies
    const DRIVER_MAP_2025: Record<number, string> = {
      1: "Max Verstappen",
      4: "Lando Norris", 
      5: "Gabriel Bortoleto",        // Sauber rookie
      6: "Isack Hadjar",            // RB rookie  
      10: "Pierre Gasly",
      11: "Sergio Perez",
      12: "Kimi Antonelli",         // Mercedes rookie
      14: "Fernando Alonso",
      16: "Charles Leclerc",
      18: "Lance Stroll",
      22: "Yuki Tsunoda",
      23: "Alexander Albon",
      27: "Nico Hulkenberg",
      30: "Liam Lawson",
      31: "Esteban Ocon",
      43: "Franco Colapinto",       // Williams
      44: "Lewis Hamilton",
      55: "Carlos Sainz",
      63: "George Russell",
      77: "Valtteri Bottas",
      81: "Oscar Piastri",
      87: "Oliver Bearman"          // Haas/Ferrari reserve
    };
    
    return DRIVER_MAP_2025[driverNumber] || `Driver #${driverNumber}`;
  };

  // Calculate real performance metrics for a driver
  const calculateDriverMetrics = (driverName: string) => {
    // Get driver's championship standing
    const driverStanding = driverStandings.find(standing => 
      `${standing.Driver.givenName} ${standing.Driver.familyName}`.toUpperCase() === driverName.toUpperCase()
    );
    
    // Get driver's recent race results (last 3 races)
    const driverRaceResults: number[] = [];
    const driverQualiResults: number[] = [];
    let dnfCount = 0;
    let totalRaces = 0;
    
    // Look through race results to find this driver's performance
    raceResults.forEach(race => {
      if (race.Results) {
        const driverResult = race.Results.find(result => 
          `${result.Driver.givenName} ${result.Driver.familyName}`.toUpperCase() === driverName.toUpperCase()
        );
        
        if (driverResult) {
          totalRaces++;
          
          // Race finish position
          if (driverResult.positionText !== 'R' && driverResult.positionText !== 'D' && driverResult.positionText !== 'E' && driverResult.positionText !== 'W') {
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
      championship_position: driverStanding ? parseInt(driverStanding.position) : 15,
      cumulative_points: driverStanding ? parseFloat(driverStanding.points) : 0,
      driver_avg_finish_3: avgFinish,
      driver_avg_quali_3: avgQuali,
      driver_dnf_rate: dnfRate,
      totalRaces,
      recentRaces: recentRaceResults.length
    };
  };

  // Calculate constructor performance metrics
  const calculateConstructorMetrics = (constructorName: string) => {
    const constructorResults: number[] = [];
    
    // Look through race results to find constructor's performance
    raceResults.forEach(race => {
      if (race.Results) {
        race.Results.forEach(result => {
          if (result.Constructor.name.toLowerCase().includes(constructorName.toLowerCase()) ||
              constructorName.toLowerCase().includes(result.Constructor.name.toLowerCase())) {
            
            if (result.positionText !== 'R' && result.positionText !== 'D' && result.positionText !== 'E' && result.positionText !== 'W') {
              const finishPos = parseInt(result.position);
              if (!isNaN(finishPos)) {
                constructorResults.push(finishPos);
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
      constructor_avg_finish_3: avgFinish,
      sampleSize: recentResults.length
    };
  };

  const generatePredictions = async () => {
    if (!selectedPredictorSession) {
      alert('Please select a race session first');
      return;
    }

    try {
      setIsPredictionsLoading(true);
      console.log('🤖 Generating predictions for:', {
        circuit: selectedRaceCircuit,
        session: selectedPredictorSession?.session_name,
        driversCount: qualifyingData.length,
        sampleDriver: qualifyingData[0]
      });
      
      // Prepare all driver data for batch processing
      const driversData = qualifyingData.map((driver) => {
        // Calculate real performance metrics for this driver
        const driverMetrics = calculateDriverMetrics(driver.driver_name);
        const constructorMetrics = calculateConstructorMetrics(driver.constructor);
        
        return {
          driver_name: driver.driver_name,
          constructor: driver.constructor,
          circuit: selectedRaceCircuit,
          qualifying_position: driver.qualifying_position,
          // Real calculated metrics
          championship_position: driverMetrics.championship_position,
          cumulative_points: driverMetrics.cumulative_points,
          driver_avg_finish_3: driverMetrics.driver_avg_finish_3,
          driver_avg_quali_3: driverMetrics.driver_avg_quali_3,
          constructor_avg_finish_3: constructorMetrics.constructor_avg_finish_3,
          driver_dnf_rate: driverMetrics.driver_dnf_rate,
        };
      });

      // Use batch processing to respect concurrency limits
      const apiResults = await makeBatchPredictions(driversData);
      
      // Convert API results to component format
      const predictions = apiResults.map(result => ({
        driver_name: result.driver_name,
        constructor: driversData.find(d => d.driver_name === result.driver_name)?.constructor || '',
        qualifying_position: driversData.find(d => d.driver_name === result.driver_name)?.qualifying_position || 0,
        predicted_position: result.predicted_position,
        predicted_position_int: Math.round(result.predicted_position),
        confidence: result.predicted_position <= 3 ? "High" : 
                   result.predicted_position <= 10 ? "Medium" : "Low"
      }));
      
      // Sort by predicted position, then by qualifying position as tiebreaker
      predictions.sort((a, b) => {
        if (a.predicted_position !== b.predicted_position) {
          return a.predicted_position - b.predicted_position;
        }
        // If predicted positions are equal, use qualifying position as tiebreaker
        return a.qualifying_position - b.qualifying_position;
      });
      setPredictions(predictions);
      
      console.log('✅ Predictions generated:', {
        circuit: selectedRaceCircuit,
        totalPredictions: predictions.length,
        failedPredictions: qualifyingData.length - predictions.length,
        topThree: predictions.slice(0, 3).map(p => ({ 
          driver: p.driver_name, 
          predicted: p.predicted_position_int 
        }))
      });
      
    } catch (error) {
      console.error('Error generating predictions:', error);
      alert('Failed to generate predictions. Check if ML API is running on Google Cloud Run');
    } finally {
      setIsPredictionsLoading(false);
    }
  };

  const renderMLPredictor = () => (
    <div className="space-y-6">
      {/* API Status Notice */}
      <div className="bg-purple-900/50 border border-purple-700 rounded-lg p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Badge variant="outline" className="bg-purple-600 w-fit">ML MODEL</Badge>
          <span className="text-xs sm:text-sm">
            Random Forest • 40.1% accuracy within ±2 positions • Production-ready model • Docker deployment available
          </span>
        </div>
      </div>

      <Tabs key="ml-predictor-tabs" defaultValue="overview" persistKey="ml-predictor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3">Overview</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm px-2 sm:px-3">Performance</TabsTrigger>
          <TabsTrigger value="predictor" className="text-xs sm:text-sm px-1 sm:px-3">Predictor</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs sm:text-sm px-2 sm:px-3">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Model Architecture
                </CardTitle>
                <CardDescription>
                  Production Random Forest Regressor with engineered features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">47</div>
                    <div className="text-sm text-gray-400">Features</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">100</div>
                    <div className="text-sm text-gray-400">Trees</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">Key Features:</div>
                  <div className="text-xs space-y-1 text-gray-400">
                    <div>• Qualifying position & grid penalties</div>
                    <div>• Driver championship standings</div>
                    <div>• Constructor performance metrics</div>
                    <div>• Circuit-specific characteristics</div>
                    <div>• Historical driver/team performance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Accuracy Metrics
                </CardTitle>
                <CardDescription>
                  Model performance on validation data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">±1 Position</span>
                    <div className="flex items-center gap-2">
                      <Progress value={modelMetrics.accuracy_within_1} className="w-20 h-2" />
                      <span className="text-sm font-medium">{modelMetrics.accuracy_within_1}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">±2 Positions</span>
                    <div className="flex items-center gap-2">
                      <Progress value={modelMetrics.accuracy_within_2} className="w-20 h-2" />
                      <span className="text-sm font-medium text-green-400">{modelMetrics.accuracy_within_2}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">±3 Positions</span>
                    <div className="flex items-center gap-2">
                      <Progress value={modelMetrics.accuracy_within_3} className="w-20 h-2" />
                      <span className="text-sm font-medium">{modelMetrics.accuracy_within_3}%</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">{modelMetrics.mean_absolute_error}</div>
                    <div className="text-xs text-gray-400">Avg Error</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{modelMetrics.correlation}</div>
                    <div className="text-xs text-gray-400">Correlation</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Analysis
              </CardTitle>
              <CardDescription>
                Detailed model metrics and industry comparisons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Model Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">R² Score</span>
                      <span className="font-medium">{modelMetrics.r2_score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">MAE</span>
                      <span className="font-medium">{modelMetrics.mean_absolute_error}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Correlation</span>
                      <span className="font-medium">{modelMetrics.correlation}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Industry Comparison</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Our Model</span>
                      <Badge variant="default">40.1%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Industry Avg</span>
                      <Badge variant="secondary">30-35%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Random Guess</span>
                      <Badge variant="outline">15%</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Deployment Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Model Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Docker Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">API Integration</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictor">
          <div className="space-y-6">
            {/* Race Selector */}
            <RaceSelector 
              sessions={sessions}
              selectedSession={selectedPredictorSession}
              onSessionSelect={handleRaceSelection}
              isLoading={isLoading}
            />

            {/* Predictor Interface */}
            {selectedPredictorSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-500" />
                    Live Race Predictor
                  </CardTitle>
                  <CardDescription>
                    Generate race finish predictions for {selectedPredictorSession.circuit_short_name || selectedPredictorSession.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-sm">
                      Circuit: <strong>{selectedRaceCircuit}</strong>
                    </div>
                    <div className="text-sm text-gray-400">
                      Session: {selectedPredictorSession.session_name}
                    </div>
                    {qualifyingData.length > 0 ? (
                      <div className="text-xs">
                        {qualifyingData.some(d => d.data_source === 'starting_grid') ? (
                          <Badge variant="outline" className="bg-blue-900 text-blue-300">
                            <Flag className="w-4 h-4 inline mr-2" />Real Starting Grid
                          </Badge>
                        ) : qualifyingData.some(d => d.data_source === 'real_qualifying') ? (
                          <Badge variant="outline" className="bg-green-900 text-green-300">
                            ✅ Real Qualifying Data
                          </Badge>
                        ) : qualifyingData.some(d => d.fallback) ? (
                          <Badge variant="outline" className="bg-yellow-900 text-yellow-300">
                            📋 Driver List Order
                          </Badge>
                        ) : qualifyingData.some(d => d.fastest_lap) ? (
                          <Badge variant="outline" className="bg-blue-900 text-blue-300">
                            ⏱️ Lap Time Based
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-900 text-green-300">
                            <Flag className="w-4 h-4 inline mr-2" />Real Grid Positions
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs">
                        <Badge variant="outline" className="bg-red-900 text-red-300">
                          ❌ No Qualifying Data Available
                        </Badge>
                      </div>
                    )}
                    {isLoading && (
                      <div className="text-sm text-gray-400">
                        Generating predictions...
                      </div>
                    )}
                  </div>
                  
                  {qualifyingData.length === 0 && !isLoading && (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-sm">No qualifying data available for this session</div>
                    </div>
                  )}
                  
                  {isPredictionsLoading && (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <Loader className="w-8 h-8 animate-spin text-blue-500" />
                        <div className="text-lg font-medium text-gray-700">Generating ML Predictions...</div>
                        <div className="text-sm text-gray-500">Calling Google Cloud Run API</div>
                      </div>
                    </div>
                  )}
                  
                  {qualifyingData.length > 0 && predictions.length === 0 && !isPredictionsLoading && (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-lg font-medium text-red-600">Failed to Generate Predictions</div>
                        <div className="text-sm text-gray-500">ML API is not responding. Please check if the Google Cloud Run service is available.</div>
                      </div>
                    </div>
                  )}
                  
                  {predictions.length > 0 && !isPredictionsLoading && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Qualifying vs Predicted</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">Quali</TableHead>
                              <TableHead>Driver</TableHead>
                              <TableHead className="w-16">Pred</TableHead>
                              <TableHead className="w-16">Conf</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {qualifyingData.map((driver, idx) => {
                              const prediction = predictions.find(p => p.driver_name === driver.driver_name);
                              return (
                                <TableRow key={driver.driver_name}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-1">
                                      <span>{driver.qualifying_position}</span>
                                      {driver.data_source === 'starting_grid' && (
                                        <span title="Real starting grid position">
                                          <Flag className="text-blue-400 w-3 h-3" />
                                        </span>
                                      )}
                                      {driver.data_source === 'real_qualifying' && (
                                        <span className="text-green-400 text-xs" title="Real qualifying position">✅</span>
                                      )}
                                      {driver.fallback && !driver.data_source && (
                                        <span className="text-yellow-400 text-xs" title="Based on driver list order">📋</span>
                                      )}
                                      {driver.fastest_lap && !driver.data_source && (
                                        <span className="text-blue-400 text-xs" title="Based on fastest lap time">⏱️</span>
                                      )}
                                      {!driver.fallback && !driver.fastest_lap && !driver.data_source && (
                                        <span title="Real grid position">
                                          <Flag className="text-green-400 w-3 h-3" />
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: F1_TEAM_COLORS[driver.constructor] || '#808080' }}
                                        title={`Team: ${driver.constructor} | Color: ${F1_TEAM_COLORS[driver.constructor] || 'Not found'}`}
                                      />
                                      <span className="text-sm">{driver.driver_name.split(' ')[1]}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-bold">
                                    {prediction?.predicted_position_int || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={prediction?.confidence === 'High' ? 'default' : 
                                              prediction?.confidence === 'Medium' ? 'secondary' : 'outline'}
                                      className="text-xs"
                                    >
                                      {prediction?.confidence || 'N/A'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Predicted Race Finish</CardTitle>
                        <CardDescription>ML Model Predictions (Sorted by Predicted Position)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {predictions.slice(0, 20).map((prediction, idx) => (
                            <div key={prediction.driver_name} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                                  {idx + 1}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: F1_TEAM_COLORS[prediction.constructor] || '#FFFFFF' }}
                                  />
                                  <span className="font-medium text-sm">{prediction.driver_name}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-mono text-green-400">
                                  P{prediction.predicted_position.toFixed(1)}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Q{prediction.qualifying_position} → P{prediction.predicted_position_int}
                                </div>
                                <div className="text-xs text-gray-500">
                                  🤖 ML
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {predictions.length > 0 && (
                  <div className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5 text-green-500" />
                          Predictions vs Actual Results
                        </CardTitle>
                        <CardDescription>
                          How did our ML model perform compared to the real race outcome?
                          {!actualRaceResults && (
                            <span className="text-yellow-400 text-sm mt-1 block">
                              ⚠️ No matching race results found for comparison
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {actualRaceResults ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-3 text-sm text-gray-400">Accuracy Analysis</h4>
                            <div className="space-y-3">
                              {(() => {
                                const actualResults = actualRaceResults?.Results || [];
                                
                                const accuracyData = predictions.map(pred => {
                                  // Try multiple matching strategies
                                  const predDriverLastName = pred.driver_name.split(' ').pop()?.toUpperCase() || '';
                                  const predDriverFullName = pred.driver_name.toUpperCase();
                                  
                                  const actualResult = actualResults.find((result: any) => {
                                    const resultFamilyName = result.Driver.familyName.toUpperCase();
                                    const resultFullName = `${result.Driver.givenName} ${result.Driver.familyName}`.toUpperCase();
                                    
                                    // Try matching by family name, full name, or driver number in name
                                    return resultFamilyName === predDriverLastName ||
                                           resultFullName === predDriverFullName ||
                                           resultFamilyName.includes(predDriverLastName) ||
                                           predDriverLastName.includes(resultFamilyName) ||
                                           result.driver_number && pred.driver_name.includes(result.driver_number.toString());
                                  });
                                  
                                  const actualPosition = actualResult ? parseInt(actualResult.position) : null;
                                  const predictedPosition = pred.predicted_position_int;
                                  const difference = actualPosition ? Math.abs(actualPosition - predictedPosition) : null;
                                  
                                  return {
                                    driver: pred.driver_name,
                                    predicted: predictedPosition,
                                    actual: actualPosition,
                                    difference: difference,
                                    accurate: difference !== null && difference <= 2
                                  };
                                }).filter(item => item.actual !== null);

                                const exactMatches = accuracyData.filter(item => item.difference === 0).length;
                                const within1 = accuracyData.filter(item => item.difference !== null && item.difference <= 1).length;
                                const within2 = accuracyData.filter(item => item.difference !== null && item.difference <= 2).length;
                                const totalPredictions = accuracyData.length;

                                return (
                                  <>
                                    <div className="flex justify-between items-center p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                                      <span className="text-sm">Exact Predictions</span>
                                      <span className="font-bold text-green-400">{exactMatches}/{totalPredictions}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                                      <span className="text-sm">Within ±1 Position</span>
                                      <span className="font-bold text-blue-400">{within1}/{totalPredictions}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                                      <span className="text-sm">Within ±2 Positions</span>
                                      <span className="font-bold text-purple-400">{within2}/{totalPredictions}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-900/20 border border-gray-700/50 rounded-lg">
                                      <span className="text-sm">Overall Accuracy</span>
                                      <span className="font-bold text-gray-300">{totalPredictions > 0 ? Math.round((within2 / totalPredictions) * 100) : 0}%</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-3 text-sm text-gray-400">Position Comparison</h4>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {(() => {
                                const actualResults = actualRaceResults?.Results || [];
                                
                                // Only show drivers that have BOTH predictions AND actual results
                                const matchedDrivers = predictions.filter(pred => {
                                  const predDriverLastName = pred.driver_name.split(' ').pop()?.toUpperCase() || '';
                                  const predDriverFullName = pred.driver_name.toUpperCase();
                                  
                                  const actualResult = actualResults.find((result: any) => {
                                    const resultFamilyName = result.Driver.familyName.toUpperCase();
                                    const resultGivenName = result.Driver.givenName?.toUpperCase() || '';
                                    const resultFullName = `${resultGivenName} ${resultFamilyName}`.toUpperCase();
                                    
                                    // More flexible matching - try multiple strategies
                                    return resultFamilyName === predDriverLastName ||                    // NORRIS = NORRIS
                                           resultFullName === predDriverFullName ||                     // LANDO NORRIS = LANDO NORRIS  
                                           resultFamilyName.includes(predDriverLastName) ||             // HULKENBERG includes HULK
                                           predDriverLastName.includes(resultFamilyName) ||             // VERSTAPPEN includes VER
                                           predDriverFullName.includes(resultFamilyName) ||             // LANDO NORRIS includes NORRIS
                                           resultFullName.includes(predDriverLastName);                 // LANDO NORRIS includes NORRIS
                                  });
                                  
                                  return actualResult !== undefined; // Only include if we found a match
                                }).map(pred => {
                                  // Now we know this prediction has a matching actual result
                                  const predDriverLastName = pred.driver_name.split(' ').pop()?.toUpperCase() || '';
                                  const predDriverFullName = pred.driver_name.toUpperCase();
                                  
                                  const actualResult = actualResults.find((result: any) => {
                                    const resultFamilyName = result.Driver.familyName.toUpperCase();
                                    const resultGivenName = result.Driver.givenName?.toUpperCase() || '';
                                    const resultFullName = `${resultGivenName} ${resultFamilyName}`.toUpperCase();
                                    
                                    return resultFamilyName === predDriverLastName ||
                                           resultFullName === predDriverFullName ||
                                           resultFamilyName.includes(predDriverLastName) ||
                                           predDriverLastName.includes(resultFamilyName) ||
                                           predDriverFullName.includes(resultFamilyName) ||
                                           resultFullName.includes(predDriverLastName);
                                  });
                                  
                                  const actualPosition = actualResult ? parseInt(actualResult.position) : null;
                                  const difference = actualPosition ? Math.abs(actualPosition - pred.predicted_position_int) : null;
                                  
                                  return (
                                    <div key={pred.driver_name} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full" 
                                          style={{ backgroundColor: F1_TEAM_COLORS[pred.constructor] || '#FFFFFF' }}
                                        />
                                        <span className="text-sm font-medium">{pred.driver_name.split(' ')[1]}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-sm">
                                        <span className="text-blue-400">P{pred.predicted_position_int}</span>
                                        <span className="text-gray-500">→</span>
                                        <span className={actualPosition ? "text-green-400" : "text-gray-500"}>
                                          {actualPosition ? `P${actualPosition}` : 'DNF/DNS'}
                                        </span>
                                        {difference !== null && (
                                          <span className={`text-xs px-2 py-1 rounded ${
                                            difference === 0 ? 'bg-green-900 text-green-300' :
                                            difference <= 1 ? 'bg-blue-900 text-blue-300' :
                                            difference <= 2 ? 'bg-purple-900 text-purple-300' :
                                            'bg-red-900 text-red-300'
                                          }`}>
                                            {difference === 0 ? '✓' : `±${difference}`}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                });
                                
                                if (matchedDrivers.length === 0) {
                                  return (
                                    <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                                      <p className="text-sm text-yellow-400">
                                        No driver matches found between predictions and race results.
                                      </p>
                                    </div>
                                  );
                                }
                                
                                return matchedDrivers;
                              })()}
                            </div>
                          </div>
                        </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Predictions generated successfully!</p>
                            <p className="text-sm">No race results available for accuracy comparison</p>
                            <div className="mt-4 text-left space-y-2">
                              {predictions.slice(0, 10).map((pred, idx) => (
                                <div key={pred.driver_name} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: F1_TEAM_COLORS[pred.constructor] || '#FFFFFF' }}
                                    />
                                    <span className="text-sm font-medium">{pred.driver_name.split(' ')[1]}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-blue-400">P{pred.predicted_position_int}</span>
                                    <span className="text-gray-500 ml-2">({pred.predicted_position.toFixed(1)})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                    <div className="font-medium text-green-400">Strong Performance</div>
                    <div className="text-sm text-gray-300">40.1% accuracy within ±2 positions exceeds industry standards</div>
                  </div>
                  <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <div className="font-medium text-blue-400">Production Ready</div>
                    <div className="text-sm text-gray-300">Model shows consistent performance across different circuits and conditions</div>
                  </div>
                  <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                    <div className="font-medium text-purple-400">Feature Engineering</div>
                    <div className="text-sm text-gray-300">47 engineered features capture complex F1 race dynamics</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Limitations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <div className="font-medium text-yellow-400">Weather Impact</div>
                    <div className="text-sm text-gray-300">Rain and changing conditions can significantly affect predictions</div>
                  </div>
                  <div className="p-3 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                    <div className="font-medium text-orange-400">DNF Events</div>
                    <div className="text-sm text-gray-300">Model doesn't predict mechanical failures or crashes</div>
                  </div>
                  <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                    <div className="font-medium text-red-400">Strategy Calls</div>
                    <div className="text-sm text-gray-300">Unexpected pit strategies can change race outcomes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">Loading Real F1 Data...</div>
          <div className="text-sm text-gray-400">{dataStatus}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900">
        <div className="container mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 min-w-0 flex-shrink">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Flag className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-red-600 flex-shrink-0" />
                <h1 className="hidden xs:block text-sm sm:text-lg md:text-2xl font-bold truncate">F1 Dashboard</h1>
                <h1 className="xs:hidden text-sm font-bold">F1 Stats</h1>
              </div>
              <Badge variant="secondary" className="hidden md:inline-flex text-xs">Live API Data</Badge>
            </div>
            
            {/* Navigation - Mobile optimized */}
            <nav className="flex items-center flex-shrink-0 max-w-[70%] sm:max-w-none">
              <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide pr-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                <style jsx>{`
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <Button
                  variant={currentPage === "dashboard" ? "default" : "ghost"}
                  onClick={() => setCurrentPage("dashboard")}
                  className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 h-7 sm:h-8 min-w-0 flex-shrink-0 flex items-center gap-1"
                >
                  <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <Button
                  variant={currentPage === "standings" ? "default" : "ghost"}
                  onClick={() => setCurrentPage("standings")}
                  className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 h-7 sm:h-8 min-w-0 flex-shrink-0 flex items-center gap-1"
                >
                  <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Standings</span>
                </Button>
                <Button 
                  variant={currentPage === "positions" ? "default" : "ghost"} 
                  onClick={() => setCurrentPage("positions")}
                  className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 h-7 sm:h-8 min-w-0 flex-shrink-0 flex items-center gap-1"
                >
                  <LineChart className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Charts</span>
                </Button>
                <Button 
                  variant={currentPage === "races" ? "default" : "ghost"} 
                  onClick={() => setCurrentPage("races")}
                  className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 h-7 sm:h-8 min-w-0 flex-shrink-0 flex items-center gap-1"
                >
                  <CircuitBoard className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Races</span>
                </Button>
                <Button 
                  variant={currentPage === "predictor" ? "default" : "ghost"} 
                  onClick={() => setCurrentPage("predictor")}
                  className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-3 h-7 sm:h-8 min-w-0 flex-shrink-0 flex items-center gap-1"
                >
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">ML Predictor</span>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        {currentPage === "dashboard" && renderDashboard()}
        {currentPage === "standings" && renderStandings()}
        {currentPage === "positions" && renderPositionChart()}
        {currentPage === "races" && renderRaces()}
        {currentPage === "predictor" && renderMLPredictor()}
      </main>
    </div>
  );
}
