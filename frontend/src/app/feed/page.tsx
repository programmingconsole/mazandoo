'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ReportCard from '@/components/ReportCard';
import { fetchApi } from '@/utils/api';
import { Cloud, Search, Filter, RefreshCw } from 'lucide-react';

const WEATHER_TYPES = [
  'Sunny', 'Cloudy', 'Rainy', 'Foggy', 'Windy', 'Storm', 'Flooding', 'Snow', 'Extreme Heat'
];

export default function Feed() {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [search, setSearch] = useState('');
  const [selectedWeather, setSelectedWeather] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLocations = async () => {
    try {
      const res = await fetchApi('/locations/');
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      let url = '/reports/reports/';
      const params = [];
      if (selectedWeather) {
        params.push(`weather_type=${encodeURIComponent(selectedWeather)}`);
      }
      if (selectedLocation) {
        params.push(`location=${selectedLocation}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const res = await fetchApi(url);
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        setReports(results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    loadReports();
  }, [selectedWeather, selectedLocation]);

  useEffect(() => {
    if (search.trim()) {
      const filtered = reports.filter((r: any) => 
        r.location.city.toLowerCase().includes(search.toLowerCase()) ||
        r.location.country.toLowerCase().includes(search.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(search.toLowerCase())) ||
        r.weather_type.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredReports(filtered);
    } else {
      setFilteredReports(reports);
    }
  }, [search, reports]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
              <Cloud className="h-6 w-6 mr-2 text-blue-500" />
              Community Weather Feed
            </h1>
            <p className="text-xs text-slate-500">Real-time weather reports submitted directly by visitors physically present</p>
          </div>
          
          <button
            onClick={loadReports}
            className="flex items-center self-start md:self-auto px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </button>
        </div>

        {/* Filters Panel */}
        <div className="rounded-2xl border border-white/10 glass-panel p-4 shadow-md flex flex-col lg:flex-row gap-4 items-center w-full">
          {/* Search bar */}
          <div className="relative flex items-center w-full lg:flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
            <Search className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by city, country, or weather keyword..."
              className="w-full h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          {/* Location filter */}
          <div className="flex items-center space-x-2 w-full lg:w-auto">
            <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-full lg:w-48 bg-white dark:bg-slate-950"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id.toString()} className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">
                  {loc.city}, {loc.country}
                </option>
              ))}
            </select>
          </div>

          {/* Weather type filter */}
          <div className="flex items-center space-x-2 w-full lg:w-auto">
            <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedWeather}
              onChange={(e) => setSelectedWeather(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-full lg:w-48 bg-white dark:bg-slate-950"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">All Weather Types</option>
              {WEATHER_TYPES.map((type) => (
                <option key={type} value={type} className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Feed Reports List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-20">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent animate-spin rounded-full inline-block" />
              <p className="text-xs text-slate-500 mt-2">Loading updates...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed p-16 text-center text-slate-400">
              <p className="text-sm">No reports match your filters.</p>
              <button
                onClick={() => { setSearch(''); setSelectedWeather(''); setSelectedLocation(''); }}
                className="mt-4 text-xs font-bold text-blue-500 hover:underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
