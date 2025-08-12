/**
 * Dashboard Overview Section Component
 * 
 * Displays key F1 season statistics including race completion status,
 * championship leaders, and recent race information.
 * 
 * @fileoverview Main dashboard overview with key metrics
 */

import React from 'react';
import { TrendingUp, Flag, Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { 
  ErgastDriverStanding, 
  ErgastConstructorStanding, 
  ErgastRaceResult,
  SeasonStatus 
} from '@/types';
import { F1_TEAM_COLORS } from '@/constants';

interface DashboardOverviewProps {
  seasonStatus: SeasonStatus;
  driverStandings: ErgastDriverStanding[];
  constructorStandings: ErgastConstructorStanding[];
  raceResults: ErgastRaceResult[];
  isLoading: boolean;
}

/**
 * Main dashboard overview with season statistics and leaders
 */
export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  seasonStatus,
  driverStandings,
  constructorStandings,
  raceResults,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Get season progress percentage
  const progressPercentage = seasonStatus.totalRaces > 0 
    ? (seasonStatus.completedRaces / seasonStatus.totalRaces) * 100 
    : 0;

  // Get championship leaders
  const championshipLeader = driverStandings[0];
  const constructorLeader = constructorStandings[0];

  // Get most recent race
  const recentRace = raceResults
    .filter(race => race.Results && race.Results.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const recentWinner = recentRace?.Results?.[0];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Season Progress Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Season Progress</CardTitle>
          <Flag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {seasonStatus.completedRaces}/{seasonStatus.totalRaces}
          </div>
          <div className="space-y-2">
            <Progress value={progressPercentage} className="w-full" />
            <p className="text-xs text-muted-foreground">
              {progressPercentage.toFixed(1)}% complete
            </p>
          </div>
          <Badge 
            variant={seasonStatus.isActive ? "default" : "secondary"}
            className="mt-2"
          >
            {seasonStatus.season} {seasonStatus.isActive ? "Active" : "Complete"}
          </Badge>
        </CardContent>
      </Card>

      {/* Championship Leader Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Championship Leader</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          {championshipLeader ? (
            <>
              <div className="text-2xl font-bold">
                {championshipLeader.Driver.givenName} {championshipLeader.Driver.familyName}
              </div>
              <p className="text-xs text-muted-foreground">
                {championshipLeader.Constructors[0]?.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: F1_TEAM_COLORS[championshipLeader.Constructors[0]?.name] || '#808080'
                  }}
                />
                <span className="text-sm font-medium">{championshipLeader.points} pts</span>
                <Badge variant="outline" className="text-xs">
                  {championshipLeader.wins} wins
                </Badge>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">No data available</div>
          )}
        </CardContent>
      </Card>

      {/* Constructor Leader Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Constructor Leader</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {constructorLeader ? (
            <>
              <div className="text-2xl font-bold">
                {constructorLeader.Constructor.name}
              </div>
              <p className="text-xs text-muted-foreground">
                {constructorLeader.Constructor.nationality}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: F1_TEAM_COLORS[constructorLeader.Constructor.name] || '#808080'
                  }}
                />
                <span className="text-sm font-medium">{constructorLeader.points} pts</span>
                <Badge variant="outline" className="text-xs">
                  {constructorLeader.wins} wins
                </Badge>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">No data available</div>
          )}
        </CardContent>
      </Card>

      {/* Recent Race Winner Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Race Winner</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {recentWinner && recentRace ? (
            <>
              <div className="text-2xl font-bold">
                {recentWinner.Driver.givenName} {recentWinner.Driver.familyName}
              </div>
              <p className="text-xs text-muted-foreground">
                {recentRace.raceName}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: F1_TEAM_COLORS[recentWinner.Constructor.name] || '#808080'
                  }}
                />
                <span className="text-sm font-medium">{recentWinner.Constructor.name}</span>
                <Badge variant="outline" className="text-xs">
                  +{recentWinner.points} pts
                </Badge>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">No recent races</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
