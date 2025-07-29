"use client";

import { useEffect, useRef } from 'react';

interface PlotData {
  x: any[];
  y: any[];
  type: string;
  mode: string;
  name: string;
  line: {
    color: string;
    width: number;
    shape: string;
  };
  hovertemplate: string;
  connectgaps: boolean;
}

interface PlotWrapperProps {
  data: PlotData[];
  layout: any;
  config: any;
  style: any;
}

export default function PlotWrapper({ data, layout, config, style }: PlotWrapperProps) {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && plotRef.current) {
      // Dynamically import and use Plotly
      import('plotly.js').then((PlotlyModule) => {
        const Plotly = (PlotlyModule as any).default || PlotlyModule;
        Plotly.newPlot(plotRef.current!, data, layout, config);
      }).catch(console.error);
    }
  }, [data, layout, config]);

  return <div ref={plotRef} style={style} />;
}
