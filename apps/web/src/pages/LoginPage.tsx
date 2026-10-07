import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { FolderKanban, LogIn, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@example.com');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 items-center justify-center shadow-xl shadow-indigo-500/20 mb-4">
            <FolderKanban className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Sign in to Parity</h1>
          <p className="text-slate-400 mt-2 text-sm">Unified cross-platform project & task management</p>
        </div>

        {isExpired && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-amber-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Session Expired</p>
              <p className="text-amber-300/80 text-xs mt-0.5">Your token has expired. Please log in again to continue.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={fillDemoAccount}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 flex items-center justify-center space-x-2 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fill Demo Credentials (Reviewer Quick-Access)</span>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
