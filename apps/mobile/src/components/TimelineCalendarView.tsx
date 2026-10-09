import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { TaskDto, ProjectDto } from '@ismo/shared';
import { theme } from '../theme/colors';
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  FolderKanban,
} from 'lucide-react-native';

interface MobileTimelineCalendarProps {
  tasks: TaskDto[];
  projects?: ProjectDto[];
  onToggleStatus: (task: TaskDto) => void;
  onEditTask?: (task: TaskDto) => void;
}

export const MobileTimelineCalendarView: React.FC<MobileTimelineCalendarProps> = ({
  tasks,
  projects,
  onToggleStatus,
  onEditTask,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'overdue' | 'week'>('week');
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate next 14 days strip
  const daysStrip = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 2); // show 2 days past + 12 days ahead
    const dateStr = d.toISOString().split('T')[0];
    const hasTasks = tasks.some(
      (t) => t.dueDate && t.dueDate.split('T')[0] === dateStr && t.status !== 'COMPLETED'
    );
    const isToday = i === 2;
    return {
      date: d,
      dateStr,
      dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNumber: d.getDate(),
      hasTasks,
      isToday,
    };
  });

  const getProjectName = (projectId: string) => {
    if (!projects) return null;
    return projects.find((p) => p.id === projectId)?.name;
  };

  const isOverdue = (dueDateStr?: string | null, status?: string) => {
    if (!dueDateStr || status === 'COMPLETED') return false;
    return new Date(dueDateStr) < today;
  };

  // Filter tasks based on selected mode or specific selected date
  const filteredTasks = tasks.filter((t) => {
    if (!t.dueDate) {
      return filterMode === 'all';
    }
    const due = new Date(t.dueDate);
    const dueDateStr = t.dueDate.split('T')[0];

    if (selectedDateStr) {
      return dueDateStr === selectedDateStr;
    }

    if (filterMode === 'overdue') {
      return t.status !== 'COMPLETED' && due < today;
    }

    if (filterMode === 'week') {
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= -1 && diffDays <= 7;
    }

    return true;
  });

  const overdueCount = tasks.filter(
    (t) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < today
  ).length;

  const dueWeekCount = tasks.filter((t) => {
    if (t.status === 'COMPLETED' || !t.dueDate) return false;
    const diffDays = Math.ceil((new Date(t.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  return (
    <View style={styles.container}>
      {/* Metric Highlights */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          onPress={() => {
            setSelectedDateStr(null);
            setFilterMode('overdue');
          }}
          style={[styles.statBox, styles.statBoxOverdue, filterMode === 'overdue' && !selectedDateStr && styles.statActive]}
        >
          <AlertTriangle size={14} color={theme.rosewood} />
          <Text style={[styles.statVal, { color: theme.rosewood }]}>{overdueCount}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSelectedDateStr(null);
            setFilterMode('week');
          }}
          style={[styles.statBox, styles.statBoxWeek, filterMode === 'week' && !selectedDateStr && styles.statActive]}
        >
          <Clock size={14} color="#92400E" />
          <Text style={[styles.statVal, { color: '#92400E' }]}>{dueWeekCount}</Text>
          <Text style={styles.statLabel}>Next 7 Days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSelectedDateStr(null);
            setFilterMode('all');
          }}
          style={[styles.statBox, styles.statBoxAll, filterMode === 'all' && !selectedDateStr && styles.statActive]}
        >
          <CalendarIcon size={14} color={theme.navy} />
          <Text style={[styles.statVal, { color: theme.navy }]}>{tasks.length}</Text>
          <Text style={styles.statLabel}>All Tasks</Text>
        </TouchableOpacity>
      </View>

      {/* 14-Day Date Strip Picker */}
      <View style={styles.stripWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
          {daysStrip.map((item) => {
            const isSelected = selectedDateStr === item.dateStr;
            return (
              <TouchableOpacity
                key={item.dateStr}
                onPress={() => {
                  if (isSelected) {
                    setSelectedDateStr(null);
                  } else {
                    setSelectedDateStr(item.dateStr);
                  }
                }}
                style={[
                  styles.dayCard,
                  item.isToday && styles.dayCardToday,
                  isSelected && styles.dayCardSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayName,
                    item.isToday && styles.dayNameToday,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {item.dayName}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    item.isToday && styles.dayNumberToday,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {item.dayNumber}
                </Text>
                {item.hasTasks && (
                  <View
                    style={[
                      styles.taskDot,
                      isSelected ? styles.taskDotSelected : styles.taskDotActive,
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Selected Date Filter Indicator */}
      {selectedDateStr && (
        <View style={styles.filterChip}>
          <Text style={styles.filterChipText}>
            Showing tasks for {selectedDateStr}
          </Text>
          <TouchableOpacity onPress={() => setSelectedDateStr(null)}>
            <Text style={styles.filterChipClear}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CalendarIcon size={32} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No scheduled tasks</Text>
          <Text style={styles.emptySubtitle}>
            {selectedDateStr
              ? 'No tasks due on this date.'
              : 'No tasks matching the selected schedule filter.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const overdue = isOverdue(item.dueDate, item.status);
            const isCompleted = item.status === 'COMPLETED';
            const projectName = getProjectName(item.projectId);

            return (
              <TouchableOpacity
                onPress={() => onEditTask?.(item)}
                activeOpacity={0.7}
                style={[
                  styles.card,
                  isCompleted && styles.cardCompleted,
                  overdue && styles.cardOverdue,
                ]}
              >
                <View style={styles.cardRow}>
                  {/* Toggle Circle */}
                  <TouchableOpacity
                    onPress={() => onToggleStatus(item)}
                    style={styles.checkBtn}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={20} color="#4E6738" />
                    ) : (
                      <Circle size={20} color={theme.teal} />
                    )}
                  </TouchableOpacity>

                  <View style={styles.cardContent}>
                    <View style={styles.metaRow}>
                      {projectName ? (
                        <View style={styles.projectPill}>
                          <FolderKanban size={10} color={theme.teal} />
                          <Text style={styles.projectText} numberOfLines={1}>
                            {projectName}
                          </Text>
                        </View>
                      ) : null}

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

                    <Text
                      style={[
                        styles.taskName,
                        isCompleted && styles.taskNameCompleted,
                      ]}
                    >
                      {item.name}
                    </Text>

                    {item.dueDate ? (
                      <View style={styles.dateRow}>
                        <Clock
                          size={11}
                          color={overdue ? theme.rosewood : theme.textMuted}
                        />
                        <Text
                          style={[
                            styles.dateText,
                            overdue && styles.dateTextOverdue,
                          ]}
                        >
                          Due{' '}
                          {new Date(item.dueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                        {overdue && (
                          <Text style={styles.overdueBadge}>OVERDUE</Text>
                        )}
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: theme.border,
  },
  statBoxOverdue: {
    backgroundColor: theme.rosewoodBg,
    borderColor: theme.rosewoodBorder,
  },
  statBoxWeek: {
    backgroundColor: theme.amberBg,
    borderColor: theme.amberBorder,
  },
  statBoxAll: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.border,
  },
  statActive: {
    borderWidth: 2,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    color: theme.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  stripWrapper: {
    marginBottom: 12,
  },
  stripContent: {
    paddingVertical: 2,
    gap: 6,
  },
  dayCard: {
    width: 44,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.border,
  },
  dayCardToday: {
    borderColor: theme.navy,
    backgroundColor: theme.skyLight,
  },
  dayCardSelected: {
    backgroundColor: theme.navy,
    borderColor: theme.navy,
  },
  dayName: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 2,
  },
  dayNameToday: {
    color: theme.navy,
    fontWeight: '700',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.navy,
  },
  dayNumberToday: {
    color: theme.navy,
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
  },
  taskDotActive: {
    backgroundColor: theme.amber,
  },
  taskDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.skyLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.navy,
  },
  filterChipClear: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.rosewood,
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
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardCompleted: {
    backgroundColor: theme.sageBg,
    borderColor: theme.sageBorder,
  },
  cardOverdue: {
    borderColor: theme.rosewoodBorder,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBtn: {
    paddingRight: 10,
  },
  cardContent: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.canvas,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  projectText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.teal,
    marginLeft: 3,
  },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
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
    fontSize: 9,
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
  taskName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.navy,
    marginBottom: 4,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: theme.textMuted,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 10,
    color: theme.textMuted,
    marginLeft: 4,
  },
  dateTextOverdue: {
    color: theme.rosewood,
    fontWeight: '700',
  },
  overdueBadge: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.rosewood,
    backgroundColor: theme.rosewoodBg,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 6,
  },
});
