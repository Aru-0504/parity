import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { ParityRealtimeEvent } from '@ismo/shared';

interface LiveSyncContextType {
  isConnected: boolean;
  lastEvent: ParityRealtimeEvent | null;
  subscribe: (callback: (event: ParityRealtimeEvent) => void) => () => void;
}

const LiveSyncContext = createContext<LiveSyncContextType>({
  isConnected: false,
  lastEvent: null,
  subscribe: () => () => {},
});

export const LiveSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<ParityRealtimeEvent | null>(null);
  const subscribersRef = useRef<Set<(event: ParityRealtimeEvent) => void>>(new Set());

  useEffect(() => {
    if (!token) {
      setIsConnected(false);
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const sseUrl = `${apiBase}/events?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as ParityRealtimeEvent;
        setLastEvent(parsed);
        subscribersRef.current.forEach((sub) => {
          try {
            sub(parsed);
          } catch (subErr) {
            console.error('Subscriber callback error', subErr);
          }
        });
      } catch {
        // Ping or non-json message
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [token]);

  const subscribe = useCallback((callback: (event: ParityRealtimeEvent) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  return (
    <LiveSyncContext.Provider value={{ isConnected, lastEvent, subscribe }}>
      {children}
    </LiveSyncContext.Provider>
  );
};

export const useLiveSync = () => useContext(LiveSyncContext);
