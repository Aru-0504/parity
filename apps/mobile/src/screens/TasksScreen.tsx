import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { mobileApiClient } from '../api/client';
import {
  Search,
  CheckCircle,
  Circle,
  Calendar,
  Trash2,
  X,
  CheckSquare,
  LayoutGrid,
  List as ListIcon,
  CalendarDays,
} from 'lucide-react-native';
import { TaskDto, TaskStatusType, ProjectDto } from '@ismo/shared';
import { theme } from '../theme/colors';
import { MobileKanbanBoard } from '../components/KanbanBoard';
import { MobileTimelineCalendarView } from '../components/TimelineCalendarView';
import {
  getCachedTasks,
  setCachedTasks,
  enqueueMutation,
} from '../services/offlineQueue';

const STATUS_FILTERS = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

const PRIORITY_FILTERS = [
  { label: 'All Priority', value: '' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
];

export const TasksScreen = () => {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'timeline'>('list');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const [res, projRes] = await Promise.allSettled([
        mobileApiClient.get('/tasks', { params }),
        mobileApiClient.get('/projects'),
      ]);

      if (res.status === 'fulfilled' && res.value.data.success) {
        setTasks(res.value.data.data);
        await setCachedTasks(res.value.data.data);
      } else {
        // Fallback to offline cache
        const cached = await getCachedTasks();
        if (cached && cached.length > 0) {
          setTasks(cached);
        }
      }

      if (projRes.status === 'fulfilled' && projRes.value.data.success) {
        setProjects(projRes.value.data.data);
      }
    } catch (err) {
      console.warn('Network fetch error, loading from offline cache', err);
      const cached = await getCachedTasks();
      if (cached) setTasks(cached);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleToggleTask = async (task: TaskDto) => {
    const newStatus: TaskStatusType =
      task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await handleMoveTask(task.id, newStatus);
  };

  const handleMoveTask = async (taskId: string, newStatus: TaskStatusType) => {
    // Optimistic UI update
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    setTasks(updated);
    await setCachedTasks(updated);

    try {
      await mobileApiClient.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      console.warn('Network request failed, queueing offline mutation');
      await enqueueMutation({
        type: 'UPDATE_TASK',
        endpoint: `/tasks/${taskId}`,
        method: 'PUT',
        payload: { status: newStatus },
        taskName: tasks.find((t) => t.id === taskId)?.name,
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // Optimistic UI update
          const updated = tasks.filter((t) => t.id !== taskId);
          setTasks(updated);
          await setCachedTasks(updated);

          try {
            await mobileApiClient.delete(`/tasks/${taskId}`);
          } catch (e: any) {
            console.warn('Network delete failed, queueing offline mutation');
            await enqueueMutation({
              type: 'DELETE_TASK',
              endpoint: `/tasks/${taskId}`,
              method: 'DELETE',
            });
          }
        },
      },
    ]);
  };

  const getPriorityBadge = (pr: string) => {
    let color = theme.teal;
    let bg = theme.skyLight;
    let border = theme.border;
    if (pr === 'HIGH') {
      color = theme.rosewood;
      bg = theme.rosewoodBg;
      border = theme.rosewoodBorder;
    } else if (pr === 'MEDIUM') {
      color = theme.navy;
      bg = theme.sky;
      border = theme.sky;
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg, borderColor: border, borderWidth: 1 }]}>
        <Text style={[styles.badgeText, { color }]}>{pr}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header & View Mode Switcher */}
      <View style={styles.headerBar}>
        <View style={styles.viewSwitcher}>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={[styles.switchBtn, viewMode === 'list' && styles.switchBtnActive]}
          >
            <ListIcon size={14} color={viewMode === 'list' ? theme.navy : theme.teal} />
            <Text style={[styles.switchText, viewMode === 'list' && styles.switchTextActive]}>
              List
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('kanban')}
            style={[styles.switchBtn, viewMode === 'kanban' && styles.switchBtnActive]}
          >
            <LayoutGrid size={14} color={viewMode === 'kanban' ? theme.navy : theme.teal} />
            <Text style={[styles.switchText, viewMode === 'kanban' && styles.switchTextActive]}>
              Board
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('timeline')}
            style={[styles.switchBtn, viewMode === 'timeline' && styles.switchBtnActive]}
          >
            <CalendarDays size={14} color={viewMode === 'timeline' ? theme.navy : theme.teal} />
            <Text style={[styles.switchText, viewMode === 'timeline' && styles.switchTextActive]}>
              Timeline
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input (visible in List and Kanban mode) */}
      {viewMode !== 'timeline' && (
        <View style={styles.searchContainer}>
          <Search size={16} color={theme.teal} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks by name..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={theme.teal} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Horizontal Scroll (in List view) */}
      {viewMode === 'list' && (
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
            {STATUS_FILTERS.map((s) => {
              const active = statusFilter === s.value;
              return (
                <TouchableOpacity
                  key={s.label}
                  onPress={() => setStatusFilter(s.value)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PRIORITY_FILTERS.map((p) => {
              const active = priorityFilter === p.value;
              return (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => setPriorityFilter(p.value)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Content View Switcher */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.navy} />
        </View>
      ) : viewMode === 'kanban' ? (
        <MobileKanbanBoard
          tasks={tasks}
          projects={projects}
          onMoveTask={handleMoveTask}
          onDeleteTask={handleDeleteTask}
        />
      ) : viewMode === 'timeline' ? (
        <MobileTimelineCalendarView
          tasks={tasks}
          projects={projects}
          onToggleStatus={handleToggleTask}
        />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckSquare size={48} color={theme.sky} />
              <Text style={styles.emptyTitle}>No Tasks Found</Text>
              <Text style={styles.emptySubtitle}>
                {search || statusFilter || priorityFilter
                  ? 'Try relaxing filter criteria'
                  : 'Tasks added in projects will appear here'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCompleted = item.status === 'COMPLETED';
            return (
              <View style={styles.taskCard}>
                <TouchableOpacity
                  onPress={() => handleToggleTask(item)}
                  style={styles.checkButton}
                >
                  {isCompleted ? (
                    <CheckCircle size={22} color="#4E6738" />
                  ) : (
                    <Circle size={22} color={theme.teal} />
                  )}
                </TouchableOpacity>

                <View style={styles.taskDetails}>
                  <Text
                    style={[
                      styles.taskName,
                      isCompleted && styles.taskNameCompleted,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text style={styles.taskDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={styles.taskMeta}>
                    {getPriorityBadge(item.priority)}
                    {item.dueDate ? (
                      <View style={styles.dateMeta}>
                        <Calendar size={12} color={theme.textMuted} />
                        <Text style={styles.dateText}>
                          {new Date(item.dueDate).toLocaleDateString()}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteTask(item.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={16} color={theme.rosewood} />
                </TouchableOpacity>
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
    backgroundColor: theme.canvas,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E7DFD7',
    borderRadius: 12,
    padding: 3,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9,
    gap: 5,
  },
  switchBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.teal,
  },
  switchTextActive: {
    color: theme.navy,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.navy,
    paddingVertical: 0,
  },
  filterSection: {
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: theme.navy,
    borderColor: theme.navy,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.teal,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.navy,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  checkButton: {
    paddingRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.navy,
    marginBottom: 2,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: theme.textMuted,
  },
  taskDesc: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 6,
    lineHeight: 15,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: theme.textMuted,
  },
  deleteButton: {
    padding: 6,
  },
});
