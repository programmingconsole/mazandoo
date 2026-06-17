'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CloudSun, Key, User as UserIcon, Mail, ShieldCheck, ChevronLeft } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const success = await register(username, email, firstName, lastName, password, passwordConfirm);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Failed to create account. Username or email might already be taken.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
          Create an account
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-blue-500 hover:underline">
            Sign In
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-white/10 glass-panel p-8 shadow-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold p-3.5 rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  First Name
                </label>
                <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                  <input
                    id="first_name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="last_name" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Last Name
                </label>
                <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                  <input
                    id="last_name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Username
              </label>
              <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <UserIcon className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email
              </label>
              <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <Mail className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <Key className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  id="password"
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
              <label htmlFor="password_confirm" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <Key className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  id="password_confirm"
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center h-11 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:bg-slate-300 disabled:dark:bg-slate-800"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Register
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
