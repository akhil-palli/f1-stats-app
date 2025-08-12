/**
 * Standing Card Component
 * 
 * Displays individual driver championship standing with position, points,
 * and team information. Supports both detailed and compact modes.
 * 
 * @fileoverview Driver championship standing display component
 */

import React from 'react';
import { Crown, Trophy, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { StandingCardProps } from '@/types';
import { F1_TEAM_COLORS, DASHBOARD_COLORS } from '@/constants';

/**
 * Individual driver standing card component
 */
export const StandingCard: React.FC<StandingCardProps> = ({
  standing,
  position,
  detailed = false
}) => {
  const driver = standing.Driver;
  const constructor = standing.Constructors[0];
  const teamColor = F1_TEAM_COLORS[constructor?.name] || F1_TEAM_COLORS["Unknown Team"];
  
  // Position-specific styling
  const getPositionStyling = (pos: number) => {
    switch (pos) {
      case 1:
        return {
          icon: Crown,
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30'
        };
      case 2:
        return {
          icon: Trophy,
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30'
        };
      case 3:
        return {
          icon: Trophy,
          iconColor: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30'
        };
      default:
        return {
          icon: User,
          iconColor: 'text-gray-500',
          bgColor: 'bg-gray-800/50',
          borderColor: 'border-gray-700'
        };
    }
  };

  const styling = getPositionStyling(position);
  const PositionIcon = styling.icon;

  return (
    <div 
      className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-800/30 transition-colors ${styling.bgColor} ${styling.borderColor}`}
    >
      {/* Position Number */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          position <= 3 ? 'bg-white text-gray-900' : 'bg-gray-700 text-white'
        }`}>
          {position}
        </div>
        <PositionIcon className={`h-4 w-4 ${styling.iconColor}`} />
      </div>

      {/* Driver Information */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Driver Avatar */}
        <Avatar className="h-10 w-10 border-2" style={{ borderColor: teamColor }}>
          <AvatarFallback 
            className="text-white font-semibold"
            style={{ backgroundColor: teamColor }}
          >
            {driver.code || `${driver.givenName[0]}${driver.familyName[0]}`}
          </AvatarFallback>
        </Avatar>

        {/* Driver Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">
              {driver.givenName} {driver.familyName}
            </h3>
            {driver.permanentNumber && (
              <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                #{driver.permanentNumber}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: teamColor }}
            />
            <p className="text-sm text-gray-400 truncate">
              {constructor?.name || 'Unknown Team'}
            </p>
          </div>
          {detailed && (
            <p className="text-xs text-gray-500 mt-1">
              {driver.nationality} • {standing.wins} wins
            </p>
          )}
        </div>
      </div>

      {/* Points Information */}
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-lg text-white">
          {standing.points}
        </div>
        <p className="text-xs text-gray-400">
          {standing.points === '1' ? 'point' : 'points'}
        </p>
        {detailed && position > 1 && (
          <p className="text-xs text-gray-500 mt-1">
            {standing.wins} wins
          </p>
        )}
      </div>
    </div>
  );
};

export default StandingCard;
