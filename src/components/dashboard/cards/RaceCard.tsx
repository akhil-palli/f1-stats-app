/**
 * Race Card Component
 * 
 * Displays individual race information including results, winners, and status.
 * Supports both completed and upcoming races with responsive design.
 * 
 * @fileoverview Individual race display component
 */

import React from 'react';
import { Trophy, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { RaceCardProps } from '@/types';
import { RACE_STATUS } from '@/constants';

/**
 * Individual race card component with winner information and responsive design
 */
export const RaceCard: React.FC<RaceCardProps> = ({
  race,
  hasHappened,
  hasResults,
  winner,
  compact = false
}) => {
  const isUpcoming = !hasHappened;
  const raceDate = new Date(race.date);

  // Determine race status
  const status = hasResults 
    ? RACE_STATUS.COMPLETED
    : isUpcoming 
    ? RACE_STATUS.UPCOMING
    : RACE_STATUS.COMPLETED;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors ${
        compact ? 'p-2 bg-gray-900/30' : 'p-4'
      } gap-3 sm:gap-0`}
    >
      {/* Race Information Section */}
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
        {/* Round Number and Status Badge */}
        <div className={`text-center flex-shrink-0 ${compact ? 'min-w-[40px]' : 'min-w-[60px]'}`}>
          <div className={`font-bold ${compact ? 'text-sm' : 'text-lg'}`}>
            R{race.round}
          </div>
          <Badge 
            variant={status.variant}
            className={compact ? "text-xs px-1" : "text-xs"}
          >
            {status.label}
          </Badge>
        </div>

        {/* Vertical Separator (hidden on mobile) */}
        <Separator 
          orientation="vertical" 
          className={`${compact ? "h-8" : "h-12"} hidden sm:block`} 
        />

        {/* Race Details */}
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-lg'} truncate`}>
            {race.raceName}
          </h3>
          <div className={`flex items-center gap-2 text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            <MapPin className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} flex-shrink-0`} />
            <span className="truncate">
              {race.Circuit.Location.locality}, {race.Circuit.Location.country}
            </span>
          </div>
          <p className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            {raceDate.toLocaleDateString('en-US', { 
              weekday: compact ? undefined : 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Winner Information Section */}
      {(winner || (!isUpcoming && hasHappened)) && (
        <div className="text-right flex-shrink-0 sm:ml-4">
          {winner ? (
            <WinnerInfo winner={winner} compact={compact} />
          ) : hasHappened ? (
            <div className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
              Results pending
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

/**
 * Winner information sub-component
 */
interface WinnerInfoProps {
  winner: {
    Driver: {
      givenName: string;
      familyName: string;
    };
    Constructor: {
      name: string;
    };
  };
  compact: boolean;
}

const WinnerInfo: React.FC<WinnerInfoProps> = ({ winner, compact }) => (
  <>
    <div className={`flex items-center gap-2 justify-end ${compact ? 'text-sm' : ''}`}>
      <Trophy className={`text-yellow-600 ${compact ? 'h-3 w-3' : 'h-4 w-4'} flex-shrink-0`} />
      <span className="font-medium truncate">
        {winner.Driver.givenName} {winner.Driver.familyName}
      </span>
    </div>
    <p className={`text-gray-400 ${compact ? 'text-xs' : 'text-xs'} truncate`}>
      {winner.Constructor.name}
    </p>
  </>
);

export default RaceCard;
