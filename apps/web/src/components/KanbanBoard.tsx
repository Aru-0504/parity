import React, { useState } from 'react';
import { TaskDto, TaskStatusType, ProjectDto } from '@ismo/shared';
import { Badge } from './Badge';
import {
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  MoveHorizontal,
  FolderKanban,
  CheckSquare,
} from 'lucide-react';

interface KanbanBoardProps {
  tasks: TaskDto[];
  projects?: ProjectDto[];
  onMoveTask: (taskId: string, newStatus: TaskStatusType) => void;
  onEditTask: (task: TaskDto) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStatus: (task: TaskDto) => void;
}

interface ColumnConfig {
  status: TaskStatusType;
  title: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  borderHover: string;
  icon: React.ReactNode;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'PENDING',
    title: 'To Do',
    description: 'Work scheduled and queued',
    badgeBg: 'bg-[#F0EBE5]',
    badgeText: 'text-[#567C8D]',
    borderHover: 'border-[#567C8D]/40',
    icon: <Circle className="w-4 h-4 text-[#567C8D]" />,
  },
  {
    status: 'IN_PROGRESS',
    title: 'In Progress',
    description: 'Actively being developed',
    badgeBg: 'bg-[#FEF3C7]',
    badgeText: 'text-[#92400E]',
    borderHover: 'border-[#92400E]/40',
    icon: <Clock className="w-4 h-4 text-[#92400E]" />,
  },
  {
    status: 'COMPLETED',
    title: 'Completed',
    description: 'Verified and delivered',
    badgeBg: 'bg-[#F0F5EA]',
    badgeText: 'text-[#7D8C62]',
    borderHover: 'border-[#7D8C62]/40',
    icon: <CheckCircle2 className="w-4 h-4 text-[#7D8C62]" />,
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  projects,
  onMoveTask,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatusType | null>(null);

  const getProjectName = (projectId: string) => {
    if (!projects) return null;
    const p = projects.find((proj) => proj.id === projectId);
    return p?.name;
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatusType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatusType) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetStatus) {
        onMoveTask(taskId, targetStatus);
      }
    }
  };

  const isOverdue = (dueDateStr?: string | null, status?: TaskStatusType) => {
    if (!dueDateStr || status === 'COMPLETED') return false;
    return new Date(dueDateStr) < new Date();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);
        const isTarget = dragOverColumn === col.status;

        return (
          <div
            key={col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`flex flex-col rounded-2xl border transition-all duration-200 min-h-[500px] p-4 ${
              isTarget
                ? `bg-[#EBF2F5]/80 border-dashed ${col.borderHover} ring-2 ring-[#567C8D]/20 scale-[1.01]`
                : 'bg-white/70 backdrop-blur-sm border-[#E7DFD7]'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E7DFD7]">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-[#F5EFEB]">{col.icon}</div>
                <div>
                  <h3 className="font-bold text-sm text-[#2F4156]">{col.title}</h3>
                  <p className="text-[11px] text-[#8A9BA8]">{col.description}</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${col.badgeBg} ${col.badgeText}`}
              >
                {columnTasks.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-3 flex-1">
              {columnTasks.length === 0 ? (
                <div className="h-44 border-2 border-dashed border-[#E7DFD7] rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-xs text-[#8A9BA8] font-medium">No tasks in this column</p>
                  <p className="text-[10px] text-[#8A9BA8] mt-1">
                    Drag a card here or change a task status
                  </p>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const projectName = getProjectName(task.projectId);
                  const isBeingDragged = draggedTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={`group bg-white rounded-xl p-4 border border-[#E7DFD7] shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                        isBeingDragged ? 'opacity-40 scale-95 border-[#567C8D]' : 'hover:border-[#567C8D]/60'
                      }`}
                    >
                      {/* Top Meta: Project & Priority */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {projectName ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#567C8D] bg-[#F5EFEB] px-2 py-0.5 rounded-md truncate max-w-[150px]">
                            <FolderKanban className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{projectName}</span>
                          </span>
                        ) : (
                          <span />
                        )}
                        <Badge type="priority" value={task.priority} />
                      </div>

                      {/* Title & Description */}
                      <h4
                        className={`text-sm font-bold text-[#2F4156] mb-1.5 ${
                          task.status === 'COMPLETED' ? 'line-through text-[#8A9BA8]' : ''
                        }`}
                      >
                        {task.name}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-[#567C8D] line-clamp-2 mb-3 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Footer: Due date + Actions */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-[#F0EBE5] text-[11px]">
                        {task.dueDate ? (
                          <div
                            className={`flex items-center space-x-1 font-medium ${
                              overdue ? 'text-[#934E55] font-bold' : 'text-[#8A9BA8]'
                            }`}
                          >
                            {overdue ? (
                              <AlertCircle className="w-3.5 h-3.5 text-[#934E55]" />
                            ) : (
                              <Calendar className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {new Date(task.dueDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {overdue && (
                              <span className="bg-[#F9ECEE] text-[#934E55] text-[10px] px-1.5 py-0.2 rounded font-bold">
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#8A9BA8] text-[10px]">No due date</span>
                        )}

                        {/* Quick Action Icons */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onEditTask(task)}
                            title="Edit task"
                            className="p-1 rounded text-[#8A9BA8] hover:text-[#2F4156] hover:bg-[#F5EFEB] transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            title="Delete task"
                            className="p-1 rounded text-[#8A9BA8] hover:text-[#934E55] hover:bg-[#F9ECEE] transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Quick Move Bar */}
                      <div className="mt-2.5 pt-2 border-t border-dashed border-[#F0EBE5] flex items-center justify-between">
                        {col.status !== 'PENDING' ? (
                          <button
                            onClick={() =>
                              onMoveTask(
                                task.id,
                                col.status === 'COMPLETED' ? 'IN_PROGRESS' : 'PENDING'
                              )
                            }
                            className="inline-flex items-center space-x-1 text-[10px] font-semibold text-[#567C8D] hover:text-[#2F4156] transition"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>{col.status === 'COMPLETED' ? 'To In Progress' : 'To Pending'}</span>
                          </button>
                        ) : (
                          <div />
                        )}

                        {col.status !== 'COMPLETED' && (
                          <button
                            onClick={() =>
                              onMoveTask(
                                task.id,
                                col.status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED'
                              )
                            }
                            className="inline-flex items-center space-x-1 text-[10px] font-semibold text-[#2F4156] hover:text-[#1E2C3A] bg-[#F5EFEB] hover:bg-[#EBF2F5] px-2 py-1 rounded-md transition"
                          >
                            <span>{col.status === 'PENDING' ? 'Start Progress' : 'Complete'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
