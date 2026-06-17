'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import LocationSearch from '@/components/LocationSearch';
import WeatherMap from '@/components/WeatherMap';
import ReportCard from '@/components/ReportCard';
import { fetchApi } from '@/utils/api';
import { CloudSun, Users, Navigation, CheckCircle2, TrendingUp, Compass } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [locations, setLocations] = useState<any[]>([]);
  const [latestReports, setLatestReports] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalReports: 1240,
    verifiedPhotos: 890,
    activeGuides: 340,
    confidenceIndex: 94
  });

  useEffect(() => {
    // Load locations and latest reports
    const loadData = async () => {
      try {
        // Fetch locations
        const locRes = await fetchApi('/locations/');
        if (locRes.ok) {
          const locData = await locRes.json();
          
          // Annotate each location with confidence score and current weather
          const locationsWithConfidence = await Promise.all(
            locData.map(async (loc: any) => {
              try {
                const confRes = await fetchApi(`/reports/confidence/?location=${loc.id}`);
                if (confRes.ok) {
                  const confData = await confRes.json();
                  return {
                    ...loc,
                    current_weather: confData.current_weather,
                    confidence_score: confData.confidence_score
                  };
                }
              } catch (e) {
                console.error(e);
              }
              return loc;
            })
          );
          setLocations(locationsWithConfidence);
        }

        // Fetch latest reports
        const repRes = await fetchApi('/reports/reports/?limit=3');
        if (repRes.ok) {
          const repData = await repRes.json();
          // If Paginated DRF response
          setLatestReports(Array.isArray(repData) ? repData.slice(0, 3) : (repData.results ? repData.results.slice(0, 3) : []));
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/10">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
              Hyperlocal weather, <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                reported by people physically present.
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Skip inaccurate weather forecast models. Get real-time, GPS-verified weather reports from drivers, hikers, tourists, and locals.
            </p>
            
            <div className="mt-10">
              <LocationSearch />
            </div>
          </div>
        </section>

        {/* Interactive Map Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
          <div className="rounded-3xl border border-white/10 glass-panel p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                  <Compass className="h-5 w-5 mr-2 text-blue-500" />
                  Live Weather Map
                </h2>
                <p className="text-xs text-slate-500">Explore reported weather patterns globally</p>
              </div>
              <Link href="/feed" className="text-xs font-bold text-blue-500 hover:underline">
                View List Feed &rarr;
              </Link>
            </div>
            <div className="h-[450px] w-full rounded-2xl overflow-hidden relative">
              <WeatherMap locations={locations} />
            </div>
          </div>
        </section>

        {/* Stats Panel */}
        <section className="bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-800/40 py-12 px-4 sm:px-6 lg:px-8 mb-16">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-3">
                <Navigation className="h-6 w-6" />
              </div>
              <span className="block text-3xl font-black text-slate-900 dark:text-white">{stats.totalReports}</span>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1 block">Reports Submitted</span>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <span className="block text-3xl font-black text-slate-900 dark:text-white">{stats.verifiedPhotos}</span>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1 block">Verified Photos</span>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-3">
                <Users className="h-6 w-6" />
              </div>
              <span className="block text-3xl font-black text-slate-900 dark:text-white">{stats.activeGuides}</span>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1 block">Active Guides</span>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-3">
                <CloudSun className="h-6 w-6" />
              </div>
              <span className="block text-3xl font-black text-slate-900 dark:text-white">{stats.confidenceIndex}%</span>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1 block">Confidence Index</span>
            </div>
          </div>
        </section>

        {/* Latest Reports & Trending Locations */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
          {/* Latest Reports */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <Compass className="h-5 w-5 mr-2 text-blue-500" />
              Latest Community Updates
            </h2>
            <div className="space-y-6">
              {latestReports.length === 0 ? (
                <p className="text-sm text-slate-400 py-6">No weather reports submitted yet.</p>
              ) : (
                latestReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))
              )}
            </div>
          </div>

          {/* Trending Locations */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              Trending Locations
            </h2>
            <div className="rounded-3xl border border-white/10 glass-panel p-5 shadow-lg space-y-4">
              {locations.length === 0 ? (
                <p className="text-sm text-slate-400">Loading locations...</p>
              ) : (
                locations.slice(0, 5).map((loc) => (
                  <Link 
                    key={loc.id} 
                    href={`/location/${loc.id}`}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/40 border border-transparent hover:border-slate-100 dark:hover:border-slate-800/40 transition-all duration-300"
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">{loc.city}</span>
                      <span className="text-[10px] text-slate-400">{loc.country}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                        {loc.current_weather || "Unknown"}
                      </span>
                      {loc.confidence_score !== undefined && (
                        <span className="text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">
                          {loc.confidence_score}% Conf.
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/60 py-8 bg-slate-100/50 dark:bg-slate-950 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Mazhandoo Weather Platform. All rights reserved.</p>
          <p className="mt-2 text-[10px]">Hyperlocal, spatial weather reports verified by GPS coordinates.</p>
        </div>
      </footer>
    </div>
  );
}
