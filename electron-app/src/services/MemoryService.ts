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
  private isInitialized: boolean = false;
  private db: Database | null = null;

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

  public async store(chunk: MemoryChunk): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Memory service not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT INTO memories (id, content, metadata, embedding, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      chunk.id,
      chunk.content,
      JSON.stringify(chunk.metadata),
      chunk.vector ? new Float64Array(chunk.vector).buffer : null,
      Date.now(),
      Date.now()
    );

    this.emit('stored', chunk);
  }

  public async search(query: string): Promise<MemoryChunk[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Memory service not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      WHERE content LIKE ? 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(`%${query}%`);
    return rows.map(row => ({
      id: row.id,
      content: row.content,
      metadata: JSON.parse(row.metadata),
      vector: row.embedding ? Array.from(new Float64Array(row.embedding)) : undefined,
    }));
  }

  public async getRecent(limit: number = 10): Promise<MemoryChunk[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Memory service not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      ORDER BY created_at DESC 
      LIMIT ?
    `);

    const rows = stmt.all(limit);
    return rows.map(row => ({
      id: row.id,
      content: row.content,
      metadata: JSON.parse(row.metadata),
      vector: row.embedding ? Array.from(new Float64Array(row.embedding)) : undefined,
    }));
  }

  public async delete(id: string): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Memory service not initialized');
    }

    const stmt = this.db.prepare('DELETE FROM memories WHERE id = ?');
    stmt.run(id);
    this.emit('deleted', id);
  }

  public async clear(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Memory service not initialized');
    }

    this.db.exec('DELETE FROM memories');
    this.emit('cleared');
  }
} 