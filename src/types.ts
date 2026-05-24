/**
 * SnipMCP - Type Definitions
 * Core types for the code snippet management system
 */

/**
 * Represents a code snippet with metadata
 */
export interface Snippet {
  /** Unique identifier */
  id: string;
  /** Snippet name/title */
  name: string;
  /** Programming language */
  language: string;
  /** Code content */
  code: string;
  /** Description of what the snippet does */
  description: string;
  /** Tags for categorization */
  tags: string[];
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Usage count */
  usageCount: number;
}

/**
 * Input for creating a new snippet
 */
export interface CreateSnippetInput {
  name: string;
  language: string;
  code: string;
  description?: string;
  tags?: string[];
}

/**
 * Input for updating an existing snippet
 */
export interface UpdateSnippetInput {
  name?: string;
  language?: string;
  code?: string;
  description?: string;
  tags?: string[];
}

/**
 * Search query parameters
 */
export interface SearchQuery {
  /** Text to search in name, description, and code */
  query?: string;
  /** Filter by programming language */
  language?: string;
  /** Filter by tags */
  tags?: string[];
  /** Maximum results to return */
  limit?: number;
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  snippet: Snippet;
  score: number;
}

/**
 * Snippet statistics
 */
export interface SnippetStats {
  totalSnippets: number;
  totalLanguages: number;
  totalTags: number;
  mostUsedLanguage: string;
  topTags: Array<{ tag: string; count: number }>;
}

/**
 * MCP Tool response
 */
export interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Supported programming languages
 */
export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'go',
  'rust',
  'cpp',
  'c',
  'csharp',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'sql',
  'html',
  'css',
  'scss',
  'json',
  'yaml',
  'xml',
  'markdown',
  'shell',
  'bash',
  'powershell',
  'dockerfile',
  'nginx',
  'graphql',
  'regex',
  'other'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
