'use client';

import F1PositionChart from '@/components/F1PositionChart';

export default function Home() {
  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">F1 2025 Season - Position Analysis</h1>
      <div className="flex-1">
        <F1PositionChart />
      </div>
    </div>
  );
}