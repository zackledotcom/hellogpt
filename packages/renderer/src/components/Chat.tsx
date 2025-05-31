import React, { useState, useEffect } from 'react';

const sendKey = btoa('send');
const healthCheckKey = btoa('healthCheck');

export function Chat() {
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [send, setSend] = useState<((channel: string, message: string) => Promise<string>) | null>(null);
  const [healthCheck, setHealthCheck] = useState<(() => Promise<any>) | null>(null);

  useEffect(() => {
    const sendFunc = (window as any)[sendKey];
    if (typeof sendFunc === 'function') {
      setSend(() => sendFunc);
    } else {
      console.error('IPC send function not found on window object');
    }

    const healthCheckFunc = (window as any)[healthCheckKey];
    if (typeof healthCheckFunc === 'function') {
      setHealthCheck(() => healthCheckFunc);
      healthCheckFunc()
        .then((status: any) => {
          console.log('App health check status:', status);
        })
        .catch((err: any) => {
          console.error('Health check error:', err);
        });
    } else {
      console.error('IPC healthCheck function not found on window object');
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !send) return;
    const userMessage = input.trim();
    setMessages((msgs) => [...msgs, { from: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);
    try {
      const response = await send('chat:sendMessage', userMessage);
      setMessages((msgs) => [...msgs, { from: 'bot', text: response }]);
    } catch (error) {
      setMessages((msgs) => [...msgs, { from: 'bot', text: 'Error: Failed to get response.' }]);
      console.error('IPC send error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 overflow-auto mb-4 border rounded p-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.from === 'user' ? 'text-right' : 'text-left'}>
            <span
              className={`inline-block rounded px-3 py-1 ${
                msg.from === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-grow border rounded px-2 py-1 mr-2"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
          placeholder="Type your message..."
        />
        <button
          className="bg-blue-600 text-white px-4 rounded disabled:opacity-50"
          onClick={handleSend}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
