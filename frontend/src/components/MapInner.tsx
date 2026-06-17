'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

interface Location {
  id: number;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  current_weather?: string;
  confidence_score?: number;
}

interface MapInnerProps {
  locations: Location[];
  center: [number, number];
  zoom: number;
  userLocation: [number, number] | null;
}

// Fix default Leaflet icon paths
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Custom Weather Markers
const createWeatherIcon = (weatherType: string) => {
  let bgColor = 'bg-amber-500';
  let emoji = '☀️';

  switch (weatherType) {
    case 'Sunny': bgColor = 'bg-amber-400'; emoji = '☀️'; break;
    case 'Cloudy': bgColor = 'bg-slate-400'; emoji = '☁️'; break;
    case 'Rainy': bgColor = 'bg-blue-500'; emoji = '🌧️'; break;
    case 'Foggy': bgColor = 'bg-slate-300'; emoji = '🌫️'; break;
    case 'Windy': bgColor = 'bg-teal-400'; emoji = '💨'; break;
    case 'Storm': bgColor = 'bg-slate-800'; emoji = '⛈️'; break;
    case 'Flooding': bgColor = 'bg-blue-700'; emoji = '🌊'; break;
    case 'Snow': bgColor = 'bg-sky-200'; emoji = '❄️'; break;
    case 'Extreme Heat': bgColor = 'bg-red-500'; emoji = '🔥'; break;
  }

  return L.divIcon({
    html: `<div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white text-white shadow-lg ${bgColor} text-sm">${emoji}</div>`,
    className: 'custom-weather-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapInner({ locations, center, zoom, userLocation }: MapInnerProps) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full">
        <ChangeView center={center} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker 
            position={userLocation} 
            icon={L.divIcon({
              html: `<div class="relative flex h-5 w-5">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-500 border-2 border-white"></span>
                    </div>`,
              className: 'user-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <div className="text-center font-bold text-xs">You are here</div>
            </Popup>
          </Marker>
        )}

        {/* Location Weather Markers */}
        {locations.map((loc) => {
          const lat = parseFloat(loc.latitude.toString());
          const lon = parseFloat(loc.longitude.toString());
          if (isNaN(lat) || isNaN(lon)) return null;

          return (
            <Marker 
              key={loc.id} 
              position={[lat, lon]}
              icon={createWeatherIcon(loc.current_weather || 'Sunny')}
            >
              <Popup>
                <div className="p-1 min-w-[120px] text-slate-800">
                  <h4 className="font-bold text-sm leading-tight">{loc.city}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{loc.country}</p>
                  
                  <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between items-center text-xs">
                    <span className="font-semibold">{loc.current_weather || 'No Reports'}</span>
                    {loc.confidence_score !== undefined && (
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">
                        {loc.confidence_score}%
                      </span>
                    )}
                  </div>

                  <Link 
                    href={`/location/${loc.id}`}
                    className="block text-center text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 px-2 py-1.5 rounded-lg mt-2.5 transition-colors no-underline"
                  >
                    View Community Feed
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
