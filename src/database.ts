/**
 * SnipMCP - Database Layer
 * SQLite-based storage with vector search capabilities
 */

import Database from 'better-sqlite3';
import { Snippet, CreateSnippetInput, UpdateSnippetInput, SearchResult } from './types.js';
import { generateId, getCurrentTimestamp } from './utils.js';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export class SnippetDatabase {
  private db: Database.Database;
  private dataDir: string;

  constructor(customPath?: string) {
    // Use custom path or default to ~/.snipmcp
    this.dataDir = customPath || path.join(os.homedir(), '.snipmcp');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    const dbPath = path.join(this.dataDir, 'snippets.db');
    this.db = new Database(dbPath);
    this.initialize();
  }

  /**
   * Initialize database schema
   */
  private initialize(): void {
    // Create snippets table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS snippets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        language TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        usage_count INTEGER DEFAULT 0
      )
    `);

    // Create full-text search virtual table
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
        name,
        description,
        code,
        content='snippets',
        content_rowid='rowid'
      )
    `);

    // Create triggers to keep FTS index in sync
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS snippets_ai AFTER INSERT ON snippets BEGIN
        INSERT INTO snippets_fts(rowid, name, description, code)
        VALUES (new.rowid, new.name, new.description, new.code);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS snippets_ad AFTER DELETE ON snippets BEGIN
        INSERT INTO snippets_fts(snippets_fts, rowid, name, description, code)
        VALUES ('delete', old.rowid, old.name, old.description, old.code);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS snippets_au AFTER UPDATE ON snippets BEGIN
        INSERT INTO snippets_fts(snippets_fts, rowid, name, description, code)
        VALUES ('delete', old.rowid, old.name, old.description, old.code);
        INSERT INTO snippets_fts(rowid, name, description, code)
        VALUES (new.rowid, new.name, new.description, new.code);
      END
    `);

    // Create indexes
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_language ON snippets(language)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_tags ON snippets(tags)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_created_at ON snippets(created_at)`);
  }

  /**
   * Create a new snippet
   */
  createSnippet(input: CreateSnippetInput): Snippet {
    const id = generateId();
    const now = getCurrentTimestamp();
    const tagsJson = JSON.stringify(input.tags || []);

    const stmt = this.db.prepare(`
      INSERT INTO snippets (id, name, language, code, description, tags, created_at, updated_at, usage_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    stmt.run(
      id,
      input.name,
      input.language.toLowerCase(),
      input.code,
      input.description || '',
      tagsJson,
      now,
      now
    );

    return this.getSnippetById(id)!;
  }

  /**
   * Get a snippet by ID
   */
  getSnippetById(id: string): Snippet | null {
    const stmt = this.db.prepare('SELECT * FROM snippets WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToSnippet(row) : null;
  }

  /**
   * Get a snippet by name
   */
  getSnippetByName(name: string): Snippet | null {
    const stmt = this.db.prepare('SELECT * FROM snippets WHERE name = ?');
    const row = stmt.get(name) as any;
    return row ? this.rowToSnippet(row) : null;
  }

  /**
   * Update a snippet
   */
  updateSnippet(id: string, input: UpdateSnippetInput): Snippet | null {
    const existing = this.getSnippetById(id);
    if (!existing) return null;

    const now = getCurrentTimestamp();
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.language !== undefined) {
      updates.push('language = ?');
      values.push(input.language.toLowerCase());
    }
    if (input.code !== undefined) {
      updates.push('code = ?');
      values.push(input.code);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(input.tags));
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE snippets SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    return this.getSnippetById(id);
  }

  /**
   * Delete a snippet
   */
  deleteSnippet(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM snippets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Increment usage count
   */
  incrementUsage(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE snippets SET usage_count = usage_count + 1 WHERE id = ?
    `);
    stmt.run(id);
  }

  /**
   * Search snippets using full-text search
   */
  searchSnippets(query: string, limit: number = 10): SearchResult[] {
    // Use FTS5 for text search
    const stmt = this.db.prepare(`
      SELECT s.*, rank
      FROM snippets s
      JOIN snippets_fts fts ON s.rowid = fts.rowid
      WHERE snippets_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `);

    const rows = stmt.all(query, limit) as any[];
    return rows.map(row => ({
      snippet: this.rowToSnippet(row),
      score: 1 / (1 + Math.abs(row.rank || 0))
    }));
  }

  /**
   * Get all snippets with optional filtering
   */
  getAllSnippets(options?: {
    language?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Snippet[] {
    let sql = 'SELECT * FROM snippets WHERE 1=1';
    const params: any[] = [];

    if (options?.language) {
      sql += ' AND language = ?';
      params.push(options.language.toLowerCase());
    }

    if (options?.tags && options.tags.length > 0) {
      sql += ` AND (${options.tags.map(() => 'tags LIKE ?').join(' OR ')})`;
      options.tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    sql += ' ORDER BY updated_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.rowToSnippet(row));
  }

  /**
   * Get snippets by language
   */
  getSnippetsByLanguage(language: string): Snippet[] {
    return this.getAllSnippets({ language });
  }

  /**
   * Get snippets by tag
   */
  getSnippetsByTag(tag: string): Snippet[] {
    return this.getAllSnippets({ tags: [tag] });
  }

  /**
   * Get all unique languages
   */
  getLanguages(): string[] {
    const stmt = this.db.prepare('SELECT DISTINCT language FROM snippets ORDER BY language');
    const rows = stmt.all() as any[];
    return rows.map(row => row.language);
  }

  /**
   * Get all unique tags
   */
  getTags(): string[] {
    const stmt = this.db.prepare('SELECT tags FROM snippets');
    const rows = stmt.all() as any[];
    const tagSet = new Set<string>();
    
    rows.forEach(row => {
      const tags = JSON.parse(row.tags || '[]') as string[];
      tags.forEach(tag => tagSet.add(tag));
    });
    
    return Array.from(tagSet).sort();
  }

  /**
   * Get database statistics
   */
  getStats(): {
    totalSnippets: number;
    totalLanguages: number;
    totalTags: number;
    mostUsedLanguage: string | null;
    topTags: Array<{ tag: string; count: number }>;
  } {
    const totalSnippets = (this.db.prepare('SELECT COUNT(*) as count FROM snippets').get() as any).count;
    const languages = this.getLanguages();
    const tags = this.getTags();

    // Get most used language
    const languageStmt = this.db.prepare(`
      SELECT language, COUNT(*) as count 
      FROM snippets 
      GROUP BY language 
      ORDER BY count DESC 
      LIMIT 1
    `);
    const mostUsedLang = languageStmt.get() as any;

    // Get top tags
    const tagCounts = new Map<string, number>();
    const allSnippets = this.getAllSnippets();
    allSnippets.forEach(snippet => {
      snippet.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSnippets,
      totalLanguages: languages.length,
      totalTags: tags.length,
      mostUsedLanguage: mostUsedLang?.language || null,
      topTags
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Convert database row to Snippet object
   */
  private rowToSnippet(row: any): Snippet {
    return {
      id: row.id,
      name: row.name,
      language: row.language,
      code: row.code,
      description: row.description,
      tags: JSON.parse(row.tags || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      usageCount: row.usage_count
    };
  }
}
