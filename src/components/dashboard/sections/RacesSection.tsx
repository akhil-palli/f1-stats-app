/**
 * Races Section Component
 * 
 * Displays the complete race calendar with results, winners, and status.
 * Handles race merging, sorting, and responsive layout.
 * 
 * @fileoverview Race calendar and results section
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RaceCard } from '../cards/RaceCard';
import type { RacesProps } from '@/types';

/**
 * Complete races section with calendar and results
 */
export const RacesSection: React.FC<RacesProps> = ({
  raceCalendar,
  raceResults,
  isLoading
}) => {
  // Merge race calendar with results to show complete season view
  const mergedRaces = raceCalendar.map(calendarRace => {
    // Find matching race result
    const raceResult = raceResults.find(result => 
      result.round === calendarRace.round && result.season === calendarRace.season
    );
    
    // Return calendar race with results if available
    return {
      ...calendarRace,
      Results: raceResult?.Results || undefined
    };
  });

  const currentDate = new Date();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Race Results & Calendar
          </CardTitle>
          <CardDescription>
            Loading race data...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mergedRaces.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Race Results & Calendar
          </CardTitle>
          <CardDescription>
            No race data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No races found for this season</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Race Results & Calendar
        </CardTitle>
        <CardDescription>
          Complete 2025 F1 season calendar with results • Race calendar from Jolpica-F1 API • Race results and standings data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {mergedRaces
            .sort((a, b) => parseInt(b.round) - parseInt(a.round)) // Sort by round number, newest first
            .map((race) => {
              const winner = race.Results?.[0];
              const hasResults = Boolean(race.Results && race.Results.length > 0);
              const raceDate = new Date(race.date);
              const hasHappened = raceDate < currentDate;
              const isUpcoming = !hasHappened;
              
              return (
                <RaceCard
                  key={`${race.season}-${race.round}`}
                  race={race}
                  hasHappened={hasHappened}
                  hasResults={hasResults}
                  winner={winner}
                  compact={isUpcoming}
                />
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RacesSection;
