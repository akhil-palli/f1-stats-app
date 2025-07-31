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

// 2025 F1 Season Data Types
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

type DriverStanding = {
  position: number;
  driver: string;
  team: string;
  points: number;
  wins: number;
  podiums: number;
  change: number;
  nationality: string;
  age: number;
  driver_number: number;
};

type ConstructorStanding = {
  position: number;
  team: string;
  points: number;
  wins: number;
  change: number;
  base: string;
  founded: number;
  color: string;
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
  "Haas F1 Team": "#B6BABD"
};

// 2025 Driver lineup with details
const DRIVER_DETAILS = [
  {
    name: "Max Verstappen",
    team: "Red Bull Racing",
    number: 1,
    nationality: "Netherlands",
    age: 27,
    careerWins: 70,
    careerPodiums: 110,
    championships: 4,
    fastestLaps: 35,
    polePositions: 45,
    biography: "Four-time World Champion and dominant force in modern F1, known for his exceptional racecraft.",
  },
  {
    name: "Lewis Hamilton",
    team: "Ferrari",
    number: 44,
    nationality: "Great Britain",
    age: 40,
    careerWins: 105,
    careerPodiums: 200,
    championships: 7,
    fastestLaps: 67,
    polePositions: 104,
    biography: "Seven-time World Champion making his shocking move to Ferrari for 2025.",
  },
  {
    name: "Charles Leclerc",
    team: "Ferrari",
    number: 16,
    nationality: "Monaco",
    age: 27,
    careerWins: 8,
    careerPodiums: 35,
    championships: 0,
    fastestLaps: 12,
    polePositions: 28,
    biography: "Ferrari's home-grown talent partnering with Hamilton in the ultimate dream team.",
  },
  {
    name: "Lando Norris",
    team: "McLaren",
    number: 4,
    nationality: "Great Britain",
    age: 25,
    careerWins: 3,
    careerPodiums: 15,
    championships: 0,
    fastestLaps: 8,
    polePositions: 5,
    biography: "McLaren's rising star looking to challenge for his first championship.",
  },
  {
    name: "Oscar Piastri",
    team: "McLaren",
    number: 81,
    nationality: "Australia",
    age: 24,
    careerWins: 2,
    careerPodiums: 8,
    championships: 0,
    fastestLaps: 3,
    polePositions: 2,
    biography: "Talented young Australian continuing his impressive F1 journey with McLaren.",
  },
  {
    name: "George Russell",
    team: "Mercedes",
    number: 63,
    nationality: "Great Britain",
    age: 27,
    careerWins: 2,
    careerPodiums: 12,
    championships: 0,
    fastestLaps: 7,
    polePositions: 3,
    biography: "Mercedes' team leader looking to restore the team to championship contention.",
  }
];

// Mock standings data (this would come from OpenF1 API in practice)
const MOCK_DRIVER_STANDINGS: DriverStanding[] = [
  {
    position: 1,
    driver: "Max Verstappen",
    team: "Red Bull Racing",
    points: 425,
    wins: 12,
    podiums: 18,
    change: 0,
    nationality: "NED",
    age: 27,
    driver_number: 1,
  },
  {
    position: 2,
    driver: "Lando Norris",
    team: "McLaren",
    points: 378,
    wins: 6,
    podiums: 14,
    change: 1,
    nationality: "GBR",
    age: 25,
    driver_number: 4,
  },
  {
    position: 3,
    driver: "Charles Leclerc",
    team: "Ferrari",
    points: 356,
    wins: 4,
    podiums: 12,
    change: -1,
    nationality: "MON",
    age: 27,
    driver_number: 16,
  },
  {
    position: 4,
    driver: "Lewis Hamilton",
    team: "Ferrari",
    points: 334,
    wins: 3,
    podiums: 11,
    change: 2,
    nationality: "GBR",
    age: 40,
    driver_number: 44,
  },
  {
    position: 5,
    driver: "Oscar Piastri",
    team: "McLaren",
    points: 298,
    wins: 2,
    podiums: 9,
    change: 1,
    nationality: "AUS",
    age: 24,
    driver_number: 81,
  },
  {
    position: 6,
    driver: "George Russell",
    team: "Mercedes",
    points: 245,
    wins: 1,
    podiums: 6,
    change: -2,
    nationality: "GBR",
    age: 27,
    driver_number: 63,
  },
];

