'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { CloudSun, Bell, User as UserIcon, LogOut, ShieldAlert, Award } from 'lucide-react';
import { fetchApi } from '@/utils/api';

export default function Header() {
  const { user, logout } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      // Fetch notifications
      const loadNotifications = async () => {
        try {
          const res = await fetchApi('/notifications/');
          if (res.ok) {
            const data = await res.json();
            setNotifications(data);
            setUnreadNotifications(data.filter((n: any) => !n.is_read).length);
          }
        } catch (err) {
          console.error(err);
        }
      };

      loadNotifications();
      // Poll every 30 seconds for live weather notifications
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetchApi('/notifications/mark_all_read/', { method: 'POST' });
      if (res.ok) {
        setUnreadNotifications(0);
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 glass-panel backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          <CloudSun className="h-8 w-8 text-blue-500 animate-pulse" />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
            Mazhandoo
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/feed" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
            Weather Feed
          </Link>
          <Link href="/report" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
            Submit Report
          </Link>
          {user && (
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
              Dashboard
            </Link>
          )}
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Notification Center */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 rounded-xl border border-white/10 glass-panel p-4 shadow-xl z-50">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Alerts & Notifications</h4>
                      {unreadNotifications > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-blue-500 hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-3">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-2.5 rounded-lg border text-left ${n.is_read ? 'bg-transparent border-slate-100 dark:border-slate-800/40' : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'}`}>
                            <div className="flex items-start space-x-2">
                              <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</h5>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{n.message}</p>
                                <span className="text-[9px] text-slate-400 block mt-1">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Badge */}
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:block text-right">
                  <span className="block text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {user.username}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                    <Award className="h-3 w-3 mr-0.5" />
                    {user.level} ({user.reputation_score} pts)
                  </span>
                </div>
                <Link href="/dashboard" className="h-9 w-9 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center border border-blue-200 dark:border-slate-700 overflow-hidden">
                  {user.profile_image ? (
                    <img src={user.profile_image} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-blue-500" />
                  )}
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-1.5 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/10">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
