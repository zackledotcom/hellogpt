import React, { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { ChatContainer } from './ChatContainer';
import { ModelLoadingOverlay } from './ModelLoadingOverlay';
import { ErrorBoundary } from './ErrorBoundary';
import { ConversationList } from './ConversationList';
import { useConversations } from '@/hooks/useConversations';
import { ChatMessage } from '@/types';
import { Role } from '@/types/ipc';
import { MemoryPanel } from './MemoryPanel';
import { useModel } from '@/hooks/useModel';
import { useConversation } from '@/hooks/useConversation';
import { DocumentPanel } from './DocumentPanel';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);
  const { models, currentModel, loadModels, setModel } = useModel();
  const { currentConversation, loadConversations, createConversation, sendMessage } = useConversation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadModels();
        await loadConversations();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    };
    initialize();
  }, [loadModels, loadConversations]);

  const handleModelChange = async (modelName: string) => {
    try {
      await setModel(modelName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change model');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversation) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: Role.User,
      content,
      timestamp: Date.now(),
    };

    try {
      await sendMessage(userMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background/40 backdrop-blur-glass">
        <aside className="w-80 border-r border-white/10 glass">
          <div className="glass p-4 border-b border-white/10 flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">HelloGPT</h1>
            <ThemeToggle />
          </div>
          <div className="glass p-4 border-b border-white/10">
            <label className="block text-sm font-medium text-foreground mb-2">
              Model
            </label>
            <select
              value={currentModel || ''}
              onChange={(e) => handleModelChange(e.target.value)}
              className="input w-full"
            >
              <option value="">Select a model</option>
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-hidden">
            <MemoryPanel />
          </div>
          <ConversationList />
        </aside>

        <main className="flex-1 flex flex-col">
          <header className="h-14 glass border-b border-white/10 flex items-center justify-between px-4">
            <h2 className="text-lg font-semibold text-foreground">
              {currentConversation?.title || 'New Conversation'}
            </h2>
          </header>
          {children}
        </main>

        <div className="w-64 flex flex-col border-l border-gray-200">
          <DocumentPanel />
        </div>
      </div>
    </ErrorBoundary>
  );
} 