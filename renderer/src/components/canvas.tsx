import React, { useState, useEffect, useRef } from 'react';
import { Code, MessageSquare, Split, Maximize2, Save, Download, Plus, X, Edit3, Eye, Minimize2 } from 'lucide-react';
import { ChatMessage, ChatResponse, ModelLoadingState, AppStatus, OllamaConnectionStatus, OllamaModel, Conversation } from '@/types';
import { Role } from '@/types/ipc';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    electronAPI: {
      // Chat methods
      sendMessage: (message: ChatMessage) => Promise<ChatResponse>;
      sendMessageStream: (message: ChatMessage) => Promise<void>;
      onStreamChunk: (callback: (chunk: string) => void) => () => void;
      onStreamEnd: (callback: () => void) => () => void;
      onStreamError: (callback: (error: Error) => void) => () => void;

      // Message persistence methods
      createConversation: (title: string) => Promise<string>;
      getConversation: (id: string) => Promise<ChatMessage[]>;
      listConversations: () => Promise<Conversation[]>;
      deleteConversation: (id: string) => Promise<void>;
      updateConversationTitle: (id: string, title: string) => Promise<void>;

      // App methods
      healthCheck: () => Promise<AppStatus>;

      // Ollama methods
      listModels: () => Promise<{ models: OllamaModel[] }>;
      setModel: (model: { modelName: string }) => Promise<void>;
      checkConnection: () => Promise<OllamaConnectionStatus>;

      // Model loading events
      onModelLoadingStateChanged: (callback: (state: ModelLoadingState) => void) => () => void;
    };
  }
}

interface Message extends ChatMessage {
  animate?: boolean;
  timestamp: number;
}

interface Canvas {
  id: string;
  name: string;
  content: string;
  type: 'code' | 'markdown' | 'html' | 'react';
  language: string;
  lastModified: Date;
}

interface CanvasTab {
  id: string;
  canvasId: string;
  splitView: boolean;
  activeView: 'code' | 'preview';
}

