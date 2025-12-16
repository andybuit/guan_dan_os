import { WebSocketProvider } from '@/lib/websocket/WebSocketProvider';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '掼蛋大厅 - Guandan Game Platform',
  description: 'Online multiplayer Guandan card game platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <WebSocketProvider>{children}</WebSocketProvider>
      </body>
    </html>
  );
}
