/**
 * F1 Real Data Dashboard - Refactored with EXACT Original UI Preserved
 * 
 * This refactor maintains 100% of the original UI/UX while improving code architecture
 * using custom hooks, reusable components, and proper separation of concerns.
 * 
 * @fileoverview Main F1 dashboard component - same UI, cleaner code
 */

"use client";

import React, { useState } from 'react';
import { Flag, LayoutDashboard, Crown, LineChart, CircuitBoard, Bot, Loader } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Custom hooks - abstracts all data management
import { useF1Data, useMLPredictor } from '@/hooks';

// Dashboard components - modular architecture
import {
  DashboardOverview,
  StandingsSection,
  RacesSection
} from '@/components/dashboard';

// Existing components - preserves all functionality
import F1PositionChart from '@/components/F1PositionChart';
import { RaceSelector } from '@/components/RaceSelector';

/**
 * Page type for navigation state
 */
type PageType = "dashboard" | "standings" | "positions" | "races" | "predictor";

/**
 * Main F1 Dashboard Component - Same UI, Better Architecture
 */
export function F1RealDataDashboard() {
  // UI State - exactly as original
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");

  // Data hooks - All API calls and state management abstracted
  const {
    isLoading,
    dataStatus,
    error,
    sessions,
    drivers,
    driverStandings,
    constructorStandings,
    raceResults,
    raceCalendar,
    actualRaceResults,
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
  } = useMLPredictor();

  // Loading state - exactly as original
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Loading F1 Data</h2>
          <p className="text-gray-400">{dataStatus}</p>
        </div>
      </div>
    );
  }

  // Error state - exactly as original  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={refreshData}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Dashboard Overview - using new modular components
  const renderDashboard = () => (
    <div className="space-y-6">
      <DashboardOverview
        seasonStatus={seasonStatus}
        driverStandings={driverStandings}
        constructorStandings={constructorStandings}
        raceResults={raceResults}
        isLoading={false}
      />
      <StandingsSection
        driverStandings={driverStandings}
        constructorStandings={constructorStandings}
        isLoading={false}
      />
    </div>
  );

  // Standings - using new modular component
  const renderStandings = () => (
    <StandingsSection
      driverStandings={driverStandings}
      constructorStandings={constructorStandings}
      isLoading={false}
    />
  );

  // Position Chart - existing component preserved
  const renderPositionChart = () => <F1PositionChart />;

  // Races - using new modular component
  const renderRaces = () => (
    <RacesSection
      raceCalendar={raceCalendar}
      raceResults={raceResults}
      isLoading={false}
    />
  );

  // ML Predictor - using new hook but original UI
  const renderMLPredictor = () => (
    <div className="space-y-6">
      {/* Model Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">
            {modelMetrics.accuracy_within_1.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-300">±1 Position</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">
            {modelMetrics.accuracy_within_2.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-300">±2 Positions</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-400">
            {modelMetrics.accuracy_within_3.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-300">±3 Positions</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-400">
            {modelMetrics.r2_score.toFixed(2)}
          </div>
          <div className="text-sm text-gray-300">R² Score</div>
        </div>
      </div>

      {/* Race Selector */}
      <div className="bg-gray-700 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Select Race Session</h3>
        <RaceSelector 
          sessions={sessions}
          selectedSession={selectedSession}
          onSessionSelect={selectSession}
          isLoading={isPredicting}
        />
        
        {/* Prediction Actions */}
        {selectedSession && (
          <div className="mt-4 flex gap-3">
            <Button
              onClick={runPrediction}
              disabled={isPredicting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPredicting ? 'Predicting...' : 'Run Prediction'}
            </Button>
            <Button
              onClick={clearPredictions}
              disabled={predictions.length === 0}
              variant="outline"
            >
              Clear Results
            </Button>
          </div>
        )}
        
        {predictorStatus && (
          <p className="text-sm text-gray-400 mt-2">{predictorStatus}</p>
        )}
      </div>

      {/* Prediction Results */}
      {predictions.length > 0 && (
        <div className="bg-gray-700 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Prediction Results</h3>
          <div className="space-y-2">
            {predictions
              .sort((a, b) => a.predicted_position_int - b.predicted_position_int)
              .map((prediction) => (
                <div 
                  key={prediction.driver_name}
                  className="flex items-center justify-between p-3 bg-gray-600 rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                      {prediction.predicted_position_int}
                    </div>
                    <div>
                      <div className="font-medium">{prediction.driver_name}</div>
                      <div className="text-sm text-gray-300">{prediction.constructor}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Grid: P{prediction.qualifying_position}</div>
                    <Badge variant="outline" className="text-xs">
                      {prediction.confidence}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  // Main render - EXACT ORIGINAL UI PRESERVED
  return (
    <div className="min-h-screen bg-gray-800 text-white">
      {/* Header - Exactly as original */}
      <header className="border-b border-gray-700 bg-gray-900">
        <div className="container mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 min-w-0 flex-shrink">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Flag className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-red-600 flex-shrink-0" />
                <h1 className="hidden xs:block text-sm sm:text-lg md:text-2xl font-bold truncate">F1 Dashboard</h1>
                <h1 className="xs:hidden text-sm font-bold">F1 Stats</h1>
              </div>
              <Badge variant="secondary" className="hidden md:inline-flex text-xs">Live API Data</Badge>
            </div>
            
            {/* Navigation - Mobile optimized - EXACTLY as original */}
            <nav className="flex items-center flex-shrink-0 max-w-[70%] sm:max-w-none">
              <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide pr-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                <style jsx>{`
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <Button
                  variant={currentPage === "dashboard" ? "default" : "ghost"}
                  onClick={() => setCurrentPage("dashboard")}
                  className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 h-7 sm:h-8 min-w-0 flex-shrink-0 flex items-center gap-1"
                >
                  <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <Button
                  variant={currentPage === "standings" ? "default" : "ghost"}
                  onClick={() => setCurrentPage("standings")}
                  className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 h-7 sm:h-8 min-w-0 flex-shrink-0 flex items-center gap-1"
                >
                  <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Standings</span>
                </Button>
                <Button 
                  variant={currentPage === "positions" ? "default" : "ghost"} 
                  onClick={() => setCurrentPage("positions")}
                  className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 h-7 sm:h-8 min-w-0 flex-shrink-0 flex items-center gap-1"
                >
                  <LineChart className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Charts</span>
                </Button>
                <Button 
                  variant={currentPage === "races" ? "default" : "ghost"} 
                  onClick={() => setCurrentPage("races")}
                  className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 h-7 sm:h-8 min-w-0 flex-shrink-0 flex items-center gap-1"
                >
                  <CircuitBoard className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Races</span>
                </Button>
                <Button 
                  variant={currentPage === "predictor" ? "default" : "ghost"} 
                  onClick={() => setCurrentPage("predictor")}
                  className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-3 h-7 sm:h-8 min-w-0 flex-shrink-0 flex items-center gap-1"
                >
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">ML Predictor</span>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content - Exactly as original */}
      <main className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        {currentPage === "dashboard" && renderDashboard()}
        {currentPage === "standings" && renderStandings()}
        {currentPage === "positions" && renderPositionChart()}
        {currentPage === "races" && renderRaces()}
        {currentPage === "predictor" && renderMLPredictor()}
      </main>
    </div>
  );
}
