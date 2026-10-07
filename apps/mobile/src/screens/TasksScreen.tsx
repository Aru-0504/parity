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
import { theme } from '../theme/colors';

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
      {/* Search Input */}
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
          <ActivityIndicator size="large" color={theme.navy} />
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
            const isDone = item.status === 'COMPLETED';
            return (
              <View style={[styles.taskCard, isDone && styles.taskCardDone]}>
                <TouchableOpacity
                  onPress={() => handleToggleTask(item)}
                  style={styles.checkBtn}
                >
                  {isDone ? (
                    <CheckCircle size={22} color={theme.sage} />
                  ) : (
                    <Circle size={22} color={theme.teal} />
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
                  style={styles.deleteBtn}
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: theme.navy,
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
    backgroundColor: theme.card,
    marginRight: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterPillActive: {
    backgroundColor: theme.navy,
    borderColor: theme.navy,
  },
  filterText: {
    fontSize: 11,
    color: theme.teal,
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
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  taskCardDone: {
    backgroundColor: theme.cardSubtle,
    borderColor: theme.borderLight,
    opacity: 0.8,
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
    color: theme.navy,
  },
  taskTitleDone: {
    color: theme.textMuted,
    textDecorationLine: 'line-through',
  },
  projectTag: {
    fontSize: 11,
    color: theme.teal,
    marginTop: 2,
    fontWeight: '600',
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
    color: theme.textMuted,
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
    color: theme.navy,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    color: theme.teal,
    fontSize: 12,
    marginTop: 4,
  },
});
