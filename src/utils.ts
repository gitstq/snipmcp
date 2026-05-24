/**
 * SnipMCP - Utility Functions
 */

import { randomBytes, createHash } from 'crypto';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Calculate simple similarity score between two strings
 * Uses Jaccard similarity on word sets
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format code for display
 */
export function formatCode(code: string, maxLines: number = 20): string {
  const lines = code.split('\n');
  if (lines.length <= maxLines) return code;
  
  return lines.slice(0, maxLines).join('\n') + '\n... (truncated)';
}

/**
 * Detect programming language from file extension or content
 */
export function detectLanguage(filename: string, _content?: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const extensionMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'go': 'go',
    'rs': 'rust',
    'cpp': 'cpp',
    'cc': 'cpp',
    'c': 'c',
    'h': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'sql': 'sql',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'md': 'markdown',
    'sh': 'shell',
    'bash': 'bash',
    'ps1': 'powershell',
    'dockerfile': 'dockerfile',
    'nginx': 'nginx',
    'graphql': 'graphql',
    'gql': 'graphql'
  };
  
  return extensionMap[ext] || 'other';
}

/**
 * Validate snippet name
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Name cannot exceed 100 characters' };
  }
  if (!/^[a-zA-Z0-9_\-\s]+$/.test(name)) {
    return { valid: false, error: 'Name can only contain letters, numbers, spaces, underscores, and hyphens' };
  }
  return { valid: true };
}

/**
 * Validate language
 */
export function validateLanguage(language: string): { valid: boolean; error?: string } {
  const validLanguages = [
    'javascript', 'typescript', 'python', 'java', 'go', 'rust',
    'cpp', 'c', 'csharp', 'php', 'ruby', 'swift', 'kotlin',
    'sql', 'html', 'css', 'scss', 'json', 'yaml', 'xml',
    'markdown', 'shell', 'bash', 'powershell', 'dockerfile',
    'nginx', 'graphql', 'regex', 'other'
  ];
  
  if (!validLanguages.includes(language.toLowerCase())) {
    return { valid: false, error: `Unsupported language: ${language}` };
  }
  return { valid: true };
}

/**
 * Parse tags from string or array
 */
export function parseTags(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input.map(t => t.trim().toLowerCase()).filter(Boolean);
  }
  return input
    .split(/[,;\s]+/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Format snippet for display
 */
export function formatSnippet(snippet: {
  name: string;
  language: string;
  description?: string;
  tags?: string[];
  code?: string;
}): string {
  let output = `📌 ${snippet.name}\n`;
  output += `   Language: ${snippet.language}\n`;
  if (snippet.description) {
    output += `   Description: ${snippet.description}\n`;
  }
  if (snippet.tags && snippet.tags.length > 0) {
    output += `   Tags: ${snippet.tags.join(', ')}\n`;
  }
  if (snippet.code) {
    output += `\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n`;
  }
  return output;
}

/**
 * Create a hash of content for deduplication
 */
export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}
