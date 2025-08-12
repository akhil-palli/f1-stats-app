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
import { Flag, LayoutDashboard, LineChart, CircuitBoard, Bot, Loader, Brain, Target, Award, Activity, Zap, Settings, Play, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
 * Page type for navigation state (removed standings - integrated into dashboard)
 */
type PageType = "dashboard" | "positions" | "races" | "predictor";

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
  } = useMLPredictor({ driverStandings, raceResults });

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

  // ML Predictor - EXACT ORIGINAL REPRODUCTION
  const renderMLPredictor = () => (
    <div className="space-y-6">
      {/* API Status Notice */}
      <div className="bg-purple-900/50 border border-purple-700 rounded-lg p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Badge variant="outline" className="bg-purple-600 w-fit">ML MODEL</Badge>
          <span className="text-xs sm:text-sm">
            Random Forest • {modelMetrics.accuracy_within_2.toFixed(1)}% accuracy within ±2 positions • Production-ready model • Docker deployment available
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview" persistKey="ml-predictor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3">Overview</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm px-2 sm:px-3">Performance</TabsTrigger>
          <TabsTrigger value="predictor" className="text-xs sm:text-sm px-1 sm:px-3">Predictor</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs sm:text-sm px-2 sm:px-3">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Model Architecture
                </CardTitle>
                <CardDescription>
                  Production Random Forest Regressor with engineered features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">47</div>
                    <div className="text-sm text-gray-400">Features</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">100</div>
                    <div className="text-sm text-gray-400">Trees</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">Key Features:</div>
                  <div className="text-xs space-y-1 text-gray-400">
                    <div>• Qualifying position & grid penalties</div>
                    <div>• Driver championship standings</div>
                    <div>• Constructor performance metrics</div>
                    <div>• Circuit-specific characteristics</div>
                    <div>• Historical driver/team performance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Accuracy Metrics
                </CardTitle>
                <CardDescription>
                  Model performance on validation data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">±1 Position</span>
                    <div className="flex items-center gap-2">
                      <Progress value={modelMetrics.accuracy_within_1} className="w-20 h-2" />
                      <span className="text-sm font-medium">{modelMetrics.accuracy_within_1.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">±2 Positions</span>
                    <div className="flex items-center gap-2">
                      <Progress value={modelMetrics.accuracy_within_2} className="w-20 h-2" />
                      <span className="text-sm font-medium text-green-400">{modelMetrics.accuracy_within_2.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">±3 Positions</span>
                    <div className="flex items-center gap-2">
                      <Progress value={modelMetrics.accuracy_within_3} className="w-20 h-2" />
                      <span className="text-sm font-medium">{modelMetrics.accuracy_within_3.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">{modelMetrics.mean_absolute_error.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">Avg Error</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{modelMetrics.correlation.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">Correlation</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Analysis
              </CardTitle>
              <CardDescription>
                Detailed model metrics and industry comparisons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Model Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">R² Score</span>
                      <span className="font-medium">{modelMetrics.r2_score.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">MAE</span>
                      <span className="font-medium">{modelMetrics.mean_absolute_error.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Correlation</span>
                      <span className="font-medium">{modelMetrics.correlation.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Industry Comparison</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Our Model</span>
                      <Badge variant="default">{modelMetrics.accuracy_within_2.toFixed(1)}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Industry Avg</span>
                      <Badge variant="secondary">30-35%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Random Guess</span>
                      <Badge variant="outline">15%</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Deployment Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Model Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Docker Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">API Integration</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictor">
          <div className="space-y-6">
            {/* Race Selector */}
            <RaceSelector 
              sessions={sessions}
              selectedSession={selectedSession}
              onSessionSelect={selectSession}
              isLoading={isPredicting}
            />

            {/* Prediction Actions */}
            {selectedSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-500" />
                    Live Race Predictor
                  </CardTitle>
                  <CardDescription>
                    Generate race finish predictions for {selectedSession.circuit_short_name || selectedSession.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-sm">
                      Circuit: <strong>{selectedSession.circuit_short_name || selectedSession.location}</strong>
                    </div>
                    <div className="text-sm text-gray-400">
                      Session: {selectedSession.session_name}
                    </div>
                    {qualifyingData.length > 0 && (
                      <Badge variant="outline" className="bg-green-900 text-green-300">
                        ✅ Qualifying Data Available
                      </Badge>
                    )}
                  </div>
                  
                  {qualifyingData.length === 0 && !isPredicting && (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-sm">No qualifying data available for this session</div>
                    </div>
                  )}
                  
                  {isPredicting && (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <Loader className="w-8 h-8 animate-spin text-blue-500" />
                        <div className="text-lg font-medium text-gray-700">Generating ML Predictions...</div>
                        <div className="text-sm text-gray-500">Calling ML API</div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={runPrediction}
                      disabled={isPredicting || qualifyingData.length === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isPredicting ? 'Predicting...' : 'Generate Predictions'}
                    </Button>
                    <Button
                      onClick={clearPredictions}
                      disabled={predictions.length === 0}
                      variant="outline"
                    >
                      Clear Results
                    </Button>
                  </div>
                  
                  {predictorStatus && (
                    <p className="text-sm text-gray-400">{predictorStatus}</p>
                  )}

                  {/* Prediction Results */}
                  {predictions.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Qualifying vs Predicted</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {qualifyingData.slice(0, 10).map((driver, idx) => {
                              const prediction = predictions.find(p => p.driver_name === driver.driver_name);
                              return (
                                <div key={driver.driver_name} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm w-6">Q{driver.qualifying_position}</span>
                                    <span className="text-sm font-medium">{driver.driver_name.split(' ')[1] || driver.driver_name}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="text-blue-400">P{prediction?.predicted_position_int || '-'}</span>
                                    <Badge 
                                      variant={prediction?.confidence === 'High' ? 'default' : 
                                              prediction?.confidence === 'Medium' ? 'secondary' : 'outline'}
                                      className="text-xs"
                                    >
                                      {prediction?.confidence || 'N/A'}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Predicted Race Finish</CardTitle>
                          <CardDescription>ML Model Predictions (Sorted by Position)</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {predictions
                              .sort((a, b) => a.predicted_position_int - b.predicted_position_int)
                              .slice(0, 10)
                              .map((prediction, idx) => (
                                <div key={prediction.driver_name} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                                      {idx + 1}
                                    </div>
                                    <span className="text-sm font-medium">{prediction.driver_name.split(' ')[1] || prediction.driver_name}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-mono text-green-400">
                                      P{prediction.predicted_position.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Q{prediction.qualifying_position} → P{prediction.predicted_position_int}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                    <div className="font-medium text-green-400">Strong Performance</div>
                    <div className="text-sm text-gray-300">{modelMetrics.accuracy_within_2.toFixed(1)}% accuracy within ±2 positions exceeds industry standards</div>
                  </div>
                  <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <div className="font-medium text-blue-400">Production Ready</div>
                    <div className="text-sm text-gray-300">Model shows consistent performance across different circuits and conditions</div>
                  </div>
                  <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                    <div className="font-medium text-purple-400">Feature Engineering</div>
                    <div className="text-sm text-gray-300">47 engineered features capture complex F1 race dynamics</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Limitations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <div className="font-medium text-yellow-400">Weather Impact</div>
                    <div className="text-sm text-gray-300">Rain and changing conditions can significantly affect predictions</div>
                  </div>
                  <div className="p-3 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                    <div className="font-medium text-orange-400">DNF Events</div>
                    <div className="text-sm text-gray-300">Model doesn't predict mechanical failures or crashes</div>
                  </div>
                  <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                    <div className="font-medium text-red-400">Strategy Calls</div>
                    <div className="text-sm text-gray-300">Unexpected pit strategies can change race outcomes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
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
        {currentPage === "positions" && renderPositionChart()}
        {currentPage === "races" && renderRaces()}
        {currentPage === "predictor" && renderMLPredictor()}
      </main>
    </div>
  );
}
