'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CloudSun, Key, User as UserIcon, LogIn, ChevronLeft } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <CloudSun className="h-12 w-12 text-blue-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Or{' '}
          <Link href="/register" className="font-bold text-blue-500 hover:underline">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-white/10 glass-panel p-8 shadow-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold p-3.5 rounded-xl text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Username
              </label>
              <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <UserIcon className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <div className="text-xs">
                  <a href="#" className="font-semibold text-blue-500 hover:underline">
                    Forgot your password?
                  </a>
                </div>
              </div>
              <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <Key className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center h-11 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:bg-slate-300 disabled:dark:bg-slate-800"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Social login divider */}
          <div className="mt-6">
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-50 dark:bg-slate-950 px-2 text-slate-400 font-medium z-10">Or continue with</span>
              <div className="absolute top-1/2 left-0 w-full border-t border-slate-200 dark:border-slate-800" />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => alert("Google Sign-in clicked (social skeleton).")}
                className="w-full flex items-center justify-center h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/40 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.78 0-8.678-3.854-8.678-8.519s3.897-8.52 8.678-8.52c2.27 0 4.19.795 5.67 2.22l3.24-3.24C18.66 1.15 15.65 0 12.24 0 5.48 0 0 5.37 0 12s5.48 12 12.24 12c6.23 0 11.26-4.39 11.26-10.8 0-.82-.07-1.59-.2-2.315H12.24z" />
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
