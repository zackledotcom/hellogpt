import { OllamaService } from './OllamaService';
import { VectorStoreService } from './VectorStoreService';
import { logger } from '../utils/logger';
import type { ChatMessage, Conversation } from '../types/ipc';
import { Role } from '../types/ipc';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
  private static instance: ChatService;
  private ollamaService: OllamaService;
  private vectorStoreService: VectorStoreService;
  private conversations: Map<string, Conversation> = new Map();

  private constructor(ollamaService: OllamaService, vectorStoreService: VectorStoreService) {
    this.ollamaService = ollamaService;
    this.vectorStoreService = vectorStoreService;
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      const ollamaService = OllamaService.getInstance();
      const vectorStoreService = VectorStoreService.getInstance();
      ChatService.instance = new ChatService(ollamaService, vectorStoreService);
    }
    return ChatService.instance;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing ChatService');
  }

  async sendMessage(message: ChatMessage): Promise<ChatMessage> {
    try {
      // Search for relevant documents
      const relevantDocs = await this.vectorStoreService.searchSimilar(message.content);
      
      // Create context from relevant documents
      const context = relevantDocs
        .map(doc => `[Source: ${doc.metadata.source}]\n${doc.content}`)
        .join('\n\n');

      // Create prompt with context
      const prompt = context
        ? `Context:\n${context}\n\nQuestion: ${message.content}\n\nAnswer:`
        : message.content;

      // Generate response using Ollama
      const { content: responseContent } = await this.ollamaService.generateResponse(prompt);

      // Create response message
      const responseMessage: ChatMessage = {
        id: uuidv4(),
        role: Role.Assistant,
        content: responseContent,
        timestamp: Date.now(),
      };

      // Store the conversation in vector store
      await this.vectorStoreService.addDocument({
        content: message.content,
        metadata: {
          source: 'user_message',
          timestamp: Date.now(),
          type: 'chat',
        },
      });

      await this.vectorStoreService.addDocument({
        content: responseContent,
        metadata: {
          source: 'assistant_response',
          timestamp: Date.now(),
          type: 'chat',
        },
      });

      return responseMessage;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async sendMessageStream(message: ChatMessage): Promise<void> {
    try {
      // Search for relevant documents
      const relevantDocs = await this.vectorStoreService.searchSimilar(message.content);
      
      // Create context from relevant documents
      const context = relevantDocs
        .map(doc => `[Source: ${doc.metadata.source}]\n${doc.content}`)
        .join('\n\n');

      // Create prompt with context
      const prompt = context
        ? `Context:\n${context}\n\nQuestion: ${message.content}\n\nAnswer:`
        : message.content;

      // Generate response using Ollama
      await this.ollamaService.generateResponse(prompt);
    } catch (error) {
      logger.error('Error sending message stream:', error);
      throw error;
    }
  }

  async createConversation(title: string): Promise<string> {
    const id = uuidv4();
    const conversation: Conversation = {
      id,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.conversations.set(id, conversation);
    return id;
  }

  async getConversation(id: string): Promise<ChatMessage[]> {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error(`Conversation ${id} not found`);
    }
    return conversation.messages;
  }

  async listConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  async deleteConversation(id: string): Promise<void> {
    if (!this.conversations.has(id)) {
      throw new Error(`Conversation ${id} not found`);
    }
    this.conversations.delete(id);
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error(`Conversation ${id} not found`);
    }
    conversation.title = title;
    conversation.updatedAt = Date.now();
    this.conversations.set(id, conversation);
  }
} 