import { Role } from './ipc';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export interface MessageStore {
  saveMessage(conversationId: string, message: ChatMessage): Promise<void>;
  getConversation(id: string): Promise<ChatMessage[]>;
  createConversation(title: string, metadata?: Record<string, any>): Promise<string>;
  listConversations(): Promise<Conversation[]>;
  deleteConversation(id: string): Promise<void>;
  updateConversationTitle(id: string, title: string): Promise<void>;
} 