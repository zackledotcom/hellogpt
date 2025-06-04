import { app } from 'electron';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';

interface DatabaseRow {
  id: string;
  content: string;
  metadata: string;
  created_at: number;
  updated_at: number;
}

export interface MemoryChunk {
  id: string;
  content: string;
  metadata: {
    timestamp: number;
    source?: string;
    type?: string;
    tags?: string[];
    importance?: number;
    context?: {
      conversationId?: string;
      messageId?: string;
      [key: string]: any;
    };
    embedding?: number[];
    [key: string]: any;
  };
  vector?: number[];
  similarity?: number;
}

export class MemoryService extends EventEmitter {
  private static instance: MemoryService;
  private db!: Database;
  private isInitialized: boolean = false;

  private constructor() {
    super();
  }

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  public async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isInitialized) {
        return { success: true };
      }

      const dbPath = path.join(app.getPath('userData'), 'memory.db');
      this.db = new Database(dbPath);

      // Create tables
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          content TEXT,
          metadata TEXT,
          embedding BLOB,
          created_at INTEGER,
          updated_at INTEGER
        );
        
        CREATE INDEX IF NOT EXISTS idx_memories_metadata 
          ON memories(metadata);
        
        CREATE INDEX IF NOT EXISTS idx_memories_timestamp 
          ON memories(created_at);
      `);

      this.isInitialized = true;
      this.emit('initialized');
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize memory service:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize memory service' 
      };
    }
  }

  public async store(
    content: string, 
    metadata: Omit<MemoryChunk['metadata'], 'timestamp'>
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      if (!this.isInitialized) {
        throw new Error('Memory service not initialized');
      }

      const id = crypto.randomUUID();
      const timestamp = Date.now();
      const memory: MemoryChunk = {
        id,
        content,
        metadata: {
          ...metadata,
          timestamp
        }
      };

      // Store in database
      this.db.prepare(`
        INSERT INTO memories (id, content, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        id,
        content,
        JSON.stringify(memory.metadata),
        timestamp,
        timestamp
      );

      this.emit('stored', memory);
      return { success: true, id };
    } catch (error) {
      console.error('Failed to store memory:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to store memory' 
      };
    }
  }

  public async search(
    query: string, 
    options: { limit?: number } = {}
  ): Promise<{ success: boolean; results?: MemoryChunk[]; error?: string }> {
    try {
      if (!this.isInitialized) {
        throw new Error('Memory service not initialized');
      }

      const limit = options.limit || 10;
      
      // Simple text search for now - can be enhanced with embeddings later
      const results = this.db.prepare(`
        SELECT id, content, metadata
        FROM memories
        WHERE content LIKE ? OR metadata LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(`%${query}%`, `%${query}%`, limit) as DatabaseRow[];

      const memories: MemoryChunk[] = results.map((row: DatabaseRow) => ({
        id: row.id,
        content: row.content,
        metadata: JSON.parse(row.metadata)
      }));

      this.emit('searched', memories);
      return { success: true, results: memories };
    } catch (error) {
      console.error('Failed to search memories:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to search memories' 
      };
    }
  }

  public async getRecent(
    limit: number = 10
  ): Promise<{ success: boolean; results?: MemoryChunk[]; error?: string }> {
    try {
      if (!this.isInitialized) {
        throw new Error('Memory service not initialized');
      }

      const results = this.db.prepare(`
        SELECT id, content, metadata
        FROM memories
        ORDER BY created_at DESC
        LIMIT ?
      `).all(limit) as DatabaseRow[];

      const memories: MemoryChunk[] = results.map((row: DatabaseRow) => ({
        id: row.id,
        content: row.content,
        metadata: JSON.parse(row.metadata)
      }));

      this.emit('recent', memories);
      return { success: true, results: memories };
    } catch (error) {
      console.error('Failed to get recent memories:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get recent memories' 
      };
    }
  }

  public async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isInitialized) {
        throw new Error('Memory service not initialized');
      }

      this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
      this.emit('deleted', id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete memory:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete memory' 
      };
    }
  }

  public async clear(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isInitialized) {
        throw new Error('Memory service not initialized');
      }

      this.db.prepare('DELETE FROM memories').run();
      this.emit('cleared');
      return { success: true };
    } catch (error) {
      console.error('Failed to clear memories:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear memories' 
      };
    }
  }
} 