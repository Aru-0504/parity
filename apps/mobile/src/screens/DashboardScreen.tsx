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
} from 'lucide-react-native';
import { DashboardStats } from '@ismo/shared';

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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      {/* User Greeting & Logout */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <LogOut size={16} color="#f87171" />
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
            <FolderKanban size={16} color="#818cf8" />
          </View>
          <Text style={styles.statValue}>{stats?.totalProjects ?? 0}</Text>
          <Text style={styles.statSub}>Total Managed</Text>
        </View>

        {/* Total Tasks */}
        <View style={styles.statCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.statLabel}>TASKS</Text>
            <Layers size={16} color="#60a5fa" />
          </View>
          <Text style={styles.statValue}>{stats?.totalTasks ?? 0}</Text>
          <Text style={styles.statSub}>Total Assigned</Text>
        </View>

        {/* Completed Tasks */}
        <View style={styles.statCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.statLabel}>COMPLETED</Text>
            <CheckCircle2 size={16} color="#34d399" />
          </View>
          <Text style={[styles.statValue, { color: '#34d399' }]}>
            {stats?.completedTasks ?? 0}
          </Text>
          <Text style={styles.statSub}>{completionRate}% Complete</Text>
        </View>

        {/* Pending Tasks */}
        <View style={styles.statCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.statLabel}>PENDING</Text>
            <Clock size={16} color="#fbbf24" />
          </View>
          <Text style={[styles.statValue, { color: '#fbbf24' }]}>
            {stats?.pendingTasks ?? 0}
          </Text>
          <Text style={styles.statSub}>Action Required</Text>
        </View>

        {/* Projects In Progress */}
        <View style={[styles.statCard, { width: '100%' }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.statLabel}>PROJECTS IN PROGRESS</Text>
            <Activity size={16} color="#c084fc" />
          </View>
          <Text style={[styles.statValue, { color: '#c084fc' }]}>
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
    backgroundColor: '#090d16',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
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
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    width: '48%',
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
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  statSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  breakdownText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  focusContainer: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  focusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  focusEmpty: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 12,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
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
    fontWeight: '600',
    color: '#e2e8f0',
  },
  focusProjectName: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  pullHint: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 11,
    marginTop: 20,
  },
});
