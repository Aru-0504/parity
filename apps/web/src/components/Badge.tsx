import React from 'react';

interface BadgeProps {
  type: 'status' | 'priority';
  value: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  if (type === 'status') {
    switch (value) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
            In Progress
          </span>
        );
      case 'NOT_STARTED':
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
            {value === 'PENDING' ? 'Pending' : 'Not Started'}
          </span>
        );
    }
  }

  // Priority
  switch (value) {
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          Low
        </span>
      );
  }
};
