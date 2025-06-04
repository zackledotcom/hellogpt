import { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { useMemory } from '@/hooks/useMemory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Plus, Trash2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function MemoryPanel() {
  const {
    isInitialized,
    isLoading,
    error,
    memories,
    searchMemory,
    storeMemory,
    getRecentMemories,
    deleteMemory,
    clearMemories
  } = useMemory();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [newMemory, setNewMemory] = useState('');

  useEffect(() => {
    if (isInitialized) {
      getRecentMemories(50).catch(console.error);
    }
  }, [isInitialized, getRecentMemories]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await getRecentMemories(50);
      return;
    }

    setIsSearching(true);
    try {
      await searchMemory(searchQuery, { limit: 50 });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStore = async () => {
    if (!newMemory.trim()) return;

    try {
      const result = await storeMemory(newMemory, {
        type: 'user_input',
        source: 'memory_panel',
        tags: ['manual']
      });

      if (result.success) {
        setNewMemory('');
      } else {
        console.error('Failed to store memory:', result.error);
      }
    } catch (error) {
      console.error('Store failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMemory(id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all memories?')) return;

    try {
      await clearMemories();
    } catch (error) {
      console.error('Clear failed:', error);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Initializing memory service...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => getRecentMemories(50)}
          disabled={isLoading}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleClear}
          disabled={memories.length === 0}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Add new memory..."
          value={newMemory}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMemory(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleStore()}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleStore}
          disabled={!newMemory.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {memories.map((memory) => (
            <Card key={memory.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm">{memory.content}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <Badge variant="secondary">
                      {memory.metadata.type}
                    </Badge>
                    <Badge variant="secondary">
                      {memory.metadata.source}
                    </Badge>
                    {memory.metadata.tags?.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(memory.metadata.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(memory.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 