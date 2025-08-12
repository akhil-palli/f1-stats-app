"use client";

import React, { useEffect, useState } from 'react';
import PlotWrapper from './PlotWrapper';

type Driver = {
  date: string;
  position: number;
  driver_name: string;
  driver_number: number;
  driver_id?: string; // Added for unique identification
};

type ProcessedDriver = {
  date: Date;
  position: number;
  driver_name: string;
  driver_number: number;
  driver_id: string;
};

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
  round?: string; // Added for Ergast API compatibility
};

type PositionResponse = {
  data: Driver[];
  session_info: {
    session_key?: number;
    meeting_key?: number;
    total_records: number;
    drivers: string[];
  };
};

// F1 team colors mapping (2025 season - updated team colors)
const F1_TEAM_COLORS: Record<string, string> = {
  // Red Bull Racing (RB21)
  'Max Verstappen': '#3671C6',
  'Liam Lawson': '#3671C6',
  
  // McLaren (MCL39)
  'Lando Norris': '#FF8000',
  'Oscar Piastri': '#FF8000',
  
  // Ferrari (SF-25)
  'Charles Leclerc': '#E8002D',
  'Lewis Hamilton': '#E8002D',
  
  // Mercedes (W16)
  'George Russell': '#27F4D2',
  'Kimi Antonelli': '#27F4D2',
  
  // Aston Martin (AMR25)
  'Fernando Alonso': '#229971',
  'Lance Stroll': '#229971',
  
  // Alpine (A525)
  'Pierre Gasly': '#0093CC',
  'Jack Doohan': '#0093CC',
  
  // Williams (FW47)
  'Alex Albon': '#64C4FF',
  'Carlos Sainz': '#64C4FF',
  
  // RB F1 Team (VCARB 01)
  'Yuki Tsunoda': '#6692FF',
  'Isack Hadjar': '#6692FF',
  
  // Kick Sauber (C45)
  'Nico Hulkenberg': '#52E252',
  'Gabriel Bortoleto': '#52E252',
  
  // Haas (VF-25)
  'Esteban Ocon': '#B6BABD',
  'Oliver Bearman': '#B6BABD',
  
  // Legacy/Reserve drivers that might appear
  'Sergio Perez': '#3671C6',
  'Valtteri Bottas': '#52E252',
  'Zhou Guanyu': '#52E252',
  'Logan Sargeant': '#64C4FF',
  'Daniel Ricciardo': '#6692FF',
  'Kevin Magnussen': '#B6BABD',
  'Mick Schumacher': '#E8002D',
  'Franco Colapinto': '#64C4FF',
  'Nyck de Vries': '#6692FF'
};

