import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { mobileApiClient } from '../api/client';
import {
  getPendingMutations,
  flushPendingMutations,
  QueuedMutation,
} from '../services/offlineQueue';

export const NetworkBanner: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [pendingQueue, setPendingQueue] = useState<QueuedMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const checkQueue = async () => {
    const list = await getPendingMutations();
    setPendingQueue(list);
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await flushPendingMutations(mobileApiClient);
      await checkQueue();
      if (result.processed > 0) {
        setSyncSuccessMsg(`Synced ${result.processed} offline change${result.processed > 1 ? 's' : ''}!`);
        setTimeout(() => setSyncSuccessMsg(null), 3500);
      }
    } catch (e) {
      console.warn('Sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    checkQueue();
    const interval = setInterval(checkQueue, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      const wasOffline = isConnected === false;
      setIsConnected(online);

      // If just reconnected from offline, auto-flush pending queue
      if (wasOffline && online) {
        await handleSync();
      }
    });
    return () => unsubscribe();
  }, [isConnected]);

  if (syncSuccessMsg) {
    return (
      <View style={[styles.banner, styles.successBanner]}>
        <CheckCircle2 size={16} color="#2D5A27" style={styles.icon} />
        <Text style={[styles.text, styles.successText]}>{syncSuccessMsg}</Text>
      </View>
    );
  }

  if (isConnected === false) {
    return (
      <View style={[styles.banner, styles.offlineBanner]}>
        <WifiOff size={16} color="#92400E" style={styles.icon} />
        <Text style={[styles.text, styles.offlineText]}>
          Offline Mode {pendingQueue.length > 0 ? `(${pendingQueue.length} queued)` : ''} — Changes saved locally
        </Text>
      </View>
    );
  }

  if (pendingQueue.length > 0) {
    return (
      <View style={[styles.banner, styles.pendingBanner]}>
        {isSyncing ? (
          <ActivityIndicator size="small" color="#2F4156" style={styles.icon} />
        ) : (
          <RefreshCw size={15} color="#2F4156" style={styles.icon} />
        )}
        <Text style={[styles.text, styles.pendingText]}>
          {isSyncing
            ? `Syncing ${pendingQueue.length} offline change${pendingQueue.length > 1 ? 's' : ''}...`
            : `${pendingQueue.length} offline change${pendingQueue.length > 1 ? 's' : ''} waiting to sync`}
        </Text>
        {!isSyncing && (
          <TouchableOpacity onPress={handleSync} style={styles.syncBtn}>
            <Text style={styles.syncBtnText}>Sync Now</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomColor: '#FDE68A',
  },
  pendingBanner: {
    backgroundColor: '#EBF2F5',
    borderBottomColor: '#C8D9E6',
  },
  successBanner: {
    backgroundColor: '#F0F5EA',
    borderBottomColor: '#CCD8BF',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  offlineText: {
    color: '#92400E',
  },
  pendingText: {
    color: '#2F4156',
  },
  successText: {
    color: '#2D5A27',
  },
  syncBtn: {
    marginLeft: 10,
    backgroundColor: '#2F4156',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
