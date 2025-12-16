'use client';

import { useWebSocket, WebSocketMessage } from '@/lib/hooks/useWebSocket';
import { createContext, ReactNode, useContext, useState } from 'react';

interface WebSocketContextValue {
  isConnected: boolean;
  isReconnecting: boolean;
  send: (message: WebSocketMessage) => void;
  addEventListener: (type: string, handler: (payload: unknown) => void) => void;
  removeEventListener: (
    type: string,
    handler: (payload: unknown) => void
  ) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useGameWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useGameWebSocket must be used within WebSocketProvider');
  }
  return context;
}

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

export function WebSocketProvider({ children, url }: WebSocketProviderProps) {
  const [eventHandlers] = useState<
    Map<string, Set<(payload: unknown) => void>>
  >(new Map());

  const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL;
  const wsEnabled = !!wsUrl;

  const handleMessage = (message: WebSocketMessage) => {
    const handlers = eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message.payload));
    }

    // Also trigger wildcard handlers
    const wildcardHandlers = eventHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(message));
    }
  };

  const { isConnected, isReconnecting, send } = useWebSocket({
    url: wsUrl,
    enabled: wsEnabled,
    onMessage: handleMessage,
    onConnect: () => {
      console.log('[GameWebSocket] Connected successfully');
    },
    onDisconnect: () => {
      console.log('[GameWebSocket] Disconnected');
    },
    onError: () => {
      // Silently handle errors - backend may not be running in development
    },
    autoReconnect: true,
    reconnectAttempts: 3,
    reconnectDelay: 1000,
  });

  const addEventListener = (
    type: string,
    handler: (payload: unknown) => void
  ) => {
    if (!eventHandlers.has(type)) {
      eventHandlers.set(type, new Set());
    }
    eventHandlers.get(type)!.add(handler);
  };

  const removeEventListener = (
    type: string,
    handler: (payload: unknown) => void
  ) => {
    const handlers = eventHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlers.delete(type);
      }
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        isReconnecting,
        send,
        addEventListener,
        removeEventListener,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
