'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { fetchApi } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Shield, Plus, Check, Trash2, MapPin, Eye, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPanel() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Location Form State
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locSuccess, setLocSuccess] = useState('');
  const [locError, setLocError] = useState('');

  const loadData = async () => {
    try {
      // Load reports
      const reportsRes = await fetchApi('/reports/reports/');
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(Array.isArray(reportsData) ? reportsData : (reportsData.results || []));
      }

      // Load locations
      const locationsRes = await fetchApi('/locations/');
      if (locationsRes.ok) {
        setLocations(await locationsRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.username === 'admin') { // Simple admin check (username matches admin)
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleVerify = async (reportId: number) => {
    try {
      const res = await fetchApi(`/reports/reports/${reportId}/verify/`, { method: 'POST' });
      if (res.ok) {
        alert("Report verified!");
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFlagFake = async (reportId: number) => {
    if (!confirm("Are you sure you want to delete this report as fake? The user will be penalized -10 reputation points.")) return;
    try {
      const res = await fetchApi(`/reports/reports/${reportId}/flag_fake/`, { method: 'POST' });
      if (res.ok) {
        alert("Fake report removed!");
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocSuccess('');
    setLocError('');

    try {
      const res = await fetchApi('/locations/', {
        method: 'POST',
        body: JSON.stringify({
          city,
          state: stateName,
          country,
          latitude,
          longitude,
        }),
      });

      if (res.ok) {
        setLocSuccess('New location created successfully!');
        setCity('');
        setStateName('');
        setCountry('');
        setLatitude('');
        setLongitude('');
        loadData();
      } else {
        setLocError('Failed to create location. Check coordinate formatting.');
      }
    } catch (err) {
      setLocError('A connection error occurred.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent animate-spin rounded-full" />
        </div>
      </div>
    );
  }

  // Check if username is admin
  if (!user || user.username !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-sm rounded-3xl border border-white/10 glass-panel p-8 shadow-lg">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Access Only</h2>
            <p className="text-sm text-slate-500 mt-2 mb-6">You must be logged in as 'admin' to access the moderation dashboard.</p>
            <Link href="/login" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-all">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-500" />
            Moderation & Administration Panel
          </h1>
          <p className="text-xs text-slate-500">Verify user submissions and add new geographical markers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Moderation Queue */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pending Verification Queue</h2>
            <div className="space-y-4">
              {reports.filter(r => !r.is_verified).length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
                  <p className="text-sm font-semibold">Moderation queue is empty. Good job!</p>
                </div>
              ) : (
                reports.filter(r => !r.is_verified).map((report) => (
                  <div key={report.id} className="rounded-2xl border border-white/10 glass-panel p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 text-left">
                      <div className="text-slate-800 dark:text-slate-100">
                        <span className="font-bold text-xs">{report.user.username} (Rep: {report.user.reputation_score})</span>
                        <h4 className="text-sm font-bold mt-0.5">{report.weather_type} in {report.location.city}</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm truncate">{report.description || 'No description.'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVerify(report.id)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 flex items-center text-xs font-bold transition-all"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Verify
                      </button>
                      <button
                        onClick={() => handleFlagFake(report.id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 flex items-center text-xs font-bold transition-all"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Flag Fake
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Location Form */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Location</h2>
            <form onSubmit={handleAddLocation} className="rounded-2xl border border-white/10 glass-panel p-5 shadow-md space-y-4">
              {locSuccess && <div className="text-emerald-500 text-xs font-bold text-center">{locSuccess}</div>}
              {locError && <div className="text-red-500 text-xs font-bold text-center">{locError}</div>}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Cape Town"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">State/Region (Optional)</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Western Cape"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Country</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. South Africa"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Latitude</label>
                  <input
                    type="text"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="-33.9249"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Longitude</label>
                  <input
                    type="text"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="18.4241"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Location
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
