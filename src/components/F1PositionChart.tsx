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

  // Fetch available sessions
  useEffect(() => {
    async function fetchSessions() {
      try {
        // Fetch all 2025 F1 sessions (includes practice, qualifying, sprint, and race)
        const response = await fetch('https://api.openf1.org/v1/sessions?year=2025');
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const sessionList = await response.json();
        
        // Sort sessions by date (most recent first) and take more sessions
        const sortedSessions = sessionList.sort((a: any, b: any) => 
          new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
        );
        
        // Transform the data to match our expected format
        const transformedSessions = sortedSessions.slice(0, 20).map((session: any) => ({
          session_key: session.session_key,
          meeting_key: session.meeting_key,
          session_name: session.session_name,
          date_start: session.date_start,
          date_end: session.date_end,
          location: session.location,
          country_name: session.country_name,
          circuit_short_name: session.circuit_short_name,
          session_type: session.session_type
        }));
        
        setSessions(transformedSessions);
        
        // Auto-select the most recent session
        if (transformedSessions.length > 0) {
          setSelectedSession(transformedSessions[0]);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load sessions');
      } finally {
        setIsLoadingSessions(false);
      }
    }
    fetchSessions();
  }, []);

  // Fetch position data when session changes
  useEffect(() => {
    async function fetchData() {
      if (!selectedSession) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch directly from OpenF1 API
        const url = `https://api.openf1.org/v1/position?session_key=${selectedSession.session_key}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch position data');
        
        const rawData = await response.json();
        console.log(`Fetched ${rawData.length} position records`);
        
        if (rawData.length === 0) {
          const sessionDate = new Date(selectedSession.date_start);
          const isUpcoming = sessionDate > new Date();
          
          if (isUpcoming) {
            setError(`This session is scheduled for ${sessionDate.toLocaleDateString()} at ${sessionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Position data will be available during or after the session.`);
          } else {
            setError('No position data available for this session');
          }
          return;
        }
        
        // Add driver names using our 2025 season mapping
        const DRIVER_MAP: Record<number, string> = {
          // 2025 F1 Season Driver Numbers
          1: 'Max Verstappen',        // Red Bull Racing
          30: 'Liam Lawson',          // Red Bull Racing
          4: 'Lando Norris',          // McLaren
          81: 'Oscar Piastri',        // McLaren
          16: 'Charles Leclerc',      // Ferrari
          44: 'Lewis Hamilton',       // Ferrari
          63: 'George Russell',       // Mercedes
          12: 'Kimi Antonelli',       // Mercedes
          14: 'Fernando Alonso',      // Aston Martin
          18: 'Lance Stroll',         // Aston Martin
          10: 'Pierre Gasly',         // Alpine
          7: 'Jack Doohan',           // Alpine
          23: 'Alex Albon',           // Williams
          55: 'Carlos Sainz',         // Williams
          22: 'Yuki Tsunoda',         // RB F1 Team
          6: 'Isack Hadjar',          // RB F1 Team
          27: 'Nico Hulkenberg',      // Kick Sauber
          5: 'Gabriel Bortoleto',     // Kick Sauber
          31: 'Esteban Ocon',         // Haas
          87: 'Oliver Bearman',       // Haas
          
          // Legacy drivers that might appear in historical data
          11: 'Sergio Perez',         // Former Red Bull
          77: 'Valtteri Bottas',      // Former Kick Sauber
          24: 'Zhou Guanyu',          // Former Kick Sauber
          2: 'Logan Sargeant',        // Former Williams
          3: 'Daniel Ricciardo',      // Former RB F1 Team
          20: 'Kevin Magnussen',      // Former Haas
          47: 'Mick Schumacher',      // Reserve
          43: 'Franco Colapinto',     // Former Williams
          21: 'Nyck de Vries'         // Former
        };
        
        // Process data and add driver names
        const processedData: ProcessedDriver[] = rawData.map((d: any) => ({
          date: new Date(d.date),
          position: d.position,
          driver_name: DRIVER_MAP[d.driver_number] || `Driver ${d.driver_number}`,
          driver_number: d.driver_number,
          driver_id: `${DRIVER_MAP[d.driver_number] || `Driver ${d.driver_number}`}_${d.driver_number}`
        }));
        
        // Get unique drivers
        const uniqueDrivers = [...new Set(processedData.map(d => d.driver_name))];
        
        // Find the latest timestamp across all data
        const maxDate = new Date(Math.max(...processedData.map(d => d.date.getTime())));
        
        // Extend each driver's line to the end with their last known position
        const extendedData: ProcessedDriver[] = [];
        const driverLastPositions = new Map<string, { position: number; date: Date }>();
        
        // First, collect all original data and find last position for each driver
        processedData.forEach(d => {
          extendedData.push(d);
          const existing = driverLastPositions.get(d.driver_id);
          if (!existing || d.date.getTime() > existing.date.getTime()) {
            driverLastPositions.set(d.driver_id, { position: d.position, date: d.date });
          }
        });
        
        // Add extended points for each driver to the max date (plus 5 minutes buffer)
        const chartEndTime = new Date(maxDate.getTime() + 5 * 60 * 1000);
        
        driverLastPositions.forEach((lastData, driverId) => {
          const driverInfo = processedData.find(d => d.driver_id === driverId);
          if (driverInfo && lastData.date.getTime() < chartEndTime.getTime()) {
            extendedData.push({
              ...driverInfo,
              date: chartEndTime,
              position: lastData.position,
              driver_id: driverId
            });
          }
        });
        
        // Sort by date for proper line rendering
        extendedData.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        console.log(`Extended data: ${processedData.length} -> ${extendedData.length} records`);
        setData(extendedData);
        setSessionInfo({
          session_key: selectedSession.session_key,
          meeting_key: selectedSession.meeting_key,
          total_records: rawData.length,
          drivers: uniqueDrivers
        });
        
      } catch (err) {
        setError('Error fetching position data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (selectedSession) {
      fetchData();
    }
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
          <div className="flex">
            {/* Main Chart */}
            <div className="flex-1">
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
                      size: 20,
                      color: '#FFFFFF'
                    },
                    x: 0.02,
                    xanchor: 'left'
                  },
                  width: 1200,
                  height: 800,
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
                    l: 80,
                    r: 50,
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
                        size: 14,
                        family: 'Arial, sans-serif'
                      },
                      xanchor: 'right' as const,
                      yanchor: 'middle' as const,
                      xshift: -15
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
                    height: 800,
                    width: 1200,
                    scale: 2
                  },
                  responsive: true
                }}
                style={{ width: '100%', height: '800px' }}
              />
            </div>
            
            {/* Driver Legend */}
            <div className="w-80 p-4 bg-gray-800 border-l border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Drivers</h4>
              <div className="space-y-2 max-h-[760px] overflow-y-auto">
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
                    <div key={driverName} className="flex items-center gap-3 p-2 rounded bg-gray-900">
                      {/* Color indicator */}
                      <div 
                        className="w-4 h-4 rounded-sm border border-gray-600" 
                        style={{ backgroundColor: color }}
                      ></div>
                      
                      {/* Driver info */}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{driverName}</div>
                        <div className="text-xs text-gray-400">
                          #{driverNumber} • P{currentPosition}
                        </div>
                      </div>
                      
                      {/* Position indicator */}
                      <div className="text-lg font-bold text-gray-300 min-w-[2rem] text-center">
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