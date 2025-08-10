import React, { memo } from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

interface RaceSelectorProps {
  sessions: Session[];
  selectedSession: Session | null;
  onSessionSelect: (session: Session) => void;
  isLoading: boolean;
}

export const RaceSelector = memo(function RaceSelector({ 
  sessions, 
  selectedSession, 
  onSessionSelect,
  isLoading 
}: RaceSelectorProps) {
  const filteredSessions = sessions.filter(session => {
    const isRaceSession = session.session_name === 'Race' || 
           session.session_name?.includes('Grand Prix') ||
           (session.session_type === 'Race' && 
            !session.session_name?.toLowerCase().includes('sprint'));
    
    return isRaceSession;
  });

  // Group sessions by year
  const sessionsByYear = filteredSessions.reduce((acc, session) => {
    const year = new Date(session.date_start).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(session);
    return acc;
  }, {} as Record<number, typeof filteredSessions>);

  // Only show latest year sessions if available (prefer 2025, but show whatever is most recent)
  const availableYears = Object.keys(sessionsByYear).map(Number).sort((a, b) => b - a);
  const targetYear = availableYears[0]; // Use the most recent year available
  const displaySessions = sessionsByYear[targetYear] || [];
  
  const isUsing2025 = targetYear === 2025;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Select F1 Session ({targetYear || 2025} Season)
        </CardTitle>
        <CardDescription>
          Choose a {targetYear || 2025} race to generate predictions based on qualifying results
          {!isUsing2025 && (
            <div className="text-yellow-400 text-sm mt-1">
              ⚠️ 2025 data not available due to CORS restrictions - showing {targetYear} season
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
          {displaySessions.map((session) => {
            const sessionDate = new Date(session.date_start);
            const isUpcoming = sessionDate > new Date();
            const isSelected = selectedSession?.session_key === session.session_key;
            
            return (
              <button
                key={session.session_key}
                onClick={() => onSessionSelect(session)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors text-left ${
                  isSelected
                    ? 'bg-purple-600 text-white border border-purple-500'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <span>🏁</span>
                  <span>{session.circuit_short_name || session.location}</span>
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
                {isSelected && !isLoading && (
                  <div className="text-xs bg-green-600 px-2 py-1 rounded mt-2 inline-block">
                    ✓ COMPLETED
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {filteredSessions.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No race sessions available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
