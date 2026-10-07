import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLiveSync } from '../context/LiveSyncContext';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, User, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useLiveSync();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Parity
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
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-slate-800 text-emerald-400 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Real-time SSE Live Sync indicator */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
              title={isConnected ? 'Real-time live sync active' : 'Connecting to live sync...'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline">{isConnected ? 'Live Sync' : 'Connecting'}</span>
            </div>

            <div className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-medium">{user?.fullName}</span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition border border-rose-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile nav bar */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-900/95 px-4 py-2 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 text-xs font-medium ${
                isActive ? 'text-emerald-400' : 'text-slate-400'
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
