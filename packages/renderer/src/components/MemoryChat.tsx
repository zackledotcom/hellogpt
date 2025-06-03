import React, { useState, useEffect, useCallback } from 'react';
import { useMemory } from '../hooks/useMemory';

// MemoryChunk interface (matches main process structure)
interface MemoryChunk {
  id: string;
  content: string;
  metadata: {
    timestamp: number;
    source: string;
    type: string;
    tags?: string[];
    [key: string]: any; // Allow additional properties
  };
}

const MemoryChat: React.FC = () => {
  const { isInitialized, isLoading, error, storeMemory, searchMemory, getRecentMemories } = useMemory();

  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [memories, setMemories] = useState<MemoryChunk[]>([]);
  const [recentMemories, setRecentMemories] = useState<MemoryChunk[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [isFetchingRecent, setIsFetchingRecent] = useState(false);

  const loadRecentMemories = useCallback(async () => {
    if (!isInitialized || isFetchingRecent) return;
    setIsFetchingRecent(true);
    try {
      const recent = await getRecentMemories(10); // Fetch last 10 recent memories
      setRecentMemories(recent);
    } catch (err) {
      console.error('Failed to load recent memories:', err);
    } finally {
      setIsFetchingRecent(false);
    }
  }, [isInitialized, isFetchingRecent, getRecentMemories]);

  useEffect(() => {
    // Load recent memories on component mount and when initialized
    if (isInitialized) {
      loadRecentMemories();
    }
  }, [isInitialized, loadRecentMemories]);

  const handleStoreMemory = async () => {
    if (!message.trim() || isStoring || !isInitialized) return;
    setIsStoring(true);
    const metadata = {
      type: 'conversation',
      source: 'chat',
      tags: ['user-input'],
    };
    try {
      const id = await storeMemory(message.trim(), metadata);
      if (id) {
        setMessage('');
        // Refresh recent memories after storing
        loadRecentMemories();
      }
    } catch (err) {
      console.error('Failed to store memory:', err);
    } finally {
      setIsStoring(false);
    }
  };

  const handleSearchMemory = async () => {
    if (!searchQuery.trim() || isSearching || !isInitialized) return;
    setIsSearching(true);
    try {
      const results = await searchMemory(searchQuery.trim(), { limit: 5 }); // Search for top 5
      setMemories(results);
    } catch (err) {
      console.error('Failed to search memory:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-4 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Memory Management</h2>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          Error: {error}
        </div>
      )}

      {!isInitialized && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md">
          Initializing memory service...
        </div>
      )}

      {isLoading && (
         <div className="p-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md">
           Loading...
         </div>
      )}

      {/* Store Memory Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Store Memory</h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter text to store in memory..."
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          rows={3}
          disabled={!isInitialized || isStoring || isLoading}
        />
        <button
          onClick={handleStoreMemory}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={!isInitialized || isStoring || isLoading || !message.trim()}
        >
          {isStoring ? 'Storing...' : 'Store Memory'}
        </button>
      </div>

      {/* Search Memory Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Search Memory</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter search query..."
            className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={!isInitialized || isSearching || isLoading}
          />
          <button
            onClick={handleSearchMemory}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            disabled={!isInitialized || isSearching || isLoading || !searchQuery.trim()}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {memories.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">Search Results:</h4>
            {memories.map((mem) => (
              <div key={mem.id} className="p-3 border rounded-md dark:border-gray-700 dark:text-gray-300">
                <p className="text-sm font-semibold">Content:</p>
                <p className="text-gray-800 dark:text-gray-200 break-words">{mem.content}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Source: {mem.metadata.source}, Type: {mem.metadata.type}, Timestamp: {new Date(mem.metadata.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
         {isInitialized && !isSearching && memories.length === 0 && searchQuery.trim() && (
             <p className="text-sm text-gray-500 dark:text-gray-400">No search results found.</p>
         )}
      </div>

      {/* Recent Memories Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Recent Memories</h3>
         {isFetchingRecent ? (
             <p className="text-sm text-gray-500 dark:text-gray-400">Loading recent memories...</p>
         ) : recentMemories.length === 0 ? (
             <p className="text-sm text-gray-500 dark:text-gray-400">No recent memories found.</p>
         ) : (
            <div className="mt-4 space-y-2">
              {recentMemories.map((mem) => (
                <div key={mem.id} className="p-3 border rounded-md dark:border-gray-700 dark:text-gray-300">
                  <p className="text-sm font-semibold">Content:</p>
                  <p className="text-gray-800 dark:text-gray-200 break-words">{mem.content}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Source: {mem.metadata.source}, Type: {mem.metadata.type}, Timestamp: {new Date(mem.metadata.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
         )}
      </div>
    </div>
  );
};

export default MemoryChat; 