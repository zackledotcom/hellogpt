import React, { useState, useCallback } from 'react';
import { ChatMessage, Role } from '../types/ipc';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useMemory } from '../hooks/useMemory';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Card } from './ui/card';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface Correction {
  text: string;
  timestamp: number;
  history: string[];
}

interface Reaction {
  emoji: string;
  timestamp: number;
  messageId: string;
  role: Role;
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  isThinking?: boolean;
  isTyping?: boolean;
  onStopResponse?: () => void;
  onReaction?: (messageId: string, emoji: string) => void;
}

interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const REACTIONS = ['👍', '👎', '❤️', '😢', '😡', '🤔', '😮', '😂'] as const;

export function ChatMessageList({ messages, isThinking = false, isTyping = false, onStopResponse, onReaction }: ChatMessageListProps) {
  const { storeMemory } = useMemory();
  const [corrections, setCorrections] = useState<Record<string, Correction>>({});
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activePickerId, setActivePickerId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const handleCorrection = async (messageId: string, original: string) => {
    const newText = prompt("Correct the assistant's response:", original);
    if (!newText || newText.trim() === original.trim()) return;

    setCorrections((prev) => ({
      ...prev,
      [messageId]: {
        text: newText,
        timestamp: Date.now(),
        history: [...(prev[messageId]?.history || []), original],
      },
    }));

    try {
      await toast.promise(
        storeMemory(
          `Correction: ${newText}`,
          {
            type: 'correction',
            source: 'chat',
            tags: ['correction', 'learning'],
            originalText: original,
            correctedText: newText,
            messageId,
          }
        ),
        {
          loading: 'Storing correction in memory...',
          success: 'Correction stored successfully',
          error: 'Failed to store correction',
        }
      );
    } catch (error) {
      console.error('Failed to store correction:', error);
      showToast('Failed to store correction in memory', 'error');
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    const newReaction: Reaction = {
      emoji,
      timestamp: Date.now(),
      messageId,
      role: Role.Assistant,
    };
    setReactions((prev) => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), newReaction],
    }));
    onReaction?.(messageId, emoji);
    if (emoji === '👎') showToast('Feedback recorded - will avoid similar responses');
    if (emoji === '👍') showToast('Feedback recorded - will provide more responses like this', 'success');
  };

  const CodeComponent: React.FC<CodeComponentProps> = ({ inline, className, children }) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={oneDark}
        language={match[1]}
        PreTag="div"
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className}>
        {children}
      </code>
    );
  };

  const renderMessageContent = (text: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code: CodeComponent,
      }}
      className="prose prose-sm max-w-none dark:prose-invert"
    >
      {text}
    </ReactMarkdown>
  );

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <Card
            className={`max-w-[80%] p-4 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
            <div className="mt-2 text-xs opacity-70">
              {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
            </div>
          </Card>
        </div>
      ))}
      {isThinking && (
        <div className="flex justify-start">
          <Card className="max-w-[80%] p-4 bg-muted">
            <p className="text-muted-foreground">Thinking...</p>
          </Card>
        </div>
      )}
      {isTyping && (
        <div className="flex justify-start">
          <Card className="max-w-[80%] p-4 bg-muted">
            <p className="text-muted-foreground">Typing...</p>
          </Card>
        </div>
      )}
    </div>
  );
}
