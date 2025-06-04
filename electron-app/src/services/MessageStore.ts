import { app, safeStorage } from 'electron';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as crypto from 'crypto';
import { ChatMessage, Conversation } from '../types/chat';
import type Database from 'better-sqlite3';

interface DatabaseRow {
  id: string;
  role: string;
  content_encrypted: Buffer;
  timestamp: number;
  title?: string;
  created_at?: number;
  updated_at?: number;
  metadata?: string;
}

export class MessageStore {
  private db: Database;
  private encryptionKey: Buffer;

  constructor() {
    // Initialize with dummy values that will be replaced in initialize()
    this.db = {} as Database;
    this.encryptionKey = Buffer.alloc(0);
  }

  async initialize() {
    const dbPath = path.join(app.getPath('userData'), 'messages.db');
    this.db = new (require('better-sqlite3'))(dbPath);

    // Create tables with encryption
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        metadata TEXT
      );
      
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        role TEXT,
        content_encrypted BLOB,
        timestamp INTEGER,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
        ON messages(conversation_id, timestamp);
    `);

    // Generate or retrieve encryption key
    this.encryptionKey = await this.getOrCreateKey();
  }

  private async getOrCreateKey(): Promise<Buffer> {
    const keyPath = path.join(app.getPath('userData'), '.key');

    if (await fs.pathExists(keyPath)) {
      const encrypted = await fs.readFile(keyPath);
      return Buffer.from(safeStorage.decryptString(encrypted), 'base64');
    }

    const key = crypto.randomBytes(32);
    const encrypted = safeStorage.encryptString(key.toString('base64'));
    await fs.writeFile(keyPath, encrypted);
    return key;
  }

  private generateId(): string {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  async createConversation(title: string, metadata?: Record<string, any>): Promise<string> {
    const id = this.generateId();
    const now = Date.now();

    this.db.prepare(`
      INSERT INTO conversations (id, title, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      now,
      now,
      metadata ? JSON.stringify(metadata) : null
    );

    return id;
  }

  async saveMessage(conversationId: string, message: ChatMessage): Promise<void> {
    const encrypted = this.encrypt(message.content);

    this.db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content_encrypted, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      message.id,
      conversationId,
      message.role,
      encrypted,
      message.timestamp
    );

    // Update conversation timestamp
    this.db.prepare(`
      UPDATE conversations 
      SET updated_at = ? 
      WHERE id = ?
    `).run(message.timestamp, conversationId);
  }

  async getConversation(id: string): Promise<ChatMessage[]> {
    const rows = this.db.prepare(`
      SELECT id, role, content_encrypted, timestamp
      FROM messages
      WHERE conversation_id = ?
      ORDER BY timestamp ASC
    `).all(id);

    return rows.map(row => ({
      id: row.id,
      role: row.role,
      content: this.decrypt(row.content_encrypted),
      timestamp: row.timestamp
    }));
  }

  async listConversations(): Promise<Conversation[]> {
    const rows = this.db.prepare(`
      SELECT id, title, created_at, updated_at, metadata
      FROM conversations
      ORDER BY updated_at DESC
    `).all();

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  async deleteConversation(id: string): Promise<void> {
    this.db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
    this.db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    this.db.prepare(`
      UPDATE conversations 
      SET title = ?, updated_at = ? 
      WHERE id = ?
    `).run(title, Date.now(), id);
  }

  private encrypt(text: string): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
  }

  private decrypt(data: Buffer): string {
    const iv = data.slice(0, 16);
    const authTag = data.slice(16, 32);
    const encrypted = data.slice(32);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(encrypted) + decipher.final('utf8');
  }
} 