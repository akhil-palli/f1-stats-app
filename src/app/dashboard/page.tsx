"use client";

import React, { useState, useEffect } from 'react';
import PlotWrapper from '../../components/PlotWrapper';

type Session = {
  session_key: number;
  meeting_key: number;
  session_name: string;
  date_start: string;
  location: string;
  country_name: string;
  circuit_short_name: string;
  date_end: string;
};

type Driver = {
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  broadcast_name: string;
};

type PositionData = {
  driver_number: number;
  position: number;
  date: string;
};

type IntervalData = {
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  date: string;
};

type CarData = {
  driver_number: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  date: string;
};

type WeatherData = {
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  date: string;
};

// F1 team colors mapping (2025 season)
const F1_TEAM_COLORS: Record<string, string> = {
  'Red Bull Racing': '#3671C6',
  'McLaren': '#FF8000',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'Aston Martin': '#229971',
  'Alpine': '#0093CC',
  'Williams': '#64C4FF',
  'RB F1 Team': '#6692FF',
  'Kick Sauber': '#52E252',
  'Haas F1 Team': '#B6BABD'
};

export default function Dashboard() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [intervals, setIntervals] = useState<IntervalData[]>([]);
  const [carData, setCarData] = useState<CarData[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto-refresh data every 10 seconds when a session is selected
  useEffect(() => {
    if (!selectedSession) return;

    const interval = setInterval(() => {
      if (selectedSession.session_name === 'Race') {
        fetchDashboardData();
      }
    }, 10000); // 10 seconds for demo purposes

    return () => clearInterval(interval);
  }, [selectedSession]);

  // Fetch data when session changes
  useEffect(() => {
    if (selectedSession) {
      fetchDashboardData();
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('https://api.openf1.org/v1/sessions?year=2025&session_name=Race');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const sessionData = await response.json();
      
      const transformedSessions = sessionData.slice(0, 10).map((session: any) => ({
        session_key: session.session_key,
        meeting_key: session.meeting_key,
        session_name: session.session_name,
        date_start: session.date_start,
        date_end: session.date_end,
        location: session.location,
        country_name: session.country_name,
        circuit_short_name: session.circuit_short_name
      }));
      
      setSessions(transformedSessions);
      if (transformedSessions.length > 0) {
        setSelectedSession(transformedSessions[0]);
      }
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!selectedSession) return;

    try {
      // Fetch drivers
      const driversResponse = await fetch(`https://api.openf1.org/v1/drivers?session_key=${selectedSession.session_key}`);
      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        setDrivers(driversData);
      }

      // Fetch current positions (last 20 records)
      const positionsResponse = await fetch(`https://api.openf1.org/v1/position?session_key=${selectedSession.session_key}`);
      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json();
        setPositions(positionsData.slice(-40)); // Last 40 position updates
      }

      // Fetch intervals
      const intervalsResponse = await fetch(`https://api.openf1.org/v1/intervals?session_key=${selectedSession.session_key}`);
      if (intervalsResponse.ok) {
        const intervalsData = await intervalsResponse.json();
        setIntervals(intervalsData.slice(-20)); // Last 20 interval updates
      }

      // Fetch recent car data
      const carDataResponse = await fetch(`https://api.openf1.org/v1/car_data?session_key=${selectedSession.session_key}`);
      if (carDataResponse.ok) {
        const carDataRaw = await carDataResponse.json();
        setCarData(carDataRaw.slice(-60)); // Last 60 car data points
      }

      // Fetch weather
      const weatherResponse = await fetch(`https://api.openf1.org/v1/weather?session_key=${selectedSession.session_key}`);
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        if (weatherData.length > 0) {
          setWeather(weatherData[weatherData.length - 1]); // Latest weather
        }
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const getCurrentLeaderboard = () => {
    const latestPositions = new Map<number, PositionData>();
    
    // Get the latest position for each driver
    positions.forEach(pos => {
      const existing = latestPositions.get(pos.driver_number);
      if (!existing || new Date(pos.date) > new Date(existing.date)) {
        latestPositions.set(pos.driver_number, pos);
      }
    });

    return Array.from(latestPositions.values())
      .sort((a, b) => a.position - b.position)
      .slice(0, 20);
  };

  const getSpeedChart = () => {
    const speedByDriver = new Map<number, CarData[]>();
    
    carData.forEach(data => {
      if (!speedByDriver.has(data.driver_number)) {
        speedByDriver.set(data.driver_number, []);
      }
      speedByDriver.get(data.driver_number)!.push(data);
    });

    const traces = Array.from(speedByDriver.entries()).map(([driverNumber, data]) => {
      const driver = drivers.find(d => d.driver_number === driverNumber);
      const teamColor = driver ? F1_TEAM_COLORS[driver.team_name] || '#FFFFFF' : '#FFFFFF';
      
      return {
        x: data.map(d => new Date(d.date)),
        y: data.map(d => d.speed),
        type: 'scatter',
        mode: 'lines',
        name: driver ? driver.name_acronym : `#${driverNumber}`,
        line: {
          color: teamColor,
          width: 2,
          shape: 'linear'
        },
        hovertemplate: `<b>${driver ? driver.name_acronym : driverNumber}</b><br>Speed: %{y} km/h<br>Time: %{x}<extra></extra>`,
        connectgaps: true
      };
    });

    return traces;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center">
        <div className="text-xl">Loading F1 Dashboard...</div>
      </div>
    );
  }

  const currentLeaderboard = getCurrentLeaderboard();
  const speedTraces = getSpeedChart();

  return (
    <div className="min-h-screen bg-gray-800 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">🏁 F1 Live Dashboard</h1>
        
        {/* Session Selector */}
        <div className="bg-gray-900 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-3">Select Session</h3>
          <div className="flex flex-wrap gap-2">
            {sessions.map((session) => (
              <button
                key={session.session_key}
                onClick={() => setSelectedSession(session)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedSession?.session_key === session.session_key
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div>{session.circuit_short_name}</div>
                <div className="text-xs opacity-75">
                  {session.session_name} - {new Date(session.date_start).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Status Bar */}
        {selectedSession && (
          <div className="bg-gray-900 p-4 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-green-400 font-bold">● LIVE</span>
              <span className="ml-4">{selectedSession.circuit_short_name} - {selectedSession.session_name}</span>
            </div>
            <div className="text-sm text-gray-400">
              Last Update: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Leaderboard */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">📊 Live Positions</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentLeaderboard.map((pos) => {
              const driver = drivers.find(d => d.driver_number === pos.driver_number);
              const interval = intervals.find(i => i.driver_number === pos.driver_number);
              const teamColor = driver ? F1_TEAM_COLORS[driver.team_name] || '#FFFFFF' : '#FFFFFF';
              
              return (
                <div key={pos.driver_number} className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <div className="font-bold text-lg w-8 text-center">{pos.position}</div>
                  <div 
                    className="w-4 h-4 rounded-sm border border-gray-600" 
                    style={{ backgroundColor: teamColor }}
                  ></div>
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      {driver ? driver.name_acronym : `#${pos.driver_number}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      {driver?.team_name || 'Unknown Team'}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {interval?.gap_to_leader !== null && interval?.gap_to_leader !== undefined ? (
                      pos.position === 1 ? (
                        <span className="text-green-400">Leader</span>
                      ) : (
                        <span className="text-orange-400">+{interval.gap_to_leader.toFixed(3)}s</span>
                      )
                    ) : (
                      <span className="text-gray-500">--</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weather & Track Conditions */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🌤️ Track Conditions</h3>
          {weather ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-2xl font-bold text-orange-400">{weather.air_temperature}°C</div>
                  <div className="text-sm text-gray-400">Air Temp</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-2xl font-bold text-red-400">{weather.track_temperature}°C</div>
                  <div className="text-sm text-gray-400">Track Temp</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-400">{weather.humidity}%</div>
                  <div className="text-sm text-gray-400">Humidity</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-2xl font-bold text-green-400">{weather.wind_speed} m/s</div>
                  <div className="text-sm text-gray-400">Wind Speed</div>
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="flex items-center justify-between">
                  <span>Rainfall</span>
                  <span className={`font-bold ${weather.rainfall ? 'text-blue-400' : 'text-green-400'}`}>
                    {weather.rainfall ? '🌧️ WET' : '☀️ DRY'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">No weather data available</div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">⚡ Quick Stats</h3>
          <div className="space-y-4">
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-lg font-bold text-yellow-400">{drivers.length}</div>
              <div className="text-sm text-gray-400">Active Drivers</div>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-lg font-bold text-purple-400">{positions.length}</div>
              <div className="text-sm text-gray-400">Position Updates</div>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-lg font-bold text-cyan-400">{carData.length}</div>
              <div className="text-sm text-gray-400">Telemetry Points</div>
            </div>
            {selectedSession && (
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-lg font-bold text-green-400">
                  {selectedSession.circuit_short_name}
                </div>
                <div className="text-sm text-gray-400">Current Circuit</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Speed Chart */}
      {speedTraces.length > 0 && (
        <div className="mt-6 bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🏎️ Live Speed Telemetry</h3>
          <div className="h-96">
            <PlotWrapper
              data={speedTraces}
              layout={{
                title: {
                  text: 'Driver Speed Over Time',
                  font: { color: '#FFFFFF', size: 16 }
                },
                paper_bgcolor: '#1f2937',
                plot_bgcolor: '#1f2937',
                font: { color: '#CCCCCC' },
                xaxis: {
                  title: 'Time',
                  gridcolor: '#374151',
                  color: '#CCCCCC',
                  type: 'date'
                },
                yaxis: {
                  title: 'Speed (km/h)',
                  gridcolor: '#374151',
                  color: '#CCCCCC'
                },
                legend: {
                  x: 1.02,
                  y: 1,
                  bgcolor: 'rgba(0,0,0,0)',
                  bordercolor: 'rgba(0,0,0,0)',
                  font: { color: '#FFFFFF', size: 10 }
                },
                margin: { l: 60, r: 50, t: 40, b: 60 }
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                responsive: true
              }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}
