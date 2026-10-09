import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { mobileApiClient } from '../api/client';
import {
  FolderKanban,
  Search,
  Plus,
  Calendar,
  Layers,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { ProjectDto } from '@ismo/shared';
import { theme } from '../theme/colors';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Not Started', value: 'NOT_STARTED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

export const ProjectsScreen = ({ navigation }: any) => {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>('NOT_STARTED');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedStatus) params.status = selectedStatus;

      const res = await mobileApiClient.get('/projects', { params });
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching mobile projects', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedStatus]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const handleCreateProject = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Project name is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await mobileApiClient.post('/projects', {
        name: name.trim(),
        description: description.trim() || null,
        status,
      });

      if (res.data.success) {
        setModalVisible(false);
        setName('');
        setDescription('');
        setStatus('NOT_STARTED');
        fetchProjects();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (st: string) => {
    let color = theme.teal;
    let bg = theme.skyLight;
    let border = theme.border;
    let label = 'Not Started';

    if (st === 'COMPLETED') {
      color = theme.sage;
      bg = theme.sageBg;
      border = theme.sageBorder;
      label = 'Completed';
    } else if (st === 'IN_PROGRESS') {
      color = theme.amber;
      bg = theme.amberBg;
      border = theme.amberBorder;
      label = 'In Progress';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg, borderColor: border, borderWidth: 1 }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  const getHealthBadge = (health?: string) => {
    if (!health) return null;
    let color = theme.sage;
    let bg = theme.sageBg;
    let border = theme.sageBorder;
    let label = 'On Track';

    if (health === 'OVERDUE') {
      color = theme.rosewood;
      bg = theme.rosewoodBg;
      border = theme.rosewoodBorder;
      label = 'Overdue';
    } else if (health === 'AT_RISK') {
      color = theme.amber;
      bg = theme.amberBg;
      border = theme.amberBorder;
      label = 'At Risk';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg, borderColor: border, borderWidth: 1, marginRight: 6 }]}>
        <Text style={[styles.badgeText, { color, fontWeight: '700' }]}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <Search size={16} color={theme.teal} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects by name..."
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

      {/* Status Filter Horizontal Pills */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STATUS_FILTERS.map((item) => {
            const active = selectedStatus === item.value;
            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => setSelectedStatus(item.value)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Projects List with Pull-to-Refresh */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.navy} />
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FolderKanban size={48} color={theme.sky} />
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptySubtitle}>
                {search || selectedStatus ? 'Try clearing filters' : 'Tap + to add a project'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ProjectDetail', { id: item.id, name: item.name })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {getHealthBadge(item.health)}
                  {getStatusBadge(item.status)}
                </View>
              </View>

              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              {/* Completion Progress Bar */}
              <View style={{ marginTop: 8, marginBottom: 8 }}>
                <View style={{ height: 5, backgroundColor: theme.borderLight, borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${item.completionPercentage ?? 0}%`, backgroundColor: theme.sage, borderRadius: 3 }} />
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                  <Layers size={14} color={theme.teal} />
                  <Text style={styles.footerText}>
                    {item._count?.tasks ?? 0} tasks
                  </Text>
                </View>

                {item.endDate && (
                  <View style={styles.footerInfo}>
                    <Calendar size={14} color={theme.textMuted} />
                    <Text style={styles.footerText}>
                      {new Date(item.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                <ChevronRight size={16} color={theme.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Action Button for Project Creation */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Create Project Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.modalContent}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Project</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={20} color={theme.teal} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>PROJECT NAME *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Android Release v1"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.modalLabel}>DESCRIPTION</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Project goals & scope..."
                placeholderTextColor={theme.textMuted}
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.modalLabel}>STATUS</Text>
              <View style={styles.statusPickerRow}>
                {(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setStatus(st)}
                    style={[styles.statusChoice, status === st && styles.statusChoiceActive]}
                  >
                    <Text style={[styles.statusChoiceText, status === st && styles.statusChoiceTextActive]}>
                      {st === 'NOT_STARTED' ? 'Not Started' : st === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleCreateProject}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Project</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterPillActive: {
    backgroundColor: theme.navy,
    borderColor: theme.navy,
  },
  filterText: {
    fontSize: 12,
    color: theme.teal,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.navy,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    color: theme.teal,
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: theme.teal,
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.navy,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.navy,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: theme.navy,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: theme.teal,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.navy,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.teal,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: theme.cardSubtle,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.navy,
    fontSize: 13,
    marginBottom: 16,
  },
  statusPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statusChoice: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: theme.cardSubtle,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  statusChoiceActive: {
    backgroundColor: theme.navy,
    borderColor: theme.navy,
  },
  statusChoiceText: {
    fontSize: 11,
    color: theme.teal,
    fontWeight: '600',
  },
  statusChoiceTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    backgroundColor: theme.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
