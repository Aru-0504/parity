import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';

export const NetworkBanner: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected && state.isInternetReachable !== false);
    });
    return () => unsubscribe();
  }, []);

  if (isConnected !== false) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <WifiOff size={16} color="#92400E" style={styles.icon} />
      <Text style={styles.text}>
        No internet connection. Please check your network to sync data.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
});
