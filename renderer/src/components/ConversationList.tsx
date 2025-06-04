import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { Conversation } from '@/types';

export const ConversationList: React.FC = () => {
  const {
    conversations,
    currentConversation,
    loadConversation,
    createConversation,
    deleteConversation,
    updateConversationTitle,
  } = useConversations();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createConversation(newTitle.trim());
    setNewTitle('');
    setIsCreating(false);
  };

  const handleEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    await updateConversationTitle(id, editTitle.trim());
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="glass p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-foreground">Conversations</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`group relative rounded-lg p-2 transition-all duration-200
              ${
                currentConversation?.id === conversation.id
                  ? 'glass bg-coral/10 text-coral-foreground'
                  : 'glass glass-hover hover:bg-mint/5'
              }
              animate-in slide-in duration-200`}
          >
            {editingId === conversation.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input flex-1"
                  autoFocus
                />
                <button
                  onClick={() => handleEdit(conversation.id)}
                  className="btn btn-ghost p-1"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="btn btn-ghost p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadConversation(conversation.id)}
                  className="flex-1 text-left truncate"
                >
                  <span className="font-medium">{conversation.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {new Date(conversation.lastUpdated).toLocaleDateString()}
                  </span>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingId(conversation.id);
                      setEditTitle(conversation.title);
                    }}
                    className="btn btn-ghost p-1"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(conversation.id)}
                    className="btn btn-ghost p-1 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass p-4 border-t border-white/10">
        {isCreating ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New conversation title..."
              className="input flex-1"
              autoFocus
            />
            <button onClick={handleCreate} className="btn btn-primary">
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="btn btn-primary w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </button>
        )}
      </div>
    </div>
  );
}; 