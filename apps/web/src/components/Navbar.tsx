import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLiveSync } from '../context/LiveSyncContext';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useLiveSync();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  ];

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
      {/* Subtle top accent gradient shimmer */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  Parity
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                  Live
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/80 shadow-sm ring-1 ring-emerald-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Real-time SSE Live Sync indicator */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition-all ${
                isConnected
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              }`}
              title={isConnected ? 'Real-time live sync connected via SSE' : 'Connecting to live sync...'}
            >
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              </span>
              <span className="font-semibold tracking-wide hidden sm:inline">
                {isConnected ? 'Live Sync' : 'Reconnecting'}
              </span>
            </div>

            {/* User Profile Capsule */}
            <div className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-400 to-indigo-500 flex items-center justify-center text-[10px] font-extrabold text-slate-950 shadow">
                {initials}
              </div>
              <div className="flex flex-col text-left leading-tight pr-1">
                <span className="text-white font-semibold text-xs">{user?.fullName || 'User'}</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email || 'Active'}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 transition border border-slate-800 hover:border-rose-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation bottom bar */}
      <div className="md:hidden flex border-t border-slate-800/80 bg-slate-950/95 px-4 py-2 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 text-xs font-medium transition ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
