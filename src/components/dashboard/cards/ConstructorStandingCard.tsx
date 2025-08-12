/**
 * Constructor Standing Card Component
 * 
 * Displays individual constructor championship standing with position, points,
 * and team information. Supports both detailed and compact modes.
 * 
 * @fileoverview Constructor championship standing display component
 */

import React from 'react';
import { Crown, Trophy, Car } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { ConstructorStandingCardProps } from '@/types';
import { F1_TEAM_COLORS } from '@/constants';

/**
 * Individual constructor standing card component
 */
export const ConstructorStandingCard: React.FC<ConstructorStandingCardProps> = ({
  standing,
  position,
  detailed = false
}) => {
  const constructor = standing.Constructor;
  const teamColor = F1_TEAM_COLORS[constructor.name] || F1_TEAM_COLORS["Unknown Team"];
  
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
          icon: Car,
          iconColor: 'text-gray-500',
          bgColor: 'bg-gray-800/50',
          borderColor: 'border-gray-700'
        };
    }
  };

  const styling = getPositionStyling(position);
  const PositionIcon = styling.icon;

  // Extract team name initials for avatar
  const getTeamInitials = (name: string): string => {
    if (name.includes('Red Bull')) return 'RB';
    if (name.includes('McLaren')) return 'MC';
    if (name.includes('Ferrari')) return 'FE';
    if (name.includes('Mercedes')) return 'ME';
    if (name.includes('Aston Martin')) return 'AM';
    if (name.includes('Alpine')) return 'AL';
    if (name.includes('Williams')) return 'WI';
    if (name.includes('RB') || name.includes('VCARB')) return 'RB';
    if (name.includes('Sauber') || name.includes('Kick')) return 'SA';
    if (name.includes('Haas')) return 'HA';
    
    // Fallback: take first two characters of each word
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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

      {/* Constructor Information */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Team Avatar */}
        <Avatar className="h-10 w-10 border-2" style={{ borderColor: teamColor }}>
          <AvatarFallback 
            className="text-white font-semibold text-xs"
            style={{ backgroundColor: teamColor }}
          >
            {getTeamInitials(constructor.name)}
          </AvatarFallback>
        </Avatar>

        {/* Constructor Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">
            {constructor.name}
          </h3>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: teamColor }}
            />
            <p className="text-sm text-gray-400 truncate">
              {constructor.nationality}
            </p>
          </div>
          {detailed && (
            <p className="text-xs text-gray-500 mt-1">
              {standing.wins} constructor wins
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

export default ConstructorStandingCard;
