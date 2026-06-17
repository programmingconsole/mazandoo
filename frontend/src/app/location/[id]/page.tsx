'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import ReportCard from '@/components/ReportCard';
import ConfidenceEngine from '@/components/ConfidenceEngine';
import WeatherMap from '@/components/WeatherMap';
import { fetchApi } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Eye, EyeOff, AlertTriangle, Info, Clock, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function LocationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [location, setLocation] = useState<any>(null);
  const [confidence, setConfidence] = useState<any>(null);
  const [advisory, setAdvisory] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const loadData = async () => {
    try {
      // Fetch location meta
      const locRes = await fetchApi(`/locations/${id}/`);
      if (locRes.ok) {
        const locData = await locRes.json();
        setLocation(locData);
        setIsFollowing(locData.is_followed);
      }

      // Fetch confidence metrics
      const confRes = await fetchApi(`/reports/confidence/?location=${id}`);
      if (confRes.ok) {
        setConfidence(await confRes.json());
      }

      // Fetch travel advisory
      const advRes = await fetchApi(`/reports/advisory/?location=${id}`);
      if (advRes.ok) {
        setAdvisory(await advRes.json());
      }

      // Fetch reports
      const repRes = await fetchApi(`/reports/reports/?location=${id}`);
      if (repRes.ok) {
        const repData = await repRes.json();
        setReports(Array.isArray(repData) ? repData : (repData.results || []));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleFollow = async () => {
    if (!user) {
      alert("You must be logged in to follow locations.");
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetchApi(`/locations/${id}/follow/`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.is_followed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
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

  if (!location) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-sm text-slate-400">Location not found.</p>
          <Link href="/" className="mt-4 text-xs font-bold text-blue-500 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const mapCenter: [number, number] = [parseFloat(location.latitude), parseFloat(location.longitude)];

  // Determine advisory styles
  const getAdvisoryColor = (level: string) => {
    switch (level) {
      case 'Danger':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400';
      case 'Warning':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400';
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title Header with Follow Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold">{location.country}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {location.city}{location.state ? `, ${location.state}` : ''}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href={`/report?location=${location.id}`}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              Submit Report here
            </Link>
            
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex items-center px-4 py-2.5 border rounded-xl text-xs font-bold transition-all ${isFollowing ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700' : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40'}`}
            >
              {isFollowing ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1.5" />
                  Unfollow
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1.5" />
                  Follow Location
                </>
              )}
            </button>
          </div>
        </div>

        {/* Travel Advisory Alert Banner */}
        {advisory && advisory.advisory_level !== 'Normal' && (
          <div className={`p-4 rounded-2xl border flex items-start space-x-3 shadow-sm ${getAdvisoryColor(advisory.advisory_level)}`}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs uppercase tracking-wider block">Advisory Level: {advisory.advisory_level}</span>
              <p className="text-xs font-medium mt-1">{advisory.advisory_message}</p>
            </div>
          </div>
        )}

        {/* Confidence Engine widget */}
        {confidence && (
          <ConfidenceEngine confidenceData={confidence} />
        )}

        {/* Map & Photo grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2 rounded-3xl border border-white/10 glass-panel p-4 shadow-md flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center px-1">
              <Info className="h-4 w-4 mr-2 text-blue-500" />
              Hyperlocal Location Context Map
            </h3>
            <div className="flex-1 min-h-[300px] h-[350px] relative rounded-xl overflow-hidden">
              <WeatherMap locations={[location]} center={mapCenter} zoom={12} />
            </div>
          </div>

          {/* Photo Gallery of recent weather */}
          <div className="rounded-3xl border border-white/10 glass-panel p-5 shadow-md flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <ImageIcon className="h-4 w-4 mr-2 text-blue-500" />
              Community Photos (last 24h)
            </h3>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[350px] pr-1">
              {reports.filter(r => r.image).length === 0 ? (
                <p className="col-span-2 text-xs text-slate-400 text-center py-10">No recent photos uploaded for this location.</p>
              ) : (
                reports.filter(r => r.image).map(r => (
                  <div key={r.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    <img src={r.image} alt="Weather Update" className="object-cover w-full h-full" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Timeline Weather Feed */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Live Weather Timeline
          </h2>
          <div className="space-y-6">
            {reports.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed p-10 text-center text-slate-400">
                <p className="text-sm">No recent updates for this location.</p>
              </div>
            ) : (
              reports.map((report) => (
                <ReportCard key={report.id} report={report} onVoteSuccess={loadData} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
