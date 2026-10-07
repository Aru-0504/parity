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
} from 'lucide-react-native';
import { TaskDto } from '@ismo/shared';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await mobileApiClient.get('/tasks', { params });
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
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
    try {
      const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await mobileApiClient.put(`/tasks/${task.id}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileApiClient.delete(`/tasks/${taskId}`);
            fetchTasks();
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Could not delete task');
          }
        },
      },
    ]);
  };

  const getPriorityBadge = (pr: string) => {
    let color = '#94a3b8';
    let bg = 'rgba(148, 163, 184, 0.15)';
    if (pr === 'HIGH') {
      color = '#f87171';
      bg = 'rgba(239, 68, 68, 0.15)';
    } else if (pr === 'MEDIUM') {
      color = '#818cf8';
      bg = 'rgba(129, 140, 248, 0.15)';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color }]}>{pr}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks by name..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Horizontal Scroll */}
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

      {/* Tasks List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckSquare size={48} color="#334155" />
              <Text style={styles.emptyTitle}>No Tasks Found</Text>
              <Text style={styles.emptySubtitle}>
                {search || statusFilter || priorityFilter
                  ? 'Try relaxing filter criteria'
                  : 'Tasks added in projects will appear here'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isDone = item.status === 'COMPLETED';
            return (
              <View style={[styles.taskCard, isDone && styles.taskCardDone]}>
                <TouchableOpacity
                  onPress={() => handleToggleTask(item)}
                  style={styles.checkBtn}
                >
                  {isDone ? (
                    <CheckCircle size={22} color="#34d399" />
                  ) : (
                    <Circle size={22} color="#64748b" />
                  )}
                </TouchableOpacity>

                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                    {item.name}
                  </Text>
                  {item.project ? (
                    <Text style={styles.projectTag}>{item.project.name}</Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    {getPriorityBadge(item.priority)}
                    {item.dueDate ? (
                      <View style={styles.dateMeta}>
                        <Calendar size={12} color="#64748b" />
                        <Text style={styles.dateText}>
                          {new Date(item.dueDate).toLocaleDateString()}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteTask(item.id)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color="#ef4444" />
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
    backgroundColor: '#090d16',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#111827',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterPillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  taskCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskCardDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  checkBtn: {
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  taskTitleDone: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  projectTag: {
    fontSize: 11,
    color: '#818cf8',
    marginTop: 2,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 10,
    color: '#64748b',
    marginLeft: 4,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
});