const ChatWithCanvas: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [currentAssistant, setCurrentAssistant] = useState('');
  const [activeView, setActiveView] = useState<'chat' | 'canvas' | 'split'>('chat');
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  // Canvas state
  const [canvases, setCanvases] = useState<Canvas[]>([
    {
      id: '1',
      name: 'Hello World',
      content: `function greetUser(name) {
  console.log(\`Hello, \${name}! Welcome to the canvas.\`);
  return \`Welcome \${name}\`;
}

// Call the function
greetUser('Developer');

// Create a simple component
const greeting = document.createElement('div');
greeting.innerHTML = '<h1>Hello Canvas!</h1>';
greeting.style.color = '#3b82f6';
greeting.style.fontFamily = 'system-ui';

document.body.appendChild(greeting);`,
      type: 'code',
      language: 'javascript',
      lastModified: new Date()
    }
  ]);

  const [tabs, setTabs] = useState<CanvasTab[]>([
    { id: 'tab-1', canvasId: '1', splitView: false, activeView: 'code' }
  ]);

  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming, currentAssistant]);

  useEffect(() => {
    if (window.electronAPI) {
      const unsubscribeChunk = window.electronAPI.onStreamChunk(handleStreamChunk);
      const unsubscribeEnd = window.electronAPI.onStreamEnd(handleStreamEnd);
      const unsubscribeError = window.electronAPI.onStreamError(handleStreamError);

      return () => {
        unsubscribeChunk();
        unsubscribeEnd();
        unsubscribeError();
      };
    }
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
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.User,
      content: input.trim(),
      animate: true,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setStreaming(true);
    setCurrentAssistant('');
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.sendMessageStream(userMessage);
      } else {
        // Fallback for development
        setTimeout(() => {
          handleStreamEnd();
        }, 1000);
      }
    } catch (error) {
      toast.error('Failed to send message');
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: Role.Assistant,
        content: 'Error: Failed to get response.',
        animate: true,
        timestamp: Date.now()
      }]);
      setLoading(false);
      setStreaming(false);
    }
  };

  function handleStreamChunk(chunk: string) {
    setCurrentAssistant((prev) => prev + chunk);
  }

  function handleStreamEnd() {
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      role: Role.Assistant,
      content: currentAssistant,
      animate: true,
      timestamp: Date.now()
    }]);
    setCurrentAssistant('');
    setLoading(false);
    setStreaming(false);
  }

  function handleStreamError(error: Error) {
    toast.error(error.message);
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      role: Role.Assistant,
      content: `Error: ${error.message}`,
      animate: true,
      timestamp: Date.now()
    }]);
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
    toast.success('Copied to clipboard');
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Canvas functions
  const getActiveCanvas = () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    return canvases.find(canvas => canvas.id === activeTab?.canvasId);
  };

  const updateCanvasContent = (content: string) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab) return;

    setCanvases(prev => prev.map(canvas => 
      canvas.id === activeTab.canvasId 
        ? { ...canvas, content, lastModified: new Date() }
        : canvas
    ));
  };

  const createNewCanvas = () => {
    const newCanvas: Canvas = {
      id: Date.now().toString(),
      name: `Canvas ${canvases.length + 1}`,
      content: '// New canvas\nconsole.log("Hello from new canvas!");',
      type: 'code',
      language: 'javascript',
      lastModified: new Date()
    };

    const newTab: CanvasTab = {
      id: `tab-${Date.now()}`,
      canvasId: newCanvas.id,
      splitView: false,
      activeView: 'code'
    };

    setCanvases(prev => [...prev, newCanvas]);
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    toast.success('New canvas created');
  };

  const deleteCanvas = (canvasId: string) => {
    if (canvases.length <= 1) {
      toast.error('Cannot delete the last canvas');
      return;
    }

    setCanvases(prev => prev.filter(canvas => canvas.id !== canvasId));
    setTabs(prev => {
      const updatedTabs = prev.filter(tab => tab.canvasId !== canvasId);
      if (activeTabId && prev.find(tab => tab.id === activeTabId)?.canvasId === canvasId) {
        setActiveTabId(updatedTabs[0]?.id || '');
      }
      return updatedTabs;
    });
    toast.success('Canvas deleted');
  };

  const renameCanvas = (canvasId: string, newName: string) => {
    setCanvases(prev => prev.map(canvas => 
      canvas.id === canvasId ? { ...canvas, name: newName } : canvas
    ));
    setIsRenaming(null);
    toast.success('Canvas renamed');
  };

  const downloadCanvas = (canvas: Canvas) => {
    const blob = new Blob([canvas.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${canvas.name}.${canvas.language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Canvas downloaded');
  };

  const toggleSplitView = () => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, splitView: !tab.splitView }
        : tab
    ));
  };

  const executeCode = (code: string) => {
    try {
      // Create a safe execution environment
      const func = new Function(code);
      func();
    } catch (error) {
      toast.error('Code execution error: ' + error);
      console.error('Code execution error:', error);
    }
  };

  const renderPreview = (canvas: Canvas) => {
    if (canvas.language === 'html') {
      return (
        <iframe
          srcDoc={canvas.content}
          className="w-full h-full border-none bg-white"
          title="HTML Preview"
        />
      );
    } else if (canvas.language === 'javascript') {
      return (
        <div className="p-4 h-full overflow-auto">
          <div className="text-sm text-[#858585] dark:text-[#858585] light:text-[#666666] mb-2">Console Output:</div>
          <div 
            className="bg-[#252526] dark:bg-[#252526] light:bg-[#F3F3F3] p-3 rounded-lg font-mono text-sm text-[#D4D4D4] dark:text-[#D4D4D4] light:text-[#1E1E1E]"
            id="preview-output"
          >
            Click "Run Code" to execute
          </div>
          <button
            onClick={() => {
              const output = document.getElementById('preview-output');
              if (output) {
                output.innerHTML = '';
                const originalLog = console.log;
                console.log = (...args) => {
                  output.innerHTML += args.join(' ') + '\n';
                  originalLog(...args);
                };
                executeCode(canvas.content);
                console.log = originalLog;
              }
            }}
            className="mt-2 px-3 py-1.5 bg-[#0E639C] text-white rounded hover:bg-[#1177BB] transition-colors"
          >
            Run Code
          </button>
        </div>
      );
    }
    return <div className="p-4 text-[#858585] dark:text-[#858585] light:text-[#666666]">Preview not available for this file type</div>;
  };

  const renderChatView = () => (
    <div className="flex flex-col h-full bg-background/40 backdrop-blur-glass">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === Role.User ? 'justify-end' : 'justify-start'
            } animate-in slide-in duration-200`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2
                ${
                  msg.role === Role.User
                    ? 'glass glass-hover bg-coral/10 text-coral-foreground'
                    : 'glass glass-hover bg-mint/10 text-mint-foreground'
                }
                shadow-glass`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div className="text-xs text-muted-foreground mt-1">
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex justify-start animate-in slide-in duration-200">
            <div className="glass glass-hover bg-mint/10 text-mint-foreground rounded-2xl px-4 py-2 max-w-[80%]">
              <p className="whitespace-pre-wrap">{currentAssistant}</p>
              <div className="typing-indicator mt-2">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="glass border-t border-white/10 p-4"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="input min-h-[44px] max-h-[200px] resize-none"
            rows={1}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary p-2"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.33334 10H16.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 3.33334L16.6667 10L10 16.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );

  const renderCanvasView = () => {
    const activeCanvas = getActiveCanvas();
    const activeTab = tabs.find(tab => tab.id === activeTabId);

    return (
      <div className="flex flex-col h-full bg-[#1E1E1E] dark:bg-[#1E1E1E] light:bg-white">
        {/* Canvas Tabs */}
        <div className="bg-[#252526] dark:bg-[#252526] light:bg-[#F3F3F3] border-b border-[#3C3C3C] dark:border-[#3C3C3C] light:border-[#E0E0E0] px-4 py-2">
          <div className="flex items-center space-x-2 flex-1">
            {tabs.map(tab => {
              const canvas = canvases.find(c => c.id === tab.canvasId);
              if (!canvas) return null;
              
              return (
                <div
                  key={tab.id}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all ${
                    tab.id === activeTabId 
                      ? 'bg-[#1E1E1E] dark:bg-[#1E1E1E] light:bg-white text-[#D4D4D4] dark:text-[#D4D4D4] light:text-[#1E1E1E]' 
                      : 'bg-[#2D2D2D] dark:bg-[#2D2D2D] light:bg-[#F3F3F3] text-[#858585] dark:text-[#858585] light:text-[#666666] hover:text-[#D4D4D4] dark:hover:text-[#D4D4D4] light:hover:text-[#1E1E1E]'
                  }`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {isRenaming === canvas.id ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={() => {
                        renameCanvas(canvas.id, newName);
                        setIsRenaming(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameCanvas(canvas.id, newName);
                          setIsRenaming(null);
                        }
                        if (e.key === 'Escape') {
                          setIsRenaming(null);
                        }
                      }}
                      className="bg-transparent border-none outline-none text-sm w-24 text-[#D4D4D4]"
                      autoFocus
                    />
                  ) : (
                    <>
                      <Code size={14} className="text-[#858585] dark:text-[#858585] light:text-[#666666]" />
                      <span className="text-sm font-medium">{canvas.name}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsRenaming(canvas.id);
                            setNewName(canvas.name);
                          }}
                          className="p-1 hover:bg-[#3C3C3C] rounded"
                        >
                          <Edit3 size={12} className="text-[#858585] dark:text-[#858585] light:text-[#666666]" />
                        </button>
                        {tabs.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCanvas(canvas.id);
                            }}
                            className="p-1 hover:bg-[#3C3C3C] rounded"
                          >
                            <X size={12} className="text-[#858585] dark:text-[#858585] light:text-[#666666]" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={createNewCanvas}
              className="px-3 py-1.5 bg-[#0E639C] text-white rounded hover:bg-[#1177BB] transition-colors"
            >
              <Plus size={14} className="mr-2" />
              New
            </button>
            
            {activeCanvas && (
              <>
                <button
                  onClick={toggleSplitView}
                  className="p-1.5 text-[#858585] dark:text-[#858585] light:text-[#666666] hover:bg-[#3C3C3C] rounded"
                >
                  {activeTab?.splitView ? <Minimize2 size={14} /> : <Split size={14} />}
                </button>
                
                <button
                  onClick={() => downloadCanvas(activeCanvas)}
                  className="p-1.5 text-[#858585] dark:text-[#858585] light:text-[#666666] hover:bg-[#3C3C3C] rounded"
                >
                  <Download size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        {activeCanvas && activeTab && (
          <div className="flex flex-1 overflow-hidden">
            {/* Code Editor */}
            <div className={`${activeTab.splitView ? 'w-1/2' : 'w-full'} flex flex-col`}>
              <div className="bg-[#252526] dark:bg-[#252526] light:bg-[#F3F3F3] border-b border-[#3C3C3C] dark:border-[#3C3C3C] light:border-[#E0E0E0] px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Code size={16} className="text-[#858585] dark:text-[#858585] light:text-[#666666]" />
                  <span className="text-sm font-medium text-[#D4D4D4] dark:text-[#D4D4D4] light:text-[#1E1E1E]">Code Editor</span>
                  <span className="text-xs text-[#858585] dark:text-[#858585] light:text-[#666666]">({activeCanvas.language})</span>
                </div>
                <div className="text-xs text-[#858585] dark:text-[#858585] light:text-[#666666]">
                  Last modified: {activeCanvas.lastModified.toLocaleTimeString()}
                </div>
              </div>
              
              <div className="flex-1 relative">
                {/* Line Numbers */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#252526] dark:bg-[#252526] light:bg-[#F3F3F3] border-r border-[#3C3C3C] dark:border-[#3C3C3C] light:border-[#E0E0E0] overflow-hidden">
                  <div className="relative h-full">
                    {activeCanvas.content.split('\n').map((_, index) => (
                      <div
                        key={index}
                        className="text-right pr-2 text-xs text-[#858585] dark:text-[#858585] light:text-[#666666] select-none"
                        style={{ height: '24px', lineHeight: '24px' }}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code Editor with Background Pattern */}
                <div className="absolute inset-0 pl-12">
                  <div className="absolute inset-0 bg-[#1E1E1E] dark:bg-[#1E1E1E] light:bg-white">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03] light:opacity-[0.1]"
                         style={{
                           backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
                           backgroundSize: '20px 20px'
                         }}
                    />
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={activeCanvas.content}
                    onChange={(e) => updateCanvasContent(e.target.value)}
                    className="absolute inset-0 w-full h-full p-4 font-mono text-sm leading-6 resize-none border-none outline-none bg-transparent text-[#D4D4D4] dark:text-[#D4D4D4] light:text-[#1E1E1E]"
                    style={{
                      fontFamily: '"JetBrains Mono", "Fira Code", "Source Code Pro", monospace',
                      fontSize: '14px',
                      lineHeight: '24px',
                      tabSize: 2,
                      caretColor: '#D4D4D4',
                      letterSpacing: '0.3px'
                    }}
                    placeholder="Start coding..."
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            {activeTab.splitView && (
              <div className="w-1/2 flex flex-col border-l border-[#3C3C3C] dark:border-[#3C3C3C] light:border-[#E0E0E0]">
                <div className="bg-[#252526] dark:bg-[#252526] light:bg-[#F3F3F3] border-b border-[#3C3C3C] dark:border-[#3C3C3C] light:border-[#E0E0E0] px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Eye size={16} className="text-[#858585] dark:text-[#858585] light:text-[#666666]" />
                    <span className="text-sm font-medium text-[#D4D4D4] dark:text-[#D4D4D4] light:text-[#1E1E1E]">Preview</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden bg-[#1E1E1E] dark:bg-[#1E1E1E] light:bg-white">
                  {renderPreview(activeCanvas)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Bar */}
        <div className="bg-[#007ACC] text-white px-4 py-1 text-xs flex justify-between items-center">
          <div>
            {activeCanvas && (
              <span>
                {activeCanvas.name} • {activeCanvas.language} • {activeCanvas.content.length} characters
              </span>
            )}
          </div>
          <div>
            {canvases.length} canvas{canvases.length !== 1 ? 'es' : ''}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background/40 backdrop-blur-glass">
      {/* View Toggle Header */}
      <div className="glass border-b border-white/10 px-6 py-3">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-foreground">HelloGPT</h1>
          <div className="flex bg-background/40 backdrop-blur-glass rounded-lg p-1">
            <button
              onClick={() => setActiveView('chat')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all ${
                activeView === 'chat' 
                  ? 'glass bg-coral/10 text-coral-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare size={16} />
              <span className="text-sm font-medium">Chat</span>
            </button>
            <button
              onClick={() => setActiveView('canvas')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all ${
                activeView === 'canvas' 
                  ? 'glass bg-coral/10 text-coral-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code size={16} />
              <span className="text-sm font-medium">Canvas</span>
            </button>
            <button
              onClick={() => setActiveView('split')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all ${
                activeView === 'split' 
                  ? 'glass bg-coral/10 text-coral-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Split size={16} />
              <span className="text-sm font-medium">Split</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-muted-foreground">
            {canvases.length} canvas{canvases.length !== 1 ? 'es' : ''}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'chat' && renderChatView()}
        {activeView === 'canvas' && renderCanvasView()}
        {activeView === 'split' && (
          <div className="flex h-full">
            <div className="w-1/2 border-r border-white/10">
              {renderChatView()}
            </div>
            <div className="w-1/2">
              {renderCanvasView()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWithCanvas;