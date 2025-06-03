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
  isThinking: boolean;
  isTyping: boolean;
  onStopResponse?: () => void;
  onReaction?: (messageId: string, emoji: string) => void;
}

interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const REACTIONS = ['👍', '👎', '❤️', '😢', '😡', '🤔', '😮', '😂'] as const;

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isThinking,
  isTyping,
  onStopResponse,
  onReaction,
}) => {
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
    <div className="flex flex-col space-y-3 px-4 pt-4">
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          const correction = corrections[message.id];
          const isAssistant = message.role === Role.Assistant;
          const content = correction?.text ?? message.content;

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`text-sm leading-relaxed ${isAssistant ? 'text-left' : 'text-right'} group`}
            >
              <div onDoubleClick={() => isAssistant && handleCorrection(message.id, message.content)}>
                {renderMessageContent(content)}
              </div>
              <span className="text-[10px] text-gray-400 opacity-30 mt-1 block select-none">
                {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
              </span>
              {correction && (
                <motion.div
                  className="text-[11px] text-blue-500 mt-1 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ✅ Correction learned
                </motion.div>
              )}
            </motion.div>
          );
        })}
        {(isTyping || isThinking) && (
          <motion.div
            key="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-left text-sm text-gray-500 px-1"
          >
            {isTyping && <span className="animate-pulse">Assistant is typing...</span>}
            {isThinking && <span className="italic ml-2">Thinking...</span>}
            {onStopResponse && (
              <button
                onClick={onStopResponse}
                className="ml-3 text-xs text-gray-500 hover:text-gray-700"
              >
                Stop
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
