import React from 'react';

interface BadgeProps {
  type: 'status' | 'priority' | 'health';
  value: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  if (type === 'health') {
    switch (value) {
      case 'ON_TRACK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F0F5EA] text-[#4E6738] border border-[#CCD8BF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7D8C62] mr-1.5"></span>
            On Track
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] mr-1.5"></span>
            At Risk
          </span>
        );
      case 'OVERDUE':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F9ECEE] text-[#934E55] border border-[#E8C6CA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B46A72] mr-1.5 animate-pulse"></span>
            Overdue
          </span>
        );
    }
  }

  if (type === 'status') {
    switch (value) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F5EA] text-[#4E6738] border border-[#CCD8BF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7D8C62] mr-1.5"></span>
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F5F9] text-[#2F4156] border border-[#C8D9E6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#567C8D] mr-1.5"></span>
            In Progress
          </span>
        );
      case 'NOT_STARTED':
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5EFEB] text-[#567C8D] border border-[#E7DFD7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A9BA8] mr-1.5"></span>
            {value === 'PENDING' ? 'Pending' : 'Not Started'}
          </span>
        );
    }
  }

  // Priority
  switch (value) {
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#F9ECEE] text-[#934E55] border border-[#E8C6CA]">
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#EBF2F5] text-[#3F5E6C] border border-[#C8D9E6]">
          Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#F5EFEB] text-[#567C8D] border border-[#E7DFD7]">
          Low
        </span>
      );
  }
};
