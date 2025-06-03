import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paperclip, X } from 'lucide-react';
// Import necessary hooks and utilities we've built
import { useTheme } from '../contexts/ThemeContext';
import { useMemory } from '../hooks/useMemory';
import toast from 'react-hot-toast';
import { ipcRenderer } from 'electron';

// MemoryChunk interface (matches main process structure)
interface MemoryChunk {
  id: string;
  content: string;
  metadata: {
    timestamp: number;
    source: string;
    type: string;
    tags?: string[];
    [key: string]: any;
  };
}

// MemoryState interface
interface MemoryState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  searchMemory: (query: string, options?: { limit?: number }) => Promise<MemoryChunk[]>;
  storeMemory: (content: string, metadata: Omit<MemoryChunk['metadata'], 'timestamp'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  getRecentMemories: (limit?: number) => Promise<MemoryChunk[]>;
}

// MemoryAPI interface
interface MemoryAPI {
  initialize: () => Promise<{ success: boolean; error?: string }>;
  store: (content: string, metadata: Omit<MemoryChunk['metadata'], 'timestamp'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  search: (query: string, options?: { limit?: number }) => Promise<{ success: boolean; results?: MemoryChunk[]; error?: string }>;
  getRecent: (limit?: number) => Promise<{ success: boolean; results?: MemoryChunk[]; error?: string }>;
}

// Declare global window properties for Electron and Memory APIs
declare global {
  interface Window {
    memoryAPI: MemoryAPI;
  }
}

export default function ChatContainer() {
  // Use theme hook
  const { theme, toggleTheme } = useTheme();

  // Use memory hook
  const { isInitialized: isMemoryInitialized, isLoading: isMemoryLoading, error: memoryError, searchMemory, storeMemory } = useMemory();

  // File upload state (keep for now, backend not implemented)
  const [uploads, setUploads] = useState<File[]>([]);

  // Chat state
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; animate?: boolean; timestamp: number }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false); // Combined loading for chat and memory search
  const [streaming, setStreaming] = useState(false); // Indicates if the assistant is currently streaming
  const [currentAssistant, setCurrentAssistant] = useState(''); // Holds the partial streaming response
  const [streamData, setStreamData] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Effects
  useEffect(() => {
    // Auto-scroll to bottom on new messages or streaming updates
    scrollToBottom();
  }, [messages, streaming, currentAssistant]);

  useEffect(() => {
    // Set focus to input when loading is false
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  useEffect(() => {
    // Define handler functions with explicit types
    const handleStreamChunk = (event: Electron.IpcRendererEvent, chunk: string) => {
      setStreamData(prev => prev + chunk);
    };

    const handleStreamEnd = (event: Electron.IpcRendererEvent) => { // event param type
      console.log('Stream ended');
      // Optional: Set a state to indicate stream is complete
    };

    const handleStreamError = (event: Electron.IpcRendererEvent, error: string) => {
      console.error('Stream error:', error);
      // Optional: Display error in UI
    };

    // Subscribe to IPC events
    ipcRenderer.on('ollama-stream', handleStreamChunk);
    ipcRenderer.on('ollama-stream-end', handleStreamEnd as any); // Type assertion if needed
    ipcRenderer.on('ollama-stream-error', handleStreamError);

    // Example: Send a test query to trigger the stream
    // In a real app, this would be triggered by user input
    // ipcRenderer.invoke('ollama-query', 'Tell me a short story.');

    // Cleanup listeners on component unmount
    return () => {
      ipcRenderer.removeListener('ollama-stream', handleStreamChunk);
      ipcRenderer.removeListener('ollama-stream-end', handleStreamEnd as any); // Type assertion if needed
      ipcRenderer.removeListener('ollama-stream-error', handleStreamError);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Handlers
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploads((prev) => [...prev, ...files]);
    // TODO: Implement backend IPC to handle file processing
  };

  const removeFile = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !isMemoryInitialized) {
      if (!isMemoryInitialized && !memoryError) {
         toast.error('Memory service is not initialized.');
      }
      return;
    }

    const userMessageContent = input.trim();
    setInput(''); // Clear input immediately
    setLoading(true); // Start loading indicator
    setStreaming(true); // Indicate streaming is expected
    setCurrentAssistant(''); // Clear previous assistant message

    // Add user message to chat history
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessageContent, timestamp: Date.now() },
    ]);

    try {
      // 1. Store user message in memory
      // We don't await this to avoid blocking the chat response, but we track it with toast
      toast.promise(
        storeMemory(userMessageContent, { type: 'conversation', source: 'chat', tags: ['user-input'] }),
        {
          loading: 'Storing user message in memory...',
          success: 'User message stored.',
          error: 'Failed to store user message.',
        }
      );

      // 2. Search for relevant memories based on user input
      const relevantMemories = await toast.promise(
         searchMemory(userMessageContent, { limit: 5 }), // Search for top 5 relevant memories
         {
            loading: 'Searching memories...',
            success: (results) => `Found ${results.length} relevant memories.`, // Toast success message includes count
            error: 'Failed to search memories.',
         }
      );

      // 3. Construct a context-aware prompt
      let context = '';
      if (relevantMemories && relevantMemories.length > 0) {
        context = relevantMemories.map(mem => mem.content).join('\n---\n');
        // Add instructions to the model to use the provided context
        context = `Use the following context to answer the user's question. If you cannot answer the question based on the context, say so.\n\nContext:\n${context}\n\n`;
      }

      const fullPrompt = `${context}User: ${userMessageContent}\nAssistant:`;
      console.log('Full prompt sent to model:', fullPrompt);

      // 4. Send the context-aware prompt to the language model
      await window.electronAPI.sendMessageStream(fullPrompt);

      // Loading will be set to false in handleStreamEnd or handleStreamError

    } catch (error: any) {
      console.error('Error during RAG process:', error);
      toast.error(`Error during RAG process: ${error.message || 'Unknown error'}`);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${error.message || 'Unknown error'}`, timestamp: Date.now() },
      ]);
      setLoading(false); // Ensure loading is false on error
      setStreaming(false); // Ensure streaming is false on error
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Example button to trigger a query
  const sendTestQuery = () => {
    setStreamData(''); // Clear previous data
    ipcRenderer.invoke('ollama-query', 'Tell me a short story.');
  };

  return (
    <div className="relative flex h-screen w-full text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">

      {/* Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
        <h2 className="text-sm font-semibold mb-4">Conversations</h2>
        {/* Sidebar content... */}
        <nav className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {/* Placeholder buttons - Replace with actual conversation list */} 
          <button className="w-full text-left hover:text-blue-600">New Chat</button>
          <button className="w-full text-left hover:text-blue-600">History</button>
           {/* Add MemoryChat component here or integrate its functionality if desired */}
            {/* <MemoryChat /> */}
        </nav>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Chat</h1>
          {/* Theme switcher button - Use our ThemeToggle component */}
           {/* Replace the inline SVG button with ThemeToggle component */}
            <button
              className="cursor-pointer text-gray-500 hover:text-yellow-400"
              aria-label="Toggle theme"
              onClick={toggleTheme} // Use the toggleTheme from useTheme
            >
              {/* Inline SVGs removed - ThemeToggle component will render the appropriate icon */}
               {theme === 'light' ? (
              // Sun SVG placeholder (remove this after integrating ThemeToggle)
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="5" fill="#facc15" />
                <g stroke="#facc15" strokeWidth="1.5">
                  <line x1="11" y1="2" x2="11" y2="5" />
                  <line x1="11" y1="17" x2="11" y2="20" />
                  <line x1="2" y1="11" x2="5" y2="11" />
                  <line x1="17" y1="11" x2="20" y2="11" />
                  <line x1="5.64" y1="5.64" x2="7.76" y2="7.76" />
                  <line x1="14.24" y1="14.24" x2="16.36" y2="16.36" />
                  <line x1="5.64" y1="16.36" x2="7.76" y2="14.24" />
                  <line x1="14.24" y1="7.76" x2="16.36" y2="5.64" />
                </g>
              </svg>
            ) : (
              // Moon SVG placeholder (remove this after integrating ThemeToggle)
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 14.5C16.5 15 15.5 15.25 14.5 15.25C11.05 15.25 8.25 12.45 8.25 9C8.25 7.5 8.75 6.1 9.6 5C7.1 5.5 5.25 7.7 5.25 10.25C5.25 13.45 7.8 16 11 16C13.55 16 15.75 14.15 16.25 11.65C16.1 12.5 16.5 13.5 17.5 14.5Z" fill="#facc15" />
              </svg>
            )}
            </button>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`bg-gray-100 dark:bg-gray-800 rounded-xl p-4 max-w-3xl mx-auto ${
                msg.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              {/* Assistant avatar */}
              {msg.role === 'assistant' && (
                <div className="mb-2">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="10" fill="#e0e7ef" stroke="#c7d2fe" strokeWidth="1.5"/>
                    <ellipse cx="7.5" cy="11" rx="1.5" ry="2" fill="#94a3b8"/>
                    <ellipse cx="14.5" cy="11" rx="1.5" ry="2" fill="#94a3b8"/>
                    <rect x="8" y="15" width="6" height="1.5" rx="0.75" fill="#c7d2fe"/>
                    <rect x="9.5" y="6" width="3" height="1.2" rx="0.6" fill="#c7d2fe"/>
                  </svg>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {/* Copy button for assistant messages */}
              {msg.role === 'assistant' && (
                <button
                  className="mt-2 text-sm text-blue-600 hover:underline"
                  onClick={() => handleCopy(msg.content)}
                >
                  Copy
                </button>
              )}
              {/* Timestamp */}
              <div className="text-xs text-gray-500 mt-1">{formatTime(msg.timestamp)}</div>
            </div>
          ))}
          {streaming && currentAssistant && ( // Show partial streaming response
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 max-w-3xl mx-auto text-left flex items-center gap-2">
              {/* Assistant avatar for streaming */}
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="10" fill="#e0e7ef" stroke="#c7d2fe" strokeWidth="1.5"/>
                <ellipse cx="7.5" cy="11" rx="1.5" ry="2" fill="#94a3b8"/>
                <ellipse cx="14.5" cy="11" rx="1.5" ry="2" fill="#94a3b8"/>
                <rect x="8" y="15" width="6" height="1.5" rx="0.75" fill="#c7d2fe"/>
                <rect x="9.5" y="6" width="3" height="1.2" rx="0.6" fill="#c7d2fe"/>
              </svg>
              <span>{currentAssistant}</span>
              <div className="typing-indicator flex gap-1 ml-2">
                <span className="dot w-2 h-2 rounded-full bg-gray-500 animate-pulse"></span>
                <span className="dot w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-150"></span>
                <span className="dot w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-300"></span>
              </div>
            </div>
          )}
          {loading && !streaming && !currentAssistant && ( // Show a general loading indicator if not streaming yet
             <div className="flex justify-start">
                 <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white italic">
                     Processing...
                 </div>
             </div>
         )}
           {/* Display memory service errors and initialization status */}
          {memoryError && (
             <div className="p-2 bg-red-500 text-white text-center text-sm max-w-3xl mx-auto">Memory Service Error: {memoryError}</div>
          )}
           {!isMemoryInitialized && !memoryError && (
               <div className="p-2 bg-yellow-500 text-gray-900 text-center text-sm max-w-3xl mx-auto">Memory Service is initializing...</div>
           )}
          <div ref={messagesEndRef} /> {/* Scroll anchor */}
        </div>

        {/* Upload Bar */}
        {uploads.length > 0 && (
          <div className="w-full border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-2">
            <div className="flex flex-wrap gap-2 max-w-3xl mx-auto">
              {uploads.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm">
                  <span>{file.name}</span>
                  <button onClick={() => removeFile(i)}>
                    <X className="w-4 h-4 text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <footer className="w-full border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-white dark:bg-gray-900">
          <form
            className="mx-auto max-w-3xl flex items-center gap-3 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm bg-white dark:bg-gray-800"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            {/* Upload Button (keep for now, backend pending) */}
            <label className="cursor-pointer text-gray-500 hover:text-blue-600">
              <Paperclip className="w-5 h-5" />
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                 disabled={loading || isMemoryLoading || !isMemoryInitialized} // Disable file upload while processing
              />
            </label>

            {/* Message Input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={!isMemoryInitialized && !memoryError ? "Initializing memory..." : "Type your message..."}
              className="flex-grow p-2 border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              rows={1}
              disabled={loading || isMemoryLoading || !isMemoryInitialized}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || isMemoryLoading || !isMemoryInitialized || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading && !streaming ? 'Processing...' : 'Send'}
            </button>
          </form>
        </footer>
      </main>

      {/* Right Sidebar - Placeholder */}
       {/* This can be used for ModelSelector or MemoryChat if needed */}
      <aside className="hidden md:flex flex-col w-64 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
         <h2 className="text-sm font-semibold mb-4">Details</h2>
         {/* Add ModelSelector or other components here */}
      </aside>
    </div>
  );
} 