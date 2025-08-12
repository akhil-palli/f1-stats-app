/**
 * F1 Real Data Dashboard - Refactored
 * 
 * A comprehensive F1 dashboard displaying real-time data, championship standings,
 * race results, and ML predictions. Built with enterprise-grade architecture
 * using custom hooks, reusable components, and proper separation of concerns.
 * 
 * @fileoverview Main F1 dashboard component with professional architecture
 */

"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Bot,
  Loader 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Custom hooks
import { useF1Data, useMLPredictor } from '@/hooks';

// Dashboard components
import {
  DashboardOverview,
  StandingsSection,
  RacesSection
} from '@/components/dashboard';

// Existing components (retain all current functionality)
import F1PositionChart from '@/components/F1PositionChart';
import { RaceSelector } from '@/components/RaceSelector';

/**
 * Main F1 Dashboard Component - Refactored with Professional Architecture
 * 
 * Features:
 * - Real-time F1 data from OpenF1 and Jolpica-F1 APIs
 * - Championship standings and race results
 * - Interactive position charts
 * - ML race predictions
 * - Responsive design with mobile support
 */
export function F1RealDataDashboard() {
  // Data hooks - All API calls and state management abstracted
  const {
    // Loading state
    isLoading,
    dataStatus,
    error,
    
    // F1 data
    sessions,
    drivers,
    driverStandings,
    constructorStandings,
    raceResults,
    raceCalendar,
    actualRaceResults,
    
    // Actions
    refreshData,
    seasonStatus
  } = useF1Data();

  // ML Predictor hook - All prediction logic abstracted
  const {
    modelMetrics,
    selectedSession,
    qualifyingData,
    predictions,
    isPredicting,
    predictorStatus,
    selectSession,
    runPrediction,
    runBatchPredictions,
    clearPredictions,
    resetPredictor
  } = useMLPredictor({ driverStandings, raceResults });

  // Handle loading states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading F1 Data</h2>
          <p className="text-gray-400">{dataStatus}</p>
        </div>
      </div>
    );
  }

  // Handle error states
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Failed to Load Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏎️</div>
              <div>
                <h1 className="text-2xl font-bold">F1 Dashboard</h1>
                <p className="text-sm text-gray-400">
                  Real-time 2025 F1 season data & analytics
                </p>
              </div>
            </div>
            
            {/* Season Status Badge */}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden sm:flex">
                {dataStatus}
              </Badge>
              <Badge variant={seasonStatus.isActive ? "default" : "secondary"}>
                {seasonStatus.season} Season • {seasonStatus.completedRaces}/{seasonStatus.totalRaces}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" persistKey="f1-dashboard" className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="races" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Races</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="predictor" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Predictor</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Overview Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics Overview */}
            <DashboardOverview
              seasonStatus={seasonStatus}
              driverStandings={driverStandings}
              constructorStandings={constructorStandings}
              raceResults={raceResults}
              isLoading={false}
            />

            {/* Championship Standings */}
            <StandingsSection
              driverStandings={driverStandings}
              constructorStandings={constructorStandings}
              isLoading={false}
            />
          </TabsContent>

          {/* Races Tab */}
          <TabsContent value="races" className="space-y-6">
            <RacesSection
              raceCalendar={raceCalendar}
              raceResults={raceResults}
              isLoading={false}
            />
          </TabsContent>

          {/* Analysis Tab - Position Charts */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">F1 Position Analysis</h2>
                </div>
                <p className="text-gray-400 mb-6">
                  Live telemetry from OpenF1 API • Real-time position tracking • Interactive race analysis
                </p>
                <F1PositionChart />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ML Predictor Tab */}
          <TabsContent value="predictor" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">ML Race Predictor</h2>
                </div>
                <p className="text-gray-400 mb-6">
                  Machine learning predictions based on qualifying results and historical data
                </p>

                {/* Model Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-400">
                      {modelMetrics.accuracy_within_1.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">±1 Position</div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-400">
                      {modelMetrics.accuracy_within_2.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">±2 Positions</div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-purple-400">
                      {modelMetrics.accuracy_within_3.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">±3 Positions</div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-orange-400">
                      {modelMetrics.r2_score.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">R² Score</div>
                  </div>
                </div>

                {/* Race Selector */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Select Race Session</h3>
                  <RaceSelector 
                    sessions={sessions}
                    selectedSession={selectedSession}
                    onSessionSelect={selectSession}
                    isLoading={isPredicting}
                  />
                </div>

                {/* Prediction Actions */}
                {selectedSession && (
                  <div className="mb-6">
                    <div className="flex gap-3">
                      <button
                        onClick={runPrediction}
                        disabled={isPredicting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isPredicting ? 'Predicting...' : 'Run Prediction'}
                      </button>
                      <button
                        onClick={clearPredictions}
                        disabled={predictions.length === 0}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Clear Results
                      </button>
                    </div>
                    {predictorStatus && (
                      <p className="text-sm text-gray-400 mt-2">{predictorStatus}</p>
                    )}
                  </div>
                )}

                {/* Predictions Results */}
                {predictions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Prediction Results</h3>
                    <div className="space-y-2">
                      {predictions
                        .sort((a, b) => a.predicted_position_int - b.predicted_position_int)
                        .map((prediction, index) => (
                          <div 
                            key={prediction.driver_name}
                            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                                {prediction.predicted_position_int}
                              </div>
                              <div>
                                <div className="font-medium">{prediction.driver_name}</div>
                                <div className="text-sm text-gray-400">{prediction.constructor}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">
                                Grid: P{prediction.qualifying_position}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {prediction.confidence}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
