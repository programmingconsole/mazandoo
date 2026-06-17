'use client';

import React, { useState } from 'react';
import { 
  Sun, Cloud, CloudRain, CloudFog, Wind, 
  CloudLightning, Waves, Snowflake, Thermometer, 
  ThumbsUp, ThumbsDown, MessageSquare, Image as ImageIcon, CheckCircle, ShieldAlert 
} from 'lucide-react';
import { fetchApi } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

interface ReportCardProps {
  report: any;
  onVoteSuccess?: () => void;
}

export const WEATHER_METADATA: Record<string, { icon: any; color: string; bg: string }> = {
  'Sunny': { icon: Sun, color: 'text-amber-500', bg: 'weather-sunny' },
  'Cloudy': { icon: Cloud, color: 'text-slate-400', bg: 'weather-cloudy' },
  'Rainy': { icon: CloudRain, color: 'text-blue-500', bg: 'weather-rainy' },
  'Foggy': { icon: CloudFog, color: 'text-slate-300', bg: 'weather-foggy' },
  'Windy': { icon: Wind, color: 'text-teal-400', bg: 'weather-windy' },
  'Storm': { icon: CloudLightning, color: 'text-purple-600', bg: 'weather-storm' },
  'Flooding': { icon: Waves, color: 'text-blue-600', bg: 'weather-flooding' },
  'Snow': { icon: Snowflake, color: 'text-sky-300', bg: 'weather-snow' },
  'Extreme Heat': { icon: Thermometer, color: 'text-red-500', bg: 'weather-extreme-heat' },
};

export default function ReportCard({ report: initialReport, onVoteSuccess }: ReportCardProps) {
  const { user } = useAuth();
  const [report, setReport] = useState(initialReport);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const meta = WEATHER_METADATA[report.weather_type] || { icon: Cloud, color: 'text-slate-400', bg: 'bg-slate-400' };
  const WeatherIcon = meta.icon;

  const handleVote = async (type: 'UP' | 'DOWN') => {
    if (!user) {
      alert("You must be logged in to vote.");
      return;
    }
    try {
      const res = await fetchApi(`/reports/reports/${report.id}/vote/`, {
        method: 'POST',
        body: JSON.stringify({ vote_type: type }),
      });
      if (res.ok) {
        const data = await res.json();
        setReport({
          ...report,
          vote_score: data.vote_score,
          user_vote: data.status === 'vote_registered' ? type : (data.status === 'vote_changed' ? type : null)
        });
        if (onVoteSuccess) onVoteSuccess();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetchApi(`/reports/reports/${report.id}/comments/`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetchApi(`/reports/reports/${report.id}/comment/`, {
        method: 'POST',
        body: JSON.stringify({ comment: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments([data, ...comments]);
        setNewComment('');
        setReport({
          ...report,
          comments_count: report.comments_count + 1
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 glass-panel shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
            {report.user.profile_image ? (
              <img src={report.user.profile_image} alt="User" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-slate-500">{report.user.username.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{report.user.username}</span>
              {report.is_verified && (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              )}
            </div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md font-medium">
              {report.user.level} (Rep: {report.user.reputation_score})
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            {report.location.city}
          </span>
          <span className="text-[10px] text-slate-400">
            {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(report.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Weather Info */}
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className={`h-14 w-14 rounded-2xl ${meta.bg} flex items-center justify-center shadow-md`}>
            <WeatherIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{report.weather_type}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{report.description || "No description provided."}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
          <div className="bg-slate-50 dark:bg-slate-800/40 px-3.5 py-2 rounded-xl text-center min-w-[70px] border border-slate-100 dark:border-slate-800/30">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Temp</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(report.temperature)}°C</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/40 px-3.5 py-2 rounded-xl text-center min-w-[70px] border border-slate-100 dark:border-slate-800/30">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Visibility</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{report.visibility}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/40 px-3.5 py-2 rounded-xl text-center min-w-[70px] border border-slate-100 dark:border-slate-800/30">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Wind</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{report.wind_condition}</span>
          </div>
        </div>
      </div>

      {/* Image if available */}
      {report.image && (
        <div className="px-5 pb-5">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <img 
              src={report.image} 
              alt={`Weather update for ${report.location.city}`} 
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40">
        <div className="flex items-center space-x-2">
          {/* Upvote */}
          <button
            onClick={() => handleVote('UP')}
            className={`p-2 rounded-xl border flex items-center space-x-1.5 transition-all text-xs font-semibold ${report.user_vote === 'UP' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10' : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{report.vote_score}</span>
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote('DOWN')}
            className={`p-2 rounded-xl border flex items-center transition-all text-xs font-semibold ${report.user_vote === 'DOWN' ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/10' : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>

        {/* Comments Toggle */}
        <button
          onClick={toggleComments}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
        >
          <MessageSquare className="h-4 w-4 text-blue-500" />
          <span>Comments ({report.comments_count})</span>
        </button>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="p-5 border-t border-slate-100 dark:border-slate-800/40 bg-slate-50/20 dark:bg-slate-900/10 space-y-4">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Write a comment..." : "Login to write comments"}
              disabled={!user}
              className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 outline-none"
            />
            <button
              type="submit"
              disabled={!user || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:dark:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex-shrink-0"
            >
              Post
            </button>
          </form>

          {loadingComments ? (
            <div className="text-center py-4">
              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent animate-spin rounded-full inline-block" />
            </div>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No comments on this report.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 flex items-start space-x-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden flex-shrink-0">
                      {c.user.profile_image ? (
                        <img src={c.user.profile_image} alt="User" />
                      ) : (
                        c.user.username.substring(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{c.user.username}</span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{c.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
