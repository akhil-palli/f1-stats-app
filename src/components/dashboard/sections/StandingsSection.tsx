/**
 * Standings Section Component
 * 
 * Displays both driver and constructor championship standings with
 * tabbed interface and detailed information.
 * 
 * @fileoverview Championship standings section
 */

import React from 'react';
import { Users, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StandingCard } from '../cards/StandingCard';
import { ConstructorStandingCard } from '../cards/ConstructorStandingCard';
import type { StandingsProps } from '@/types';

/**
 * Complete standings section with driver and constructor championships
 */
export const StandingsSection: React.FC<StandingsProps> = ({
  driverStandings,
  constructorStandings,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Championship Standings
          </CardTitle>
          <CardDescription>
            Loading championship data...
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

  if (driverStandings.length === 0 && constructorStandings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Championship Standings
          </CardTitle>
          <CardDescription>
            No championship data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No standings data found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Championship Standings
        </CardTitle>
        <CardDescription>
          Current 2025 F1 World Championship standings • Data from Jolpica-F1 API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="drivers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Drivers
              {driverStandings.length > 0 && (
                <span className="ml-1 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                  {driverStandings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="constructors" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Constructors
              {constructorStandings.length > 0 && (
                <span className="ml-1 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                  {constructorStandings.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="drivers" className="space-y-4 mt-6">
            {driverStandings.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Driver Championship</h3>
                  <p className="text-sm text-gray-400">
                    {driverStandings.length} drivers
                  </p>
                </div>
                <div className="space-y-3">
                  {driverStandings.map((standing, index) => (
                    <StandingCard
                      key={standing.Driver.driverId}
                      standing={standing}
                      position={parseInt(standing.position)}
                      detailed={index < 5} // Show detailed info for top 5
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No driver standings available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="constructors" className="space-y-4 mt-6">
            {constructorStandings.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Constructor Championship</h3>
                  <p className="text-sm text-gray-400">
                    {constructorStandings.length} teams
                  </p>
                </div>
                <div className="space-y-3">
                  {constructorStandings.map((standing, index) => (
                    <ConstructorStandingCard
                      key={standing.Constructor.constructorId}
                      standing={standing}
                      position={parseInt(standing.position)}
                      detailed={index < 5} // Show detailed info for top 5
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No constructor standings available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StandingsSection;
