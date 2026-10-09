import React, { useState } from 'react';
import { TaskDto, ProjectDto, TaskStatusType } from '@ismo/shared';
import { Badge } from './Badge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Circle,
  FolderKanban,
  Edit2,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';

interface TimelineViewProps {
  tasks: TaskDto[];
  projects?: ProjectDto[];
  onEditTask: (task: TaskDto) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStatus: (task: TaskDto) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  projects,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timelineMode, setTimelineMode] = useState<'calendar' | 'gantt'>('calendar');

  const getProjectName = (projectId: string) => {
    if (!projects) return null;
    return projects.find((p) => p.id === projectId)?.name;
  };

  // Date Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Map tasks to days of month
  const getTasksForDay = (day: number) => {
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const dueStr = t.dueDate.split('T')[0];
      return dueStr === targetDateStr;
    });
  };

  // Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'COMPLETED' || !t.dueDate) return false;
    return new Date(t.dueDate) < today;
  });

  const dueThisWeekTasks = tasks.filter((t) => {
    if (t.status === 'COMPLETED' || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  // Days array for calendar grid
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const isToday = (day: number) => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#E7DFD7] flex items-center space-x-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#F9ECEE] flex items-center justify-center text-[#934E55]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[#934E55]">{overdueTasks.length}</div>
            <div className="text-xs text-[#567C8D] font-medium">Overdue Deadlines</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E7DFD7] flex items-center space-x-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#92400E]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[#92400E]">{dueThisWeekTasks.length}</div>
            <div className="text-xs text-[#567C8D] font-medium">Due in Next 7 Days</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E7DFD7] flex items-center space-x-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#F0F5EA] flex items-center justify-center text-[#7D8C62]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[#7D8C62]">{completedTasks.length}</div>
            <div className="text-xs text-[#567C8D] font-medium">Delivered / Completed</div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-[#E7DFD7] p-6 shadow-sm">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E7DFD7]">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-[#2F4156]">{monthName}</h2>
            <div className="flex items-center space-x-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-[#E7DFD7] hover:bg-[#F5EFEB] text-[#567C8D] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E7DFD7] hover:bg-[#F5EFEB] text-[#2F4156] transition"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-[#E7DFD7] hover:bg-[#F5EFEB] text-[#567C8D] transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-view toggle: Calendar vs Gantt schedule */}
          <div className="flex items-center bg-[#F5EFEB] p-1 rounded-xl space-x-1">
            <button
              onClick={() => setTimelineMode('calendar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                timelineMode === 'calendar'
                  ? 'bg-white text-[#2F4156] shadow-sm'
                  : 'text-[#567C8D] hover:text-[#2F4156]'
              }`}
            >
              Monthly Calendar
            </button>
            <button
              onClick={() => setTimelineMode('gantt')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                timelineMode === 'gantt'
                  ? 'bg-white text-[#2F4156] shadow-sm'
                  : 'text-[#567C8D] hover:text-[#2F4156]'
              }`}
            >
              Gantt / Schedule Timeline
            </button>
          </div>
        </div>

        {/* View Mode 1: Calendar Grid */}
        {timelineMode === 'calendar' ? (
          <div className="mt-6">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-[#8A9BA8] tracking-wider uppercase">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {daysArray.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[110px] bg-[#FAF7F5]/40 rounded-xl border border-transparent"
                    />
                  );
                }

                const dayTasks = getTasksForDay(day);
                const isCurrent = isToday(day);

                return (
                  <div
                    key={`day-${day}`}
                    className={`min-h-[110px] p-2 rounded-xl border transition-all flex flex-col ${
                      isCurrent
                        ? 'border-[#2F4156] bg-[#EBF2F5]/30'
                        : 'border-[#F0EBE5] hover:border-[#C8D9E6] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isCurrent
                            ? 'bg-[#2F4156] text-white'
                            : 'text-[#567C8D]'
                        }`}
                      >
                        {day}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] font-bold text-[#567C8D] bg-[#F5EFEB] px-1.5 py-0.5 rounded-full">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                      {dayTasks.map((t) => {
                        const isTaskOverdue =
                          t.status !== 'COMPLETED' &&
                          new Date(t.dueDate!) < today;

                        return (
                          <div
                            key={t.id}
                            onClick={() => onEditTask(t)}
                            className={`p-1.5 rounded-md text-[11px] font-medium border cursor-pointer hover:shadow transition truncate ${
                              t.status === 'COMPLETED'
                                ? 'bg-[#F0F5EA] text-[#7D8C62] border-[#CCD8BF] line-through'
                                : isTaskOverdue
                                ? 'bg-[#F9ECEE] text-[#934E55] border-[#E8C6CA] font-semibold'
                                : 'bg-[#FAF7F5] text-[#2F4156] border-[#E7DFD7]'
                            }`}
                            title={`${t.name} (${t.priority} Priority)`}
                          >
                            <div className="flex items-center space-x-1 truncate">
                              <span
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  t.priority === 'HIGH'
                                    ? 'bg-[#934E55]'
                                    : t.priority === 'MEDIUM'
                                    ? 'bg-[#92400E]'
                                    : 'bg-[#7D8C62]'
                                }`}
                              />
                              <span className="truncate">{t.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* View Mode 2: Gantt Schedule View */
          <div className="mt-6 space-y-4">
            <div className="text-xs font-bold text-[#567C8D] uppercase tracking-wider mb-2">
              Active Initiative Schedules & Due Dates
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12 text-[#8A9BA8] text-sm">
                No tasks available for timeline analysis.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const created = new Date(task.createdAt);
                  const due = task.dueDate ? new Date(task.dueDate) : null;
                  const isOverdue =
                    task.status !== 'COMPLETED' && due && due < today;
                  const projectName = getProjectName(task.projectId);

                  return (
                    <div
                      key={task.id}
                      className="border border-[#E7DFD7] rounded-xl p-3.5 hover:border-[#567C8D] transition-all bg-[#FAF7F5]/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="min-w-[240px] max-w-sm">
                        <div className="flex items-center space-x-2 mb-1">
                          {projectName && (
                            <span className="text-[10px] font-bold text-[#567C8D] bg-[#EBF2F5] px-2 py-0.5 rounded">
                              {projectName}
                            </span>
                          )}
                          <Badge type="priority" value={task.priority} />
                        </div>
                        <h4
                          className={`text-sm font-bold text-[#2F4156] ${
                            task.status === 'COMPLETED'
                              ? 'line-through text-[#8A9BA8]'
                              : ''
                          }`}
                        >
                          {task.name}
                        </h4>
                      </div>

                      {/* Timeline Bar representation */}
                      <div className="flex-1 max-w-md w-full">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#8A9BA8] mb-1">
                          <span>
                            Created {created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span>
                            {due
                              ? `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                              : 'No Due Date'}
                          </span>
                        </div>

                        <div className="w-full bg-[#E7DFD7] h-3 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              task.status === 'COMPLETED'
                                ? 'bg-[#7D8C62] w-full'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-[#92400E] w-3/5'
                                : 'bg-[#567C8D] w-1/4'
                            } ${isOverdue ? '!bg-[#934E55]' : ''}`}
                          />
                        </div>
                      </div>

                      {/* Status & Action */}
                      <div className="flex items-center space-x-3 justify-end">
                        <Badge type="status" value={task.status} />
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1.5 rounded-lg border border-[#E7DFD7] hover:bg-white text-[#567C8D] hover:text-[#2F4156] transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
