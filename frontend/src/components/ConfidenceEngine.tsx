'use client';

import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfidenceEngineProps {
  confidenceData: {
    current_weather: string;
    confidence_score: number;
    confidence_level: 'Low' | 'Medium' | 'High' | 'None' | string;
    distribution: Record<string, number>;
    report_count: number;
  };
}

export default function ConfidenceEngine({ confidenceData }: ConfidenceEngineProps) {
  const { current_weather, confidence_score, confidence_level, distribution, report_count } = confidenceData;

  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'High':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30',
          text: 'text-emerald-700 dark:text-emerald-400',
          icon: CheckCircle2
        };
      case 'Medium':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30',
          text: 'text-amber-700 dark:text-amber-400',
          icon: AlertTriangle
        };
      case 'Low':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30',
          text: 'text-rose-700 dark:text-rose-400',
          icon: ShieldAlert
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700',
          text: 'text-slate-500 dark:text-slate-400',
          icon: HelpCircle
        };
    }
  };

  const status = getLevelStyles(confidence_level);
  const StatusIcon = status.icon;

  // Circle coordinates
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence_score / 100) * circumference;

  return (
    <div className="rounded-2xl border border-white/10 glass-panel p-5 shadow-lg flex flex-col md:flex-row items-center gap-6">
      {/* Circle Progress */}
      <div className="relative flex items-center justify-center h-28 w-28 flex-shrink-0">
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="56"
            cy="56"
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            className="stroke-blue-500 transition-all duration-1000 ease-out"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-2xl font-black text-slate-800 dark:text-white block">{confidence_score}%</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Confidence</span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex-1 w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Current Weather Status</h4>
            <span className="text-xl font-black text-slate-800 dark:text-white">{current_weather}</span>
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${status.bg} ${status.text}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-xs font-bold">{confidence_level} Confidence</span>
          </div>
        </div>

        {/* Reports count */}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Calculated dynamically from <strong className="text-slate-800 dark:text-slate-200">{report_count} updates</strong> physically reported at this location within the last 6 hours.
        </p>

        {/* Distributions */}
        {Object.keys(distribution).length > 0 && (
          <div className="space-y-2">
            <h5 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Report Distribution</h5>
            <div className="space-y-1.5">
              {Object.entries(distribution).map(([wtype, pct]) => (
                <div key={wtype} className="flex items-center text-xs">
                  <span className="w-24 text-slate-600 dark:text-slate-300 font-medium truncate">{wtype}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mx-3">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                  <span className="w-8 text-right font-bold text-slate-700 dark:text-slate-200">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