export default function F1PositionChart() {
  const [data, setData] = useState<ProcessedDriver[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionInfo, setSessionInfo] = useState<PositionResponse['session_info'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available races (sessions)
  useEffect(() => {
    async function fetchSessions() {
      try {
        // Fetch 2025 F1 race calendar from Jolpica-F1 API
        const response = await fetch('https://api.jolpi.ca/ergast/f1/2025.json');
        if (!response.ok) throw new Error('Failed to fetch races');
        const data = await response.json();
        const races = data.MRData.RaceTable.Races;
        
        // Transform races to session format, including only completed races
        const currentDate = new Date();
        const transformedSessions = races
          .filter((race: any) => {
            const raceDate = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
            return raceDate < currentDate; // Only show completed races
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00:00Z'}`);
            const dateB = new Date(`${b.date}T${b.time || '00:00:00Z'}`);
            return dateB.getTime() - dateA.getTime(); // Most recent first
          })
          .slice(0, 10) // Show last 10 completed races
          .map((race: any) => ({
            session_key: parseInt(race.round), // Use round as session key
            meeting_key: parseInt(race.round),
            session_name: `${race.raceName} - Race`,
            date_start: `${race.date}T${race.time || '00:00:00Z'}`,
            date_end: `${race.date}T${race.time || '00:00:00Z'}`,
            location: race.Circuit.Location.locality,
            country_name: race.Circuit.Location.country,
            circuit_short_name: race.Circuit.circuitName.replace(' Circuit', '').replace(' Grand Prix Circuit', ''),
            session_type: 'Race',
            round: race.round
          }));
        
        setSessions(transformedSessions);
        
        // Auto-select the most recent completed race
        if (transformedSessions.length > 0) {
          setSelectedSession(transformedSessions[0]);
        }
      } catch (err) {
        console.error('Error fetching races:', err);
        setError('Failed to load race calendar');
      } finally {
        setIsLoadingSessions(false);
      }
    }
    fetchSessions();
  }, []);

  // Fetch lap-by-lap position data when race changes
  useEffect(() => {
    async function fetchData() {
      if (!selectedSession) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch lap data from Jolpica-F1 API (Ergast)
        // The API limits individual timing records (not laps), so we need pagination
        let allLaps: any[] = [];
        let offset = 0;
        const limit = 100; // Maximum allowed by API (this limits individual timing records)
        let hasMoreData = true;
        
        while (hasMoreData) {
          const url = `https://api.jolpi.ca/ergast/f1/2025/${selectedSession.round}/laps.json?limit=${limit}&offset=${offset}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch lap data');
          
          const data = await response.json();
          const laps = data.MRData.RaceTable.Races[0]?.Laps || [];
          const totalRecords = parseInt(data.MRData.total);
          
          allLaps = allLaps.concat(laps);
          
          // Calculate how many timing records we've fetched
          const recordsFetched = allLaps.reduce((sum, lap) => sum + lap.Timings.length, 0);
          
          console.log(`📥 Fetched ${laps.length} laps with ${recordsFetched} total timing records (offset: ${offset}, total available: ${totalRecords})`);
          
          // Check if we've fetched all available data
          hasMoreData = recordsFetched < totalRecords && laps.length > 0;
          offset += limit;
          
          // Safety break to prevent infinite loops  
          if (offset > totalRecords * 2) break;
        }
        
        console.log(`📊 Race ${selectedSession.round}: Fetched ${allLaps.length} total laps`);
        
        if (allLaps.length === 0) {
          setError('No lap data available for this race');
          return;
        }

        // Driver ID to name mapping for Ergast data
        const DRIVER_ID_MAP: Record<string, string> = {
          'max_verstappen': 'Max Verstappen',
          'lawson': 'Liam Lawson', 
          'norris': 'Lando Norris',
          'piastri': 'Oscar Piastri',
          'leclerc': 'Charles Leclerc',
          'hamilton': 'Lewis Hamilton',
          'russell': 'George Russell',
          'antonelli': 'Kimi Antonelli',
          'alonso': 'Fernando Alonso',
          'stroll': 'Lance Stroll',
          'gasly': 'Pierre Gasly',
          'doohan': 'Jack Doohan',
          'albon': 'Alex Albon',
          'sainz': 'Carlos Sainz',
          'tsunoda': 'Yuki Tsunoda',
          'hadjar': 'Isack Hadjar',
          'hulkenberg': 'Nico Hulkenberg',
          'bortoleto': 'Gabriel Bortoleto',
          'ocon': 'Esteban Ocon',
          'bearman': 'Oliver Bearman',
          // Legacy drivers
          'perez': 'Sergio Perez',
          'bottas': 'Valtteri Bottas',
          'zhou': 'Zhou Guanyu',
          'sargeant': 'Logan Sargeant',
          'ricciardo': 'Daniel Ricciardo',
          'magnussen': 'Kevin Magnussen'
        };

        // Convert lap data to position-over-time format
        const positionData: ProcessedDriver[] = [];
        const raceStartTime = new Date(selectedSession.date_start);
        
        allLaps.forEach((lap: any, lapIndex: number) => {
          const lapNumber = parseInt(lap.number);
          // Estimate realistic time progression: first lap ~120s, subsequent laps ~75s average
          const estimatedLapTime = lapIndex === 0 ? 120 : 75;
          const cumulativeTime = lapIndex === 0 ? 120 : 120 + (lapIndex * 75);
          const lapTime = new Date(raceStartTime.getTime() + cumulativeTime * 1000);
          
          lap.Timings.forEach((timing: any) => {
            const driverName = DRIVER_ID_MAP[timing.driverId] || timing.driverId;
            const position = parseInt(timing.position);
            
            positionData.push({
              date: lapTime,
              position: position,
              driver_name: driverName,
              driver_number: 0, // Not available in Ergast, but not critical
              driver_id: timing.driverId
            });
          });
        });

        // Get unique drivers
        const uniqueDrivers = [...new Set(positionData.map(d => d.driver_name))];
        
        console.log(`📈 Processed ${positionData.length} position records from ${allLaps.length} laps for ${uniqueDrivers.length} drivers`);
        
        // Sort data by date for proper chart rendering
        positionData.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        setData(positionData);
        setSessionInfo({
          session_key: selectedSession.session_key,
          meeting_key: selectedSession.meeting_key,
          total_records: positionData.length,
          drivers: uniqueDrivers
        });
        
      } catch (err) {
        console.error('Error fetching lap data:', err);
        setError('Failed to load position data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [selectedSession]);

  if (isLoadingSessions) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-xl">Loading available sessions...</div>
    </div>
  );
  
  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-xl">Loading F1 race data...</div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-xl text-red-600">Error: {error}</div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* Session Selector */}
      <div className="bg-gray-900 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Select F1 Session (2025 Season)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
          {sessions.map((session) => {
            const sessionDate = new Date(session.date_start);
            const isUpcoming = sessionDate > new Date();
            const sessionIcon = session.session_type === 'Race' ? '🏁' : 
                               session.session_type === 'Qualifying' ? '⏱️' : 
                               session.session_type === 'Practice' ? '🔧' : '📊';
            
            return (
              <button
                key={session.session_key}
                onClick={() => setSelectedSession(session)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors text-left ${
                  selectedSession?.session_key === session.session_key
                    ? 'bg-red-600 text-white border border-red-500'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <span>{sessionIcon}</span>
                  <span>{session.circuit_short_name}</span>
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {session.session_name}
                </div>
                <div className="text-xs opacity-60 mt-1">
                  {sessionDate.toLocaleDateString()} {sessionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                {isUpcoming && (
                  <div className="text-xs bg-blue-600 px-2 py-1 rounded mt-2 inline-block">
                    Upcoming
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Session Info */}
        {sessionInfo && selectedSession && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                {new Date(selectedSession.date_start) > new Date() ? (
                  <span className="text-blue-400 font-bold">📅 SCHEDULED</span>
                ) : new Date(selectedSession.date_end) > new Date() ? (
                  <span className="text-green-400 font-bold">● LIVE</span>
                ) : (
                  <span className="text-yellow-400 font-bold">✓ COMPLETED</span>
                )}
                <span className="ml-4 text-white font-medium">
                  {selectedSession.circuit_short_name} - {selectedSession.session_name}
                </span>
                <span className="ml-2 text-xs text-gray-400">
                  ({selectedSession.session_type})
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {sessionInfo.total_records} records • {sessionInfo.drivers.length} drivers
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Container */}
      {data.length > 0 && (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Main Chart */}
            <div className="flex-1 min-h-0">
              <PlotWrapper
                data={
                  // Create a trace for each driver
                  sessionInfo?.drivers.map((driverName) => {
                    const driverData = data
                      .filter(d => d.driver_name === driverName)
                      .sort((a, b) => a.date.getTime() - b.date.getTime());
                    
                    return {
                      x: driverData.map(d => d.date),
                      y: driverData.map(d => d.position),
                      type: 'scatter',
                      mode: 'lines',
                      name: driverName,
                      line: {
                        color: F1_TEAM_COLORS[driverName] || '#FFFFFF',
                        width: 4,
                        shape: 'linear'
                      },
                      hovertemplate: `<b>${driverName}</b><br>` +
                                   'Position: %{y}<br>' +
                                   'Time: %{x|%H:%M:%S}<br>' +
                                   '<extra></extra>',
                      connectgaps: true
                    };
                  }) || []
                }
                layout={{
                  title: {
                    text: 'F1 POSITION CHART',
                    font: {
                      family: 'Arial, sans-serif',
                      size: 16,
                      color: '#FFFFFF'
                    },
                    x: 0.02,
                    xanchor: 'left'
                  },
                  paper_bgcolor: '#1a1a1a',
                  plot_bgcolor: '#1a1a1a',
                  font: {
                    color: '#CCCCCC',
                    family: 'Arial, sans-serif'
                  },
                  xaxis: {
                    title: '',
                    gridcolor: '#2a2a2a',
                    gridwidth: 1,
                    zeroline: false,
                    color: '#CCCCCC',
                    tickformat: '%H:%M',
                    showgrid: true
                  },
                  yaxis: {
                    title: '',
                    autorange: 'reversed',
                    gridcolor: '#2a2a2a',
                    gridwidth: 1,
                    zeroline: false,
                    color: '#CCCCCC',
                    tickmode: 'linear',
                    tick0: 1,
                    dtick: 1,
                    range: [20.5, 0.5],
                    showgrid: true,
                    side: 'left'
                  },
                  legend: {
                    x: 1.02,
                    y: 1,
                    bgcolor: 'rgba(0,0,0,0)',
                    bordercolor: 'rgba(0,0,0,0)',
                    font: {
                      color: '#FFFFFF',
                      size: 12
                    }
                  },
                  hovermode: 'closest',
                  margin: {
                    l: 60,
                    r: 20,
                    t: 60,
                    b: 40
                  },
                  showlegend: false, // We'll use our custom legend
                  annotations: [
                    // Position numbers on the left
                    ...Array.from({length: 20}, (_, i) => ({
                      x: 0,
                      y: i + 1,
                      xref: 'paper' as const,
                      yref: 'y' as const,
                      text: String(i + 1),
                      showarrow: false,
                      font: {
                        color: '#CCCCCC',
                        size: 12,
                        family: 'Arial, sans-serif'
                      },
                      xanchor: 'right' as const,
                      yanchor: 'middle' as const,
                      xshift: -10
                    }))
                  ]
                }}
                config={{
                  displayModeBar: true,
                  displaylogo: false,
                  modeBarButtonsToRemove: [
                    'pan2d', 'lasso2d', 'select2d', 'autoScale2d', 
                    'hoverClosestCartesian', 'hoverCompareCartesian', 'toggleSpikelines'
                  ],
                  toImageButtonOptions: {
                    format: 'png',
                    filename: 'f1-position-chart',
                    height: 600,
                    width: 1000,
                    scale: 2
                  },
                  responsive: true
                }}
                style={{ 
                  width: '100%', 
                  height: '60vh',
                  minHeight: '400px',
                  maxHeight: '800px'
                }}
              />
            </div>
            
            {/* Driver Legend - Responsive sidebar */}
            <div className="w-full lg:w-80 p-4 bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Drivers</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-2 max-h-none lg:max-h-[calc(60vh-80px)] lg:overflow-y-auto">
                {sessionInfo?.drivers.sort().map((driverName) => {
                  const color = F1_TEAM_COLORS[driverName] || '#FFFFFF';
                  // Get current position for this driver (last position in data)
                  const driverData = data.filter(d => d.driver_name === driverName);
                  const currentPosition = driverData.length > 0 
                    ? driverData[driverData.length - 1].position 
                    : '?';
                  const driverNumber = driverData.length > 0 
                    ? driverData[0].driver_number 
                    : '?';
                  
                  return (
                    <div key={driverName} className="flex items-center gap-2 lg:gap-3 p-2 rounded bg-gray-900">
                      {/* Color indicator */}
                      <div 
                        className="w-3 h-3 lg:w-4 lg:h-4 rounded-sm border border-gray-600" 
                        style={{ backgroundColor: color }}
                      ></div>
                      
                      {/* Driver info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs lg:text-sm font-medium text-white truncate">{driverName}</div>
                        <div className="text-xs text-gray-400">
                          #{driverNumber} • P{currentPosition}
                        </div>
                      </div>
                      
                      {/* Position indicator */}
                      <div className="text-sm lg:text-lg font-bold text-gray-300 min-w-[1.5rem] lg:min-w-[2rem] text-center">
                        {currentPosition}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-900 text-gray-300 text-sm border-t border-gray-700">
            <p>• Professional F1 broadcast-style position chart with Plotly.js</p>
            <p>• Smooth line interpolation shows natural racing flow • Hover for driver details • Zoom and pan enabled</p>
          </div>
        </div>
      )}
    </div>
  );
}