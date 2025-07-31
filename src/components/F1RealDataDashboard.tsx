"use client";

import { useState, useEffect } from "react"
import { Trophy, Flag, Users, TrendingUp, Calendar, MapPin, Car, User, Award, Timer, Target, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import F1PositionChart from './F1PositionChart'

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

// F1 team colors mapping (2025 season)
const F1_TEAM_COLORS: Record<string, string> = {
  "Red Bull Racing": "#3671C6",
  "McLaren": "#FF8000", 
  "Ferrari": "#E8002D",
  "Mercedes": "#27F4D2",
  "Aston Martin": "#229971",
  "Alpine": "#0093CC",
  "Williams": "#64C4FF",
  "RB F1 Team": "#6692FF",
  "Kick Sauber": "#52E252",
  "Haas F1 Team": "#B6BABD",
  // Legacy team names from Ergast
  "Red Bull": "#3671C6",
  "AlphaTauri": "#6692FF",
  "Alfa Romeo": "#52E252",
  "Haas": "#B6BABD"
};

export function F1RealDataDashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [sessions, setSessions] = useState<Session[]>([])
  const [driverStandings, setDriverStandings] = useState<ErgastDriverStanding[]>([])
  const [constructorStandings, setConstructorStandings] = useState<ErgastConstructorStanding[]>([])
  const [raceResults, setRaceResults] = useState<ErgastRaceResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dataStatus, setDataStatus] = useState<string>("Loading...")

  // Fetch all data on component mount
  useEffect(() => {
    async function fetchAllData() {
      setIsLoading(true)
      setDataStatus("Fetching 2025 F1 data...")

      try {
        // Fetch OpenF1 sessions
        setDataStatus("Loading race sessions...")
        try {
          const sessionResponse = await fetch('https://api.openf1.org/v1/sessions?year=2025', {
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          });
          if (sessionResponse.ok) {
            const sessionList = await sessionResponse.json();
            const sortedSessions = sessionList.sort((a: any, b: any) => 
              new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
            );
            setSessions(sortedSessions.slice(0, 24));
          }
        } catch (e) {
          console.error("Failed to fetch OpenF1 sessions:", e);
          // Fallback to 2024 sessions
          try {
            const sessionResponse = await fetch('https://api.openf1.org/v1/sessions?year=2024', {
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              }
            });
            if (sessionResponse.ok) {
              const sessionList = await sessionResponse.json();
              const sortedSessions = sessionList.sort((a: any, b: any) => 
                new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
              );
              setSessions(sortedSessions.slice(0, 24));
            }
          } catch (e) {
            console.error("Failed to fetch 2024 sessions:", e);
          }
        }

        // Fetch Ergast driver standings (try 2025, fallback to 2024)
        setDataStatus("Loading driver championship standings...")
        let driverData = null;
        try {
          const driverResponse = await fetch('https://ergast.com/api/f1/2025/driverStandings.json', {
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
        }

        // Fallback to 2024 if 2025 not available
        if (!driverData) {
          try {
            const driverResponse = await fetch('https://ergast.com/api/f1/2024/driverStandings.json', {
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

        // Fetch Ergast constructor standings
        setDataStatus("Loading constructor standings...")
        let constructorData = null;
        try {
          const constructorResponse = await fetch('https://ergast.com/api/f1/2025/constructorStandings.json', {
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
        }

        // Fallback to 2024
        if (!constructorData) {
          try {
            const constructorResponse = await fetch('https://ergast.com/api/f1/2024/constructorStandings.json', {
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

        // Fetch recent race results
        setDataStatus("Loading race results...")
        try {
          const resultsResponse = await fetch('https://ergast.com/api/f1/2025/results.json?limit=100', {
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
            const resultsResponse = await fetch('https://ergast.com/api/f1/2024/results.json?limit=100', {
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

        setDataStatus("Data loaded successfully!");
      } catch (err) {
        console.error('Error fetching F1 data:', err);
        setDataStatus("Error loading data - showing demo");
        
        // Set fallback demo data if APIs fail
        if (driverStandings.length === 0) {
          setDriverStandings([
            {
              position: "1",
              points: "400",
              Driver: { givenName: "Max", familyName: "Verstappen", code: "VER" },
              Constructors: [{ name: "Red Bull Racing" }]
            },
            {
              position: "2", 
              points: "350",
              Driver: { givenName: "Lewis", familyName: "Hamilton", code: "HAM" },
              Constructors: [{ name: "Mercedes" }]
            },
            {
              position: "3",
              points: "300", 
              Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC" },
              Constructors: [{ name: "Ferrari" }]
            }
          ]);
        }
        
        if (constructorStandings.length === 0) {
          setConstructorStandings([
            {
              position: "1",
              points: "600",
              Constructor: { name: "Red Bull Racing" }
            },
            {
              position: "2",
              points: "500", 
              Constructor: { name: "Mercedes" }
            },
            {
              position: "3",
              points: "450",
              Constructor: { name: "Ferrari" }
            }
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllData();
  }, []);

  const renderDashboard = () => {
    const leader = driverStandings[0];
    const constructorLeader = constructorStandings[0];
    const completedRaces = raceResults.filter(race => race.Results && race.Results.length > 0);
    
    return (
      <div className="space-y-8">
        {/* Data Source Notice */}
        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-600">LIVE DATA</Badge>
            <span className="text-sm">
              Championships from Ergast API • Sessions from OpenF1 API • {dataStatus}
            </span>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Championship Leader</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
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
              <div className="text-2xl font-bold">2025 Active</div>
              <p className="text-xs text-gray-400">Formula 1 World Championship</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Races Completed</CardTitle>
              <Flag className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedRaces.length}/24</div>
              <p className="text-xs text-gray-400">2025 Season</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Constructor Leader</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {constructorLeader ? constructorLeader.Constructor.name : "Loading..."}
              </div>
              <p className="text-xs text-gray-400">
                {constructorLeader ? `${constructorLeader.points} points • ${constructorLeader.wins} wins` : "Fetching data..."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Standings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 6 Drivers (Real Standings)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {driverStandings.slice(0, 6).map((standing) => (
                  <div key={standing.Driver.driverId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                        {standing.position}
                      </div>
                      <div>
                        <p className="font-medium">{standing.Driver.givenName} {standing.Driver.familyName}</p>
                        <p className="text-sm text-gray-400">{standing.Constructors[0]?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{standing.points}</p>
                      <p className="text-sm text-gray-400">{standing.wins} wins</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Race Winners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedRaces.slice(-5).reverse().map((race) => {
                  const winner = race.Results?.[0];
                  return (
                    <div key={`${race.season}-${race.round}`} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{race.raceName}</p>
                        <p className="text-sm text-gray-400">{new Date(race.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
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
              Real standings from Ergast API • Updated weekly • 
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
              Real team standings from Ergast API • Updated weekly
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

  const renderRaces = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Race Results & Calendar
          </CardTitle>
          <CardDescription>
            Real race results from Ergast API • Live session data from OpenF1
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {raceResults.map((race) => {
              const winner = race.Results?.[0];
              const hasResults = race.Results && race.Results.length > 0;
              
              return (
                <div
                  key={`${race.season}-${race.round}`}
                  className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-bold">R{race.round}</div>
                      <Badge variant={hasResults ? "default" : "secondary"} className="text-xs">
                        {hasResults ? "Completed" : "Scheduled"}
                      </Badge>
                    </div>
                    <Separator orientation="vertical" className="h-12" />
                    <div>
                      <h3 className="font-semibold text-lg">{race.raceName}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="h-4 w-4" />
                        {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                      </div>
                      <p className="text-sm text-gray-400">{new Date(race.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {winner && (
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">
                          {winner.Driver.givenName} {winner.Driver.familyName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{winner.Constructor.name}</p>
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Flag className="h-8 w-8 text-red-600" />
                <h1 className="text-2xl font-bold">F1 Real Data Dashboard</h1>
              </div>
              <Badge variant="secondary">Live API Data</Badge>
            </div>
            <nav className="hidden md:flex items-center space-x-2">
              <Button
                variant={currentPage === "dashboard" ? "default" : "ghost"}
                onClick={() => setCurrentPage("dashboard")}
              >
                Dashboard
              </Button>
              <Button
                variant={currentPage === "standings" ? "default" : "ghost"}
                onClick={() => setCurrentPage("standings")}
              >
                Standings
              </Button>
              <Button 
                variant={currentPage === "positions" ? "default" : "ghost"} 
                onClick={() => setCurrentPage("positions")}
              >
                Position Chart
              </Button>
              <Button 
                variant={currentPage === "races" ? "default" : "ghost"} 
                onClick={() => setCurrentPage("races")}
              >
                Races
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {currentPage === "dashboard" && renderDashboard()}
        {currentPage === "standings" && renderStandings()}
        {currentPage === "positions" && renderPositionChart()}
        {currentPage === "races" && renderRaces()}
      </main>
    </div>
  );
}
