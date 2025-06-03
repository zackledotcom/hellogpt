import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOllama } from '../hooks/useOllama';
import { Send, StopCircle, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../types/ipc';
import { Role } from '../types/ipc';

interface ChatInputProps {
  onMessageSent: (message: ChatMessage) => void;
  onStreamComplete: () => void;
  isStreaming: boolean;
  onStopStream: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onMessageSent,
  onStreamComplete,
  isStreaming,
  onStopStream,
}) => {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessageStream, isConnected, error } = useOllama();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault();
      navigateHistory('up');
    } else if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault();
      navigateHistory('down');
    }
  }, [message]);

  const navigateHistory = (direction: 'up' | 'down') => {
    if (direction === 'up' && historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setMessage(history[history.length - 1 - newIndex]);
    } else if (direction === 'down' && historyIndex > -1) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setMessage(newIndex === -1 ? '' : history[history.length - 1 - newIndex]);
    }
  };

  const handleSend = useCallback(async () => {
    if (!message.trim() || !isConnected || isStreaming) return;

    const newMessage: ChatMessage = {
      role: Role.User,
      content: message.trim(),
      timestamp: Date.now(),
    };

    // Add to history
    setHistory(prev => [...prev, message.trim()]);
    setHistoryIndex(-1);
    setMessage('');
    onMessageSent(newMessage);

    // Start streaming response
    try {
      await sendMessageStream(
        newMessage,
        {
          onChunk: (chunk) => {
            // Handle streaming chunks
          },
          onError: (error) => {
            console.error('Stream error:', error);
          },
          onComplete: () => {
            onStreamComplete();
          }
        }
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }, [message, isConnected, isStreaming, onMessageSent, onStreamComplete, sendMessageStream]);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-16 left-0 right-0 px-4 pb-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Input Area */}
          <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-xl">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Type a message..." : "Connecting to Ollama..."}
              disabled={!isConnected || isStreaming}
              className="w-full px-4 py-3 pr-24 bg-transparent text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg"
              rows={1}
            />

            {/* Action Buttons */}
            <div className="absolute right-2 bottom-2 flex items-center space-x-2">
              <AnimatePresence>
                {isStreaming ? (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={onStopStream}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Stop generating"
                  >
                    <StopCircle className="w-5 h-5" />
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={handleSend}
                    disabled={!message.trim() || !isConnected}
                    className={`p-2 rounded-full transition-colors ${
                      message.trim() && isConnected
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-gray-500 cursor-not-allowed'
                    }`}
                    title="Send message (Enter)"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="absolute -top-6 left-0 right-0 flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">
                {isStreaming ? (
                  <span className="flex items-center space-x-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Generating response...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1">
                    <ArrowUp className="w-3 h-3" />
                    <span>Ctrl + ↑ to navigate history</span>
                  </span>
                )}
              </span>
            </div>
            {error && (
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400"
              >
                {error}
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
