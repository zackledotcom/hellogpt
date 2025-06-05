import React, { useState } from 'react';
import { useConversation } from '@/hooks/useConversation';
import { ServiceStatusManager } from './ServiceStatusManager';
import OllamaTest from './OllamaTest';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isServicePanelOpen, setIsServicePanelOpen] = useState(false);
  const { currentConversation } = useConversation();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
        <ServiceStatusManager />
      </div>
      {isServicePanelOpen && (
        <div className="w-96 border-l border-gray-200 dark:border-gray-700">
          <OllamaTest />
        </div>
      )}
    </div>
  );
} 