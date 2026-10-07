import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { FolderKanban, UserPlus, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/register', { fullName, email, password });
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5EFEB] relative overflow-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#2F4156] items-center justify-center shadow-lg shadow-[#2F4156]/20 mb-4">
            <FolderKanban className="w-8 h-8 text-[#C8D9E6]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#2F4156] tracking-tight">Create an Account</h1>
          <p className="text-[#567C8D] mt-2 text-sm">Join Parity — unified task & project tracking</p>
        </div>

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
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E7DFD7] text-[#2F4156] placeholder-[#8A9BA8] focus:outline-none focus:border-[#567C8D] transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2F4156] mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E7DFD7] text-[#2F4156] placeholder-[#8A9BA8] focus:outline-none focus:border-[#567C8D] transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#2F4156] hover:bg-[#1E2C3A] text-white font-bold text-sm shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 text-[#C8D9E6]" />
              <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#567C8D] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2F4156] hover:text-[#567C8D] font-bold underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
