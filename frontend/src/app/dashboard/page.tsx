'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/utils/api';
import ReportCard from '@/components/ReportCard';
import { Award, FileText, MapPin, Eye, ThumbsUp, Activity, User as UserIcon, Settings, X, Check } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [myReports, setMyReports] = useState<any[]>([]);
  const [followedLocations, setFollowedLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setProfileImage(user.profile_image || '');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const loadDashboardData = async () => {
        try {
          // Fetch my reports
          const reportsRes = await fetchApi(`/reports/reports/?user=${user.id}`);
          if (reportsRes.ok) {
            const reportsData = await reportsRes.json();
            setMyReports(Array.isArray(reportsData) ? reportsData : (reportsData.results || []));
          }

          // Fetch followed locations
          const locationsRes = await fetchApi('/locations/followed/');
          if (locationsRes.ok) {
            const locationsData = await locationsRes.json();
            setFollowedLocations(locationsData);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      loadDashboardData();
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const res = await fetchApi('/users/me/', {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
          profile_image: profileImage || null
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        await refreshUser();
        setTimeout(() => {
          setIsEditing(false);
          setSaveSuccess(false);
        }, 1500);
      } else {
        const data = await res.json();
        setSaveError(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setSaveError('A connection error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent animate-spin rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-sm rounded-3xl border border-white/10 glass-panel p-8 shadow-lg">
            <UserIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
            <p className="text-sm text-slate-500 mt-2 mb-6">Please log in to access your personal dashboard.</p>
            <Link href="/login" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-all">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalVotesReceived = myReports.reduce((acc, rep) => acc + (rep.vote_score || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Card / Overview / Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="rounded-3xl border border-white/10 glass-panel p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500 animate-spin-slow" />
                Profile Settings
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {saveError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold p-3 rounded-xl text-center">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold p-3 rounded-xl text-center flex items-center justify-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Profile updated successfully!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. John"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Doe"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Profile Image URL</label>
                <input
                  type="text"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Quick Avatar Presets */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Avatar Preset</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { name: 'Sunny', url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=150&h=150&fit=crop&crop=faces' },
                  { name: 'Rainy', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces' },
                  { name: 'Cloudy', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces' },
                  { name: 'Stormy', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces' },
                  { name: 'Snowy', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces' }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setProfileImage(preset.url)}
                    className={`relative h-12 w-12 rounded-full overflow-hidden border-2 transition-all ${profileImage === preset.url ? 'border-blue-500 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'}`}
                  >
                    <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setProfileImage('')}
                  className={`h-12 w-12 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-slate-650 transition-all ${profileImage === '' ? 'border-blue-500 text-blue-500 bg-blue-50/20' : ''}`}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:dark:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {saving ? (
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-3xl border border-white/10 glass-panel p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6 relative">
            <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center border-2 border-blue-200 dark:border-slate-700 overflow-hidden flex-shrink-0">
              {user.profile_image ? (
                <img src={user.profile_image} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-10 w-10 text-blue-500" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {user.username}
                {(user.first_name || user.last_name) && (
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                    ({user.first_name} {user.last_name})
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
              <p className="text-[10px] text-slate-400 mt-1">Member since {new Date(user.created_at).toLocaleDateString()}</p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
                <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/30">
                  <Award className="h-4 w-4 mr-1.5" />
                  {user.level}
                </span>
                <span className="inline-flex items-center text-xs font-bold text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/30">
                  Reputation: {user.reputation_score} pts
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
            >
              <Settings className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 glass-panel p-5 shadow-md flex items-center space-x-4">
            <div className="h-11 w-11 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900 dark:text-white">{myReports.length}</span>
              <span className="text-xs text-slate-400">Reports Submitted</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 glass-panel p-5 shadow-md flex items-center space-x-4">
            <div className="h-11 w-11 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <ThumbsUp className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900 dark:text-white">{totalVotesReceived}</span>
              <span className="text-xs text-slate-400">Upvotes Received</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 glass-panel p-5 shadow-md flex items-center space-x-4">
            <div className="h-11 w-11 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900 dark:text-white">{followedLocations.length}</span>
              <span className="text-xs text-slate-400">Followed Locations</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Weather Reports list */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-500" />
              Your Weather Reports
            </h2>
            <div className="space-y-6">
              {myReports.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed p-10 text-center text-slate-400">
                  <p className="text-sm">You haven't submitted any weather reports yet.</p>
                  <Link href="/report" className="mt-4 inline-block text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl">
                    Submit Your First Report
                  </Link>
                </div>
              ) : (
                myReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))
              )}
            </div>
          </div>

          {/* Followed Locations & Leveling breakdown */}
          <div className="space-y-6">
            {/* Followed Locations */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center mb-4">
                <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                Followed Locations
              </h2>
              <div className="rounded-2xl border border-white/10 glass-panel p-5 shadow-md space-y-3">
                {followedLocations.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">You aren't following any locations yet. Follow locations to receive severe weather alerts.</p>
                ) : (
                  followedLocations.map((loc) => (
                    <Link 
                      key={loc.id} 
                      href={`/location/${loc.id}`}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-800/40 border border-slate-100 dark:border-slate-800/30 transition-all text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      <span>{loc.city}, {loc.country}</span>
                      <Eye className="h-4 w-4 text-blue-500" />
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Level Thresholds guide */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center mb-4">
                <Award className="h-5 w-5 mr-2 text-blue-500" />
                Contributor Status levels
              </h2>
              <div className="rounded-2xl border border-white/10 glass-panel p-5 shadow-md space-y-3.5 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">Explorer</span>
                  <span className="text-slate-400">0 - 49 pts</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-blue-500">Reporter</span>
                  <span className="text-slate-400">50 - 149 pts</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-teal-500">Local Guide</span>
                  <span className="text-slate-400">150 - 499 pts</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-amber-500">Weather Expert</span>
                  <span className="text-slate-400">500 - 1499 pts</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-emerald-500">Trusted Observer</span>
                  <span className="text-slate-400">1500+ pts</span>
                </div>
                
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] text-slate-400">
                  <p className="font-semibold text-slate-500">How to earn points:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Submit Report: +5 pts</li>
                    <li>Upload Verified Photo: +10 pts</li>
                    <li>Upvote Received: +2 pts</li>
                    <li>Report Confirmed: +5 pts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
