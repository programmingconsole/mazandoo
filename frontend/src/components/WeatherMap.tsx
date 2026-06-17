'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl flex items-center justify-center">
      <span className="text-sm font-semibold text-slate-400">Loading Map Module...</span>
    </div>
  )
});

interface Location {
  id: number;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  current_weather?: string;
  confidence_score?: number;
}

interface WeatherMapProps {
  locations: Location[];
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
}

export default function WeatherMap({ 
  locations, 
  center = [-1.2921, 36.8219], // default to Nairobi 
  zoom = 4, 
  userLocation = null 
}: WeatherMapProps) {
  return (
    <div className="w-full h-full relative">
      <MapInner locations={locations} center={center} zoom={zoom} userLocation={userLocation} />
    </div>
  );
}
