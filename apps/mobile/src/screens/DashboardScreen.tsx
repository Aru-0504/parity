import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { mobileApiClient } from '../api/client';
import { useMobileAuth } from '../context/AuthContext';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  CheckCircle,
  Target,
  LogOut,
} from 'lucide-react-native';
import { DashboardStats } from '@ismo/shared';
import { theme } from '../theme/colors';

export const DashboardScreen = () => {
  const { user, logout } = useMobileAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [focusTasks, setFocusTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await mobileApiClient.get('/dashboard');
      if (res.data.success) {
        setStats(res.data.data.stats);
        setFocusTasks(res.data.data.focusTasks || []);
      }
    } catch (err) {
      console.error('Error fetching mobile dashboard', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleToggleComplete = async (taskId: string) => {
    try {
      await mobileApiClient.put(`/tasks/${taskId}`, { status: 'COMPLETED' });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to complete task', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const completionRate =
    stats && stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.navy} />
      }
    >
      {/* User Greeting & Logout */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <LogOut size={16} color={theme.rosewood} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Overview Statistics</Text>

      {/* Grid of 5 explicit metric cards */}
      <View style={styles.statsGrid}>
        {/* Total Projects */}
        <View style={styles.statCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.statLabel}>PROJECTS</Text>
            <FolderKanban size={16} color={theme.navy} />
          </View>
          <Text style={styles.statValue}>{stats?.totalProjects ?? 0}</Text>
          <Text style={styles.statSub}>Total Managed</Text>
        </View>

        {/* Total Tasks */}
        <View style={styles.statCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.statLabel}>TASKS</Text>
            <Layers size={16} color={theme.teal} />
          </View>
          <Text style={styles.statValue}>{stats?.totalTasks ?? 0}</Text>
          <Text style={styles.statSub}>Total Assigned</Text>
        </View>

        {/* Completed Tasks */}
        <View style={styles.statCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.statLabel}>COMPLETED</Text>
            <CheckCircle2 size={16} color={theme.sage} />
          </View>
          <Text style={[styles.statValue, { color: theme.sage }]}>
            {stats?.completedTasks ?? 0}
          </Text>
          <Text style={styles.statSub}>{completionRate}% Complete</Text>
        </View>

        {/* Pending Tasks */}
        <View style={styles.statCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.statLabel}>PENDING</Text>
            <Clock size={16} color={theme.amber} />
          </View>
          <Text style={[styles.statValue, { color: theme.amber }]}>
            {stats?.pendingTasks ?? 0}
          </Text>
          <Text style={styles.statSub}>Action Required</Text>
        </View>

        {/* Projects In Progress */}
        <View style={[styles.statCard, { width: '100%' }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.statLabel}>PROJECTS IN PROGRESS</Text>
            <Activity size={16} color={theme.rosewood} />
          </View>
          <Text style={[styles.statValue, { color: theme.rosewood }]}>
            {stats?.inProgressProjects ?? 0}
          </Text>
          <Text style={styles.statSub}>Currently Active Initiatives</Text>
        </View>
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Overall Task Progress</Text>
          <Text style={styles.progressPercent}>{completionRate}%</Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownText}>
            High Priority: {stats?.tasksByPriority?.high ?? 0}
          </Text>
          <Text style={styles.breakdownText}>
            Medium: {stats?.tasksByPriority?.medium ?? 0}
          </Text>
          <Text style={styles.breakdownText}>
            Low: {stats?.tasksByPriority?.low ?? 0}
          </Text>
        </View>
      </View>

      {/* Focus Queue: What to do next */}
      <View style={styles.focusContainer}>
        <View style={styles.focusHeader}>
          <Target size={16} color="#f59e0b" />
          <Text style={styles.focusTitle}>Focus Queue (What to do next)</Text>
        </View>

        {focusTasks.length === 0 ? (
          <Text style={styles.focusEmpty}>All caught up! No pending tasks requiring attention.</Text>
        ) : (
          focusTasks.map((task) => (
            <View key={task.id} style={styles.focusItem}>
              <TouchableOpacity
                onPress={() => handleToggleComplete(task.id)}
                style={styles.focusCheck}
              >
                <CheckCircle size={20} color="#64748b" />
              </TouchableOpacity>
              <View style={styles.focusInfo}>
                <Text style={styles.focusTaskName} numberOfLines={1}>
                  {task.name}
                </Text>
                <Text style={styles.focusProjectName} numberOfLines={1}>
                  {task.projectName} &bull; {task.priority} Priority
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Text style={styles.pullHint}>Pull down to refresh metrics anytime</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.canvas,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  greeting: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.rosewoodBg,
    borderWidth: 1,
    borderColor: theme.rosewoodBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  logoutText: {
    color: theme.rosewood,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 14,
    width: '48%',
    shadowColor: theme.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.textPrimary,
  },
  statSub: {
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    shadowColor: theme.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.sage,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.navy,
    borderRadius: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  breakdownText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  focusContainer: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    shadowColor: theme.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  focusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  focusEmpty: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
    gap: 12,
  },
  focusCheck: {
    padding: 4,
  },
  focusInfo: {
    flex: 1,
  },
  focusTaskName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  focusProjectName: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  pullHint: {
    textAlign: 'center',
    color: theme.textMuted,
    fontSize: 11,
    marginTop: 20,
    fontWeight: '500',
  },
});
