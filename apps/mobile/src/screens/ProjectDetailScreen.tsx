import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { mobileApiClient } from '../api/client';
import {
  Plus,
  CheckCircle,
  Circle,
  Calendar,
  Trash2,
  X,
  Clock,
  ArrowLeft,
} from 'lucide-react-native';
import { TaskDto } from '@ismo/shared';

export const ProjectDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [status, setStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('PENDING');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjectDetails = useCallback(async () => {
    try {
      const res = await mobileApiClient.get(`/projects/${id}`);
      if (res.data.success) {
        setProject(res.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        Alert.alert('Not Found', 'Project not found or belongs to another user.');
        navigation.goBack();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjectDetails();
  };

  const handleToggleTask = async (task: TaskDto) => {
    try {
      const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await mobileApiClient.put(`/tasks/${task.id}`, { status: newStatus });
      fetchProjectDetails();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to remove this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileApiClient.delete(`/tasks/${taskId}`);
            fetchProjectDetails();
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Could not delete task');
          }
        },
      },
    ]);
  };

  const handleCreateTask = async () => {
    if (!taskName.trim()) {
      Alert.alert('Validation Error', 'Task name is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await mobileApiClient.post('/tasks', {
        projectId: id,
        name: taskName.trim(),
        description: taskDesc.trim() || null,
        priority,
        status,
      });

      if (res.data.success) {
        setModalVisible(false);
        setTaskName('');
        setTaskDesc('');
        setPriority('MEDIUM');
        setStatus('PENDING');
        fetchProjectDetails();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const tasks = project?.tasks || [];
  const completed = tasks.filter((t: any) => t.status === 'COMPLETED').length;
  const progressPercent = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Top bar with back button */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color="#94a3b8" />
          <Text style={styles.backText}>Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addTaskBtn} onPress={() => setModalVisible(true)}>
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addTaskText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.projectTitle}>{project?.name}</Text>
            {project?.description ? (
              <Text style={styles.projectDesc}>{project.description}</Text>
            ) : null}

            <View style={styles.progressBarWrapper}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>
                  Progress ({completed}/{tasks.length})
                </Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Clock size={40} color="#334155" />
            <Text style={styles.emptyTitle}>No Tasks Yet</Text>
            <Text style={styles.emptySubtitle}>Tap 'Add Task' to plan activities</Text>
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
                {item.description ? (
                  <Text style={styles.taskDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.taskMetaRow}>
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

      {/* Create Task Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Task to Project</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>TASK TITLE *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Verify Android Keystore storage"
              placeholderTextColor="#64748b"
              value={taskName}
              onChangeText={setTaskName}
            />

            <Text style={styles.modalLabel}>DESCRIPTION</Text>
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Task instructions..."
              placeholderTextColor="#64748b"
              multiline
              value={taskDesc}
              onChangeText={setTaskDesc}
            />

            <Text style={styles.modalLabel}>PRIORITY</Text>
            <View style={styles.choiceRow}>
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((pr) => (
                <TouchableOpacity
                  key={pr}
                  onPress={() => setPriority(pr)}
                  style={[styles.choiceBtn, priority === pr && styles.choiceBtnActive]}
                >
                  <Text style={[styles.choiceText, priority === pr && styles.choiceTextActive]}>
                    {pr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>STATUS</Text>
            <View style={styles.choiceRow}>
              {(['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setStatus(st)}
                  style={[styles.choiceBtn, status === st && styles.choiceBtnActive]}
                >
                  <Text style={[styles.choiceText, status === st && styles.choiceTextActive]}>
                    {st === 'PENDING' ? 'Pending' : st === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleCreateTask}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Add Task</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#94a3b8',
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addTaskText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  projectDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 12,
  },
  progressBarWrapper: {
    marginTop: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
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
  taskDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
    paddingVertical: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#0b0f19',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 14,
  },
  choiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  choiceBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#0b0f19',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  choiceBtnActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  choiceText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  choiceTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
