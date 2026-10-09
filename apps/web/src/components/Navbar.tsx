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
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7DFD7] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src="/favicon.png"
                alt="Parity"
                className="w-9 h-9 rounded-xl object-contain shadow-sm group-hover:scale-105 transition-transform duration-200"
              />
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-[#2F4156]">
                  Parity
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#2F4156] text-white shadow-sm'
                        : 'text-[#567C8D] hover:text-[#2F4156] hover:bg-[#F5EFEB]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#C8D9E6]' : 'text-[#567C8D]'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Real-time SSE Live Sync indicator */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isConnected
                  ? 'bg-[#F0F5EA] text-[#4E6738] border-[#CCD8BF]'
                  : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
              }`}
              title={isConnected ? 'Real-time live sync connected via SSE' : 'Connecting to live sync...'}
            >
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A6B58A] opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-[#7D8C62]' : 'bg-[#D97706]'
                  }`}
                />
              </span>
              <span className="tracking-wide hidden sm:inline">
                {isConnected ? 'Live Sync' : 'Reconnecting'}
              </span>
            </div>

            {/* User Profile Capsule */}
            <div className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-[#F5EFEB] border border-[#E7DFD7]">
              <div className="w-6 h-6 rounded-full bg-[#2F4156] flex items-center justify-center text-[10px] font-bold text-white">
                {initials}
              </div>
              <div className="flex flex-col text-left leading-tight pr-1">
                <span className="text-[#2F4156] font-semibold text-xs">{user?.fullName || 'User'}</span>
                <span className="text-[10px] text-[#567C8D] truncate max-w-[120px]">{user?.email || 'Active'}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#B46A72] hover:bg-[#F9ECEE] transition border border-transparent hover:border-[#E8C6CA]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation bottom bar */}
      <div className="md:hidden flex border-t border-[#E7DFD7] bg-white px-4 py-2 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 text-xs font-medium transition ${
                isActive ? 'text-[#2F4156] font-bold' : 'text-[#567C8D]'
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