const MOCK_CONSTRUCTOR_STANDINGS: ConstructorStanding[] = [
  { position: 1, team: "McLaren", points: 676, wins: 8, change: 0, base: "Woking, UK", founded: 1966, color: "#FF8000" },
  { position: 2, team: "Ferrari", points: 690, wins: 7, change: 1, base: "Maranello, Italy", founded: 1950, color: "#E8002D" },
  { position: 3, team: "Red Bull Racing", points: 580, wins: 12, change: -1, base: "Milton Keynes, UK", founded: 2005, color: "#3671C6" },
  { position: 4, team: "Mercedes", points: 445, wins: 1, change: 0, base: "Brackley, UK", founded: 2010, color: "#27F4D2" },
  { position: 5, team: "Aston Martin", points: 189, wins: 0, change: 0, base: "Silverstone, UK", founded: 2021, color: "#229971" },
  { position: 6, team: "Alpine", points: 156, wins: 0, change: 1, base: "Enstone, UK", founded: 2021, color: "#0093CC" },
];

export function F1EnhancedDashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real sessions data
  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch('https://api.openf1.org/v1/sessions?year=2025');
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const sessionList = await response.json();
        
        const sortedSessions = sessionList.sort((a: any, b: any) => 
          new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
        );
        
        setSessions(sortedSessions.slice(0, 22)); // Current season races
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSessions();
  }, []);

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Championship Leader</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Max Verstappen</div>
            <p className="text-xs text-gray-400">425 points • 12 wins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Race</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Season Active</div>
            <p className="text-xs text-gray-400">2025 F1 Championship</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Races Completed</CardTitle>
            <Flag className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15/24</div>
            <p className="text-xs text-gray-400">2025 Season</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Constructor Leader</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ferrari</div>
            <p className="text-xs text-gray-400">690 points • 7 wins</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Standings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 6 Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_DRIVER_STANDINGS.slice(0, 6).map((driver) => (
                <div key={driver.position} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                      {driver.position}
                    </div>
                    <div>
                      <p className="font-medium">{driver.driver}</p>
                      <p className="text-sm text-gray-400">{driver.team}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{driver.points}</p>
                    <p className="text-sm text-gray-400">{driver.wins} wins</p>
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
              {sessions
                .filter(s => s.session_type === 'Race')
                .slice(0, 5)
                .map((race, index) => (
                  <div key={race.session_key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{race.circuit_short_name} GP</p>
                      <p className="text-sm text-gray-400">{new Date(race.date_start).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Max Verstappen</p>
                      <Badge variant="outline" className="text-xs">
                        Round {index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

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
            <CardDescription>Current standings for the 2025 Formula 1 World Championship</CardDescription>
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
                  <TableHead className="text-right">Podiums</TableHead>
                  <TableHead className="w-20">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_DRIVER_STANDINGS.map((driver) => (
                  <TableRow key={driver.position}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {driver.position}
                        {driver.change > 0 && <TrendingUp className="h-3 w-3 text-green-600" />}
                        {driver.change < 0 && <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{driver.driver}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: F1_TEAM_COLORS[driver.team] }}
                        />
                        {driver.team}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{driver.points}</TableCell>
                    <TableCell className="text-right">{driver.wins}</TableCell>
                    <TableCell className="text-right">{driver.podiums}</TableCell>
                    <TableCell>
                      <Progress value={(driver.points / 425) * 100} className="w-full h-2" />
                    </TableCell>
                  </TableRow>
                ))}
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
            <CardDescription>Team standings for the 2025 Formula 1 World Championship</CardDescription>
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
                {MOCK_CONSTRUCTOR_STANDINGS.map((team) => (
                  <TableRow key={team.position}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {team.position}
                        {team.change > 0 && <TrendingUp className="h-3 w-3 text-green-600" />}
                        {team.change < 0 && <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-medium">{team.team}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{team.points}</TableCell>
                    <TableCell className="text-right">{team.wins}</TableCell>
                    <TableCell>
                      <Progress value={(team.points / 690) * 100} className="w-full h-2" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )

  const renderRaces = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            2025 Race Calendar
          </CardTitle>
          <CardDescription>Complete schedule and results for the 2025 Formula 1 season</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {sessions
              .filter(s => s.session_type === 'Race')
              .slice(0, 24)
              .map((race, index) => {
                const raceDate = new Date(race.date_start);
                const isUpcoming = raceDate > new Date();
                const status = isUpcoming ? "Upcoming" : "Completed";
                
                return (
                  <div
                    key={race.session_key}
                    className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-lg font-bold">R{index + 1}</div>
                        <Badge variant={status === "Completed" ? "default" : "secondary"} className="text-xs">
                          {status}
                        </Badge>
                      </div>
                      <Separator orientation="vertical" className="h-12" />
                      <div>
                        <h3 className="font-semibold text-lg">{race.circuit_short_name} Grand Prix</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="h-4 w-4" />
                          {race.location}, {race.country_name}
                        </div>
                        <p className="text-sm text-gray-400">{raceDate.toLocaleDateString()}</p>
                      </div>
                    </div>
                    {!isUpcoming && (
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">Max Verstappen</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTeams = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_CONSTRUCTOR_STANDINGS.map((team) => (
          <Card key={team.team} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full" 
                    style={{ backgroundColor: team.color }}
                  />
                  <CardTitle className="text-lg">{team.team}</CardTitle>
                </div>
                <Badge variant="outline">#{team.position}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Points</p>
                  <p className="text-2xl font-bold">{team.points}</p>
                </div>
                <div>
                  <p className="text-gray-400">Wins</p>
                  <p className="text-2xl font-bold">{team.wins}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{team.base}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Founded {team.founded}</span>
                </div>
              </div>
              <Progress value={(team.points / 690) * 100} className="w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderPositionChart = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            F1 Position Analysis
          </CardTitle>
          <CardDescription>Interactive position tracking and race analysis for the 2025 F1 season</CardDescription>
        </CardHeader>
        <CardContent>
          <F1PositionChart />
        </CardContent>
      </Card>
    </div>
  )

  const renderDrivers = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DRIVER_DETAILS.map((driver) => (
          <Card key={driver.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>
                    {driver.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{driver.name}</CardTitle>
                  <p className="text-gray-400">{driver.team}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">#{driver.number}</Badge>
                    <Badge variant="secondary">{driver.nationality}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span>{driver.careerWins} Wins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-600" />
                    <span>{driver.careerPodiums} Podiums</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span>{driver.polePositions} Poles</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-purple-600" />
                    <span>{driver.fastestLaps} Fastest</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span>Age {driver.age}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-red-600" />
                    <span>{driver.championships} Titles</span>
                  </div>
                </div>
              </div>
              <Separator />
              <p className="text-sm text-gray-400">{driver.biography}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center">
        <div className="text-xl">Loading F1 Dashboard...</div>
      </div>
    )
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
                <h1 className="text-2xl font-bold">F1 Dashboard</h1>
              </div>
              <Badge variant="secondary">2025 Season</Badge>
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
              <Button 
                variant={currentPage === "teams" ? "default" : "ghost"} 
                onClick={() => setCurrentPage("teams")}
              >
                Teams
              </Button>
              <Button
                variant={currentPage === "drivers" ? "default" : "ghost"}
                onClick={() => setCurrentPage("drivers")}
              >
                Drivers
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
        {currentPage === "teams" && renderTeams()}
        {currentPage === "drivers" && renderDrivers()}
      </main>
    </div>
  )
}
