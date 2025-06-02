import React, { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    electronAPI: {
      sendMessage: (message: string) => Promise<string>;
      healthCheck: () => Promise<{ status: string; timestamp: number }>;
      onStreamChunk: (callback: (chunk: string) => void) => void;
      onStreamEnd: (callback: (fullText: string) => void) => void;
      onStreamError: (callback: (error: string) => void) => void;
      sendMessageStream: (message: string) => Promise<any>;
    };
  }
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; animate?: boolean; timestamp: number }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [currentAssistant, setCurrentAssistant] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming, currentAssistant]);

  useEffect(() => {
    // Listen for streaming events
    window.electronAPI.onStreamChunk(handleStreamChunk);
    window.electronAPI.onStreamEnd(handleStreamEnd);
    window.electronAPI.onStreamError(handleStreamError);
    return () => {
      // Remove listeners if needed (not strictly necessary for global events)
    };
  }, []);

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user' as const, content: input.trim(), animate: true, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setStreaming(true);
    setCurrentAssistant('');
    try {
      await window.electronAPI.sendMessageStream(userMessage.content);
      // Streaming handled by events
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: Failed to get response.', animate: true, timestamp: Date.now() }]);
      setLoading(false);
      setStreaming(false);
    }
  };

  function handleStreamChunk(chunk: string) {
    setCurrentAssistant((prev) => prev + chunk);
  }

  function handleStreamEnd(fullText: string) {
    setMessages((prev) => [...prev, { role: 'assistant', content: fullText, animate: true, timestamp: Date.now() }]);
    setCurrentAssistant('');
    setLoading(false);
    setStreaming(false);
  }

  function handleStreamError(error: string) {
    setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${error}`, animate: true, timestamp: Date.now() }]);
    setCurrentAssistant('');
    setLoading(false);
    setStreaming(false);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-window">
      {/* Theme switcher button */}
      <button
        className="theme-switcher"
        aria-label="Toggle theme"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        {theme === 'light' ? (
          // Sun SVG
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
          // Moon SVG
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.5 14.5C16.5 15 15.5 15.25 14.5 15.25C11.05 15.25 8.25 12.45 8.25 9C8.25 7.5 8.75 6.1 9.6 5C7.1 5.5 5.25 7.7 5.25 10.25C5.25 13.45 7.8 16 11 16C13.55 16 15.75 14.15 16.25 11.65C16.1 12.5 16.5 13.5 17.5 14.5Z" fill="#facc15" />
          </svg>
        )}
      </button>
      {/* Mac-style window controls */}
      <div className="window-controls">
        <button className="win-btn close" aria-label="Close" tabIndex={-1}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1" y1="1" x2="9" y2="9" stroke="#fff" strokeWidth="1.5"/><line x1="9" y1="1" x2="1" y2="9" stroke="#fff" strokeWidth="1.5"/></svg>
        </button>
        <button className="win-btn minimize" aria-label="Minimize" tabIndex={-1}>
          <svg width="10" height="2" viewBox="0 0 10 2" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="0.5" width="8" height="1" rx="0.5" fill="#fff"/></svg>
        </button>
        <button className="win-btn maximize" aria-label="Maximize" tabIndex={-1}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="7" height="7" rx="1.5" stroke="#fff" strokeWidth="1.5"/></svg>
        </button>
      </div>
      <div className="messages-container">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-bubble ${msg.role === 'user' ? 'user' : 'assistant'} fade-in-slide`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Assistant avatar */}
            {msg.role === 'assistant' && (
              <div className="assistant-avatar">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="10" fill="#e0e7ef" stroke="#c7d2fe" strokeWidth="1.5"/>
                  <ellipse cx="7.5" cy="11" rx="1.5" ry="2" fill="#94a3b8"/>
                  <ellipse cx="14.5" cy="11" rx="1.5" ry="2" fill="#94a3b8"/>
                  <rect x="8" y="15" width="6" height="1.5" rx="0.75" fill="#c7d2fe"/>
                  <rect x="9.5" y="6" width="3" height="1.2" rx="0.6" fill="#c7d2fe"/>
                </svg>
              </div>
            )}
            {msg.content}
            {/* Copy button for assistant messages */}
            {msg.role === 'assistant' && (
              <button
                className="copy-button"
                title="Copy"
                aria-label="Copy message"
                onClick={() => handleCopy(msg.content)}
                tabIndex={0}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="8" height="8" rx="2" stroke="#888" strokeWidth="1.5"/><rect x="7" y="1" width="8" height="8" rx="2" stroke="#888" strokeWidth="1.5"/></svg>
              </button>
            )}
            {/* Timestamp */}
            <div className="message-timestamp">
              {formatTime(msg.timestamp)}
            </div>
          </div>
        ))}
        {streaming && (
          <div className="message-bubble assistant glass fade-in-slide">
            {/* Assistant avatar for streaming */}
            <div className="assistant-avatar">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="10" fill="#e0e7ef" stroke="#c7d2fe" strokeWidth="1.5"/>
                <ellipse cx="7.5" cy="11" rx="1.5" ry="2" fill="#94a3b8"/>
                <ellipse cx="14.5" cy="11" rx="1.5" ry="2" fill="#94a3b8"/>
                <rect x="8" y="15" width="6" height="1.5" rx="0.75" fill="#c7d2fe"/>
                <rect x="9.5" y="6" width="3" height="1.2" rx="0.6" fill="#c7d2fe"/>
              </svg>
            </div>
            {currentAssistant}
            <div className="typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="input-form" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
        <textarea
          ref={inputRef}
          className="input-box"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={loading}
          rows={1}
        />
        <button
          type="submit"
          className="send-button"
          disabled={loading || !input.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.33334 10H16.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 3.33334L16.6667 10L10 16.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Chat;
