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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5EFEB] relative overflow-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#2F4156] items-center justify-center shadow-lg shadow-[#2F4156]/20 mb-4">
            <FolderKanban className="w-8 h-8 text-[#C8D9E6]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#2F4156] tracking-tight">Sign in to Parity</h1>
          <p className="text-[#567C8D] mt-2 text-sm">Unified cross-platform project & task management</p>
        </div>

        {isExpired && (
          <div className="mb-6 p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-start space-x-3 text-[#92400E] text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Session Expired</p>
              <p className="text-[#92400E]/80 text-xs mt-0.5">Your token has expired. Please log in again to continue.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#F9ECEE] border border-[#E8C6CA] flex items-start space-x-3 text-[#934E55] text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="glass-card rounded-3xl p-8 shadow-xl bg-white border border-[#E7DFD7]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2F4156] mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E7DFD7] text-[#2F4156] placeholder-[#8A9BA8] focus:outline-none focus:border-[#567C8D] transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2F4156] mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E7DFD7] text-[#2F4156] placeholder-[#8A9BA8] focus:outline-none focus:border-[#567C8D] transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#2F4156] hover:bg-[#1E2C3A] text-white font-bold text-sm shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4 text-[#C8D9E6]" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E7DFD7]">
            <button
              type="button"
              onClick={fillDemoAccount}
              className="w-full py-2.5 px-4 rounded-xl bg-[#EBF2F5] hover:bg-[#C8D9E6] text-[#2F4156] font-semibold text-xs border border-[#C8D9E6] flex items-center justify-center space-x-2 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#567C8D]" />
              <span>Fill Demo Credentials (Reviewer Quick-Access)</span>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-[#567C8D] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#2F4156] hover:text-[#567C8D] font-bold underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
