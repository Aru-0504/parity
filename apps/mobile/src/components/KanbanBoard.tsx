import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
} from 'react-native';
import { TaskDto, TaskStatusType, ProjectDto } from '@ismo/shared';
import { theme } from '../theme/colors';
import {
  Circle,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FolderKanban,
  Edit2,
  Trash2,
} from 'lucide-react-native';

interface MobileKanbanProps {
  tasks: TaskDto[];
  projects?: ProjectDto[];
  onMoveTask: (taskId: string, newStatus: TaskStatusType) => void;
  onEditTask?: (task: TaskDto) => void;
  onDeleteTask?: (taskId: string) => void;
}

interface ColumnConfig {
  status: TaskStatusType;
  title: string;
  badgeBg: string;
  badgeText: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'PENDING',
    title: 'To Do',
    badgeBg: '#F0EBE5',
    badgeText: theme.teal,
  },
  {
    status: 'IN_PROGRESS',
    title: 'In Progress',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
  },
  {
    status: 'COMPLETED',
    title: 'Completed',
    badgeBg: '#F0F5EA',
    badgeText: '#4E6738',
  },
];

export const MobileKanbanBoard: React.FC<MobileKanbanProps> = ({
  tasks,
  projects,
  onMoveTask,
  onEditTask,
  onDeleteTask,
}) => {
  const [activeColumn, setActiveColumn] = useState<TaskStatusType>('PENDING');

  const columnTasks = tasks.filter((t) => t.status === activeColumn);

  const getProjectName = (projectId: string) => {
    if (!projects) return null;
    return projects.find((p) => p.id === projectId)?.name;
  };

  const isOverdue = (dueDateStr?: string | null, status?: TaskStatusType) => {
    if (!dueDateStr || status === 'COMPLETED') return false;
    return new Date(dueDateStr) < new Date();
  };

  const getNextStatus = (current: TaskStatusType): TaskStatusType | null => {
    if (current === 'PENDING') return 'IN_PROGRESS';
    if (current === 'IN_PROGRESS') return 'COMPLETED';
    return null;
  };

  const getPrevStatus = (current: TaskStatusType): TaskStatusType | null => {
    if (current === 'COMPLETED') return 'IN_PROGRESS';
    if (current === 'IN_PROGRESS') return 'PENDING';
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Column Switcher Tabs */}
      <View style={styles.tabContainer}>
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => t.status === col.status).length;
          const isActive = activeColumn === col.status;

          return (
            <TouchableOpacity
              key={col.status}
              onPress={() => setActiveColumn(col.status)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {col.title}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  { backgroundColor: isActive ? theme.navy : col.badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    { color: isActive ? '#FFFFFF' : col.badgeText },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Task List in Active Column */}
      {columnTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={32} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No tasks in this column</Text>
          <Text style={styles.emptySubtitle}>
            Tasks will appear here when moved or created with this status.
          </Text>
        </View>
      ) : (
        <FlatList
          data={columnTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const overdue = isOverdue(item.dueDate, item.status);
            const projectName = getProjectName(item.projectId);
            const next = getNextStatus(item.status);
            const prev = getPrevStatus(item.status);

            return (
              <View style={styles.card}>
                {/* Meta Header */}
                <View style={styles.cardHeader}>
                  {projectName ? (
                    <View style={styles.projectPill}>
                      <FolderKanban size={11} color={theme.teal} />
                      <Text style={styles.projectText} numberOfLines={1}>
                        {projectName}
                      </Text>
                    </View>
                  ) : (
                    <View />
                  )}

                  {/* Priority Badge */}
                  <View
                    style={[
                      styles.priorityPill,
                      item.priority === 'HIGH' && styles.priorityHigh,
                      item.priority === 'MEDIUM' && styles.priorityMed,
                      item.priority === 'LOW' && styles.priorityLow,
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        item.priority === 'HIGH' && styles.textHigh,
                        item.priority === 'MEDIUM' && styles.textMed,
                        item.priority === 'LOW' && styles.textLow,
                      ]}
                    >
                      {item.priority}
                    </Text>
                  </View>
                </View>

                {/* Title & Desc */}
                <Text
                  style={[
                    styles.cardTitle,
                    item.status === 'COMPLETED' && styles.completedText,
                  ]}
                >
                  {item.name}
                </Text>

                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                {/* Due Date & Action Icons */}
                <View style={styles.cardFooter}>
                  {item.dueDate ? (
                    <View style={styles.dateContainer}>
                      {overdue ? (
                        <AlertTriangle size={12} color={theme.rosewood} />
                      ) : (
                        <Calendar size={12} color={theme.textMuted} />
                      )}
                      <Text
                        style={[
                          styles.dateText,
                          overdue && styles.overdueText,
                        ]}
                      >
                        {new Date(item.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      {overdue && (
                        <View style={styles.overdueBadge}>
                          <Text style={styles.overdueBadgeText}>Overdue</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.noDateText}>No due date</Text>
                  )}

                  <View style={styles.iconActions}>
                    {onEditTask && (
                      <TouchableOpacity
                        onPress={() => onEditTask(item)}
                        style={styles.iconBtn}
                      >
                        <Edit2 size={13} color={theme.teal} />
                      </TouchableOpacity>
                    )}
                    {onDeleteTask && (
                      <TouchableOpacity
                        onPress={() => onDeleteTask(item.id)}
                        style={styles.iconBtn}
                      >
                        <Trash2 size={13} color={theme.rosewood} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Move Action Bar */}
                <View style={styles.moveBar}>
                  {prev ? (
                    <TouchableOpacity
                      onPress={() => onMoveTask(item.id, prev)}
                      style={styles.moveBtnSecondary}
                    >
                      <ArrowLeft size={11} color={theme.teal} />
                      <Text style={styles.moveBtnSecondaryText}>
                        {prev === 'PENDING' ? 'To Do' : 'In Progress'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}

                  {next ? (
                    <TouchableOpacity
                      onPress={() => onMoveTask(item.id, next)}
                      style={styles.moveBtnPrimary}
                    >
                      <Text style={styles.moveBtnPrimaryText}>
                        {next === 'IN_PROGRESS' ? 'Start Progress' : 'Mark Complete'}
                      </Text>
                      <ArrowRight size={11} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E7DFD7',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.teal,
    marginRight: 5,
  },
  tabTextActive: {
    color: theme.navy,
  },
  tabBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.navy,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 11,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#2F4156',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.canvas,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 160,
  },
  projectText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.teal,
    marginLeft: 4,
  },
  priorityPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityHigh: {
    backgroundColor: theme.rosewoodBg,
  },
  priorityMed: {
    backgroundColor: theme.skyLight,
  },
  priorityLow: {
    backgroundColor: theme.canvas,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textHigh: {
    color: theme.rosewood,
  },
  textMed: {
    color: theme.teal,
  },
  textLow: {
    color: theme.textSecondary,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.navy,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: theme.textMuted,
  },
  cardDesc: {
    fontSize: 11,
    color: theme.teal,
    lineHeight: 16,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: theme.textMuted,
    marginLeft: 4,
    fontWeight: '500',
  },
  overdueText: {
    color: theme.rosewood,
    fontWeight: '700',
  },
  overdueBadge: {
    backgroundColor: theme.rosewoodBg,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 5,
  },
  overdueBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.rosewood,
  },
  noDateText: {
    fontSize: 10,
    color: theme.textMuted,
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 4,
    marginLeft: 4,
  },
  moveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
    borderStyle: 'dashed',
  },
  moveBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.canvas,
  },
  moveBtnSecondaryText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.teal,
    marginLeft: 4,
  },
  moveBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.navy,
  },
  moveBtnPrimaryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 4,
  },
});
