'use client';

import { cn } from '@/lib/utils';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  className?: string;
}

export default function ConnectionStatus({
  isConnected,
  isReconnecting,
  className,
}: ConnectionStatusProps) {
  if (isConnected && !isReconnecting) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm',
          className
        )}
      >
        <Wifi size={16} />
        <span>已连接</span>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-full text-sm',
          className
        )}
      >
        <RefreshCw size={16} className="animate-spin" />
        <span>重新连接中...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full text-sm',
        className
      )}
    >
      <WifiOff size={16} />
      <span>未连接</span>
    </div>
  );
}
