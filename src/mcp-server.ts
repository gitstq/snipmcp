/**
 * SnipMCP - MCP Server Implementation
 * Implements the Model Context Protocol for code snippet management
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SnippetDatabase } from './database.js';
import { Snippet, CreateSnippetInput, UpdateSnippetInput } from './types.js';
import { formatSnippet, validateName, validateLanguage } from './utils.js';

export class SnipMCPServer {
  private server: Server;
  private db: SnippetDatabase;

  constructor(dbPath?: string) {
    this.db = new SnippetDatabase(dbPath);
    
    this.server = new Server(
      {
        name: 'snipmcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  /**
   * Setup MCP tool handlers
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'save_snippet',
            description: 'Save a new code snippet with metadata for later retrieval',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Unique name for the snippet'
                },
                language: {
                  type: 'string',
                  description: 'Programming language (e.g., javascript, python, go)'
                },
                code: {
                  type: 'string',
                  description: 'The code content to save'
                },
                description: {
                  type: 'string',
                  description: 'Description of what the snippet does'
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags for categorization'
                }
              },
              required: ['name', 'language', 'code']
            }
          },
          {
            name: 'get_snippet',
            description: 'Retrieve a saved code snippet by its name',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the snippet to retrieve'
                }
              },
              required: ['name']
            }
          },
          {
            name: 'search_snippets',
            description: 'Search for code snippets using keywords',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (searches in name, description, and code)'
                },
                language: {
                  type: 'string',
                  description: 'Filter by programming language'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results (default: 10)'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'list_snippets',
            description: 'List all saved code snippets with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                language: {
                  type: 'string',
                  description: 'Filter by programming language'
                },
                tag: {
                  type: 'string',
                  description: 'Filter by tag'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results (default: 50)'
                }
              }
            }
          },
          {
            name: 'update_snippet',
            description: 'Update an existing code snippet',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Current name of the snippet'
                },
                newName: {
                  type: 'string',
                  description: 'New name for the snippet (optional)'
                },
                language: {
                  type: 'string',
                  description: 'New programming language (optional)'
                },
                code: {
                  type: 'string',
                  description: 'New code content (optional)'
                },
                description: {
                  type: 'string',
                  description: 'New description (optional)'
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'New tags (optional)'
                }
              },
              required: ['name']
            }
          },
          {
            name: 'delete_snippet',
            description: 'Delete a code snippet by name',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the snippet to delete'
                }
              },
              required: ['name']
            }
          },
          {
            name: 'get_stats',
            description: 'Get statistics about your snippet collection',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_languages',
            description: 'Get list of all programming languages in your collection',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_tags',
            description: 'Get list of all tags in your collection',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ] as Tool[]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'save_snippet':
            return await this.handleSaveSnippet(args as any);
          case 'get_snippet':
            return await this.handleGetSnippet(args as any);
          case 'search_snippets':
            return await this.handleSearchSnippets(args as any);
          case 'list_snippets':
            return await this.handleListSnippets(args as any);
          case 'update_snippet':
            return await this.handleUpdateSnippet(args as any);
          case 'delete_snippet':
            return await this.handleDeleteSnippet(args as any);
          case 'get_stats':
            return await this.handleGetStats();
          case 'get_languages':
            return await this.handleGetLanguages();
          case 'get_tags':
            return await this.handleGetTags();
          default:
            return {
              content: [{ type: 'text', text: `Unknown tool: ${name}` }],
              isError: true
            };
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    });
  }

  /**
   * Handle save_snippet tool
   */
  private async handleSaveSnippet(args: {
    name: string;
    language: string;
    code: string;
    description?: string;
    tags?: string[];
  }) {
    // Validate inputs
    const nameValidation = validateName(args.name);
    if (!nameValidation.valid) {
      return {
        content: [{ type: 'text', text: `Validation error: ${nameValidation.error}` }],
        isError: true
      };
    }

    const langValidation = validateLanguage(args.language);
    if (!langValidation.valid) {
      return {
        content: [{ type: 'text', text: `Validation error: ${langValidation.error}` }],
        isError: true
      };
    }

    // Check if snippet with same name exists
    const existing = this.db.getSnippetByName(args.name);
    if (existing) {
      return {
        content: [{ type: 'text', text: `A snippet with name "${args.name}" already exists. Use update_snippet to modify it.` }],
        isError: true
      };
    }

    const input: CreateSnippetInput = {
      name: args.name.trim(),
      language: args.language.toLowerCase(),
      code: args.code,
      description: args.description || '',
      tags: args.tags || []
    };

    const snippet = this.db.createSnippet(input);

    return {
      content: [{
        type: 'text',
        text: `✅ Snippet saved successfully!\n\n${formatSnippet(snippet)}`
      }]
    };
  }

  /**
   * Handle get_snippet tool
   */
  private async handleGetSnippet(args: { name: string }) {
    const snippet = this.db.getSnippetByName(args.name);
    
    if (!snippet) {
      return {
        content: [{ type: 'text', text: `❌ Snippet "${args.name}" not found.` }],
        isError: true
      };
    }

    // Increment usage count
    this.db.incrementUsage(snippet.id);

    return {
      content: [{
        type: 'text',
        text: formatSnippet({
          name: snippet.name,
          language: snippet.language,
          description: snippet.description,
          tags: snippet.tags,
          code: snippet.code
        })
      }]
    };
  }

  /**
   * Handle search_snippets tool
   */
  private async handleSearchSnippets(args: {
    query: string;
    language?: string;
    limit?: number;
  }) {
    const limit = args.limit || 10;
    let results = this.db.searchSnippets(args.query, limit);

    // Filter by language if specified
    if (args.language) {
      results = results.filter(r => 
        r.snippet.language === args.language?.toLowerCase()
      );
    }

    if (results.length === 0) {
      return {
        content: [{ type: 'text', text: `🔍 No snippets found matching "${args.query}".` }]
      };
    }

    const output = results.map((result, index) => {
      const snippet = result.snippet;
      return `${index + 1}. ${snippet.name} (${snippet.language})\n   ${snippet.description || 'No description'}\n   Tags: ${snippet.tags.join(', ') || 'none'}`;
    }).join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `🔍 Found ${results.length} snippet(s) matching "${args.query}":\n\n${output}\n\nUse get_snippet with the name to view the full code.`
      }]
    };
  }

  /**
   * Handle list_snippets tool
   */
  private async handleListSnippets(args: {
    language?: string;
    tag?: string;
    limit?: number;
  }) {
    const limit = args.limit || 50;
    
    let snippets: Snippet[];
    if (args.tag) {
      snippets = this.db.getSnippetsByTag(args.tag);
    } else {
      snippets = this.db.getAllSnippets({ 
        language: args.language, 
        limit 
      });
    }

    if (snippets.length === 0) {
      const filterMsg = args.language ? ` for language "${args.language}"` : args.tag ? ` for tag "${args.tag}"` : '';
      return {
        content: [{ type: 'text', text: `📭 No snippets found${filterMsg}.` }]
      };
    }

    const output = snippets.map((snippet, index) => {
      return `${index + 1}. ${snippet.name} (${snippet.language})\n   ${snippet.description || 'No description'}\n   Tags: ${snippet.tags.join(', ') || 'none'}`;
    }).join('\n\n');

    const filterMsg = args.language ? ` (language: ${args.language})` : args.tag ? ` (tag: ${args.tag})` : '';
    return {
      content: [{
        type: 'text',
        text: `📋 Showing ${snippets.length} snippet(s)${filterMsg}:\n\n${output}\n\nUse get_snippet with the name to view the full code.`
      }]
    };
  }

  /**
   * Handle update_snippet tool
   */
  private async handleUpdateSnippet(args: {
    name: string;
    newName?: string;
    language?: string;
    code?: string;
    description?: string;
    tags?: string[];
  }) {
    const existing = this.db.getSnippetByName(args.name);
    if (!existing) {
      return {
        content: [{ type: 'text', text: `❌ Snippet "${args.name}" not found.` }],
        isError: true
      };
    }

    // Validate new name if provided
    if (args.newName) {
      const nameValidation = validateName(args.newName);
      if (!nameValidation.valid) {
        return {
          content: [{ type: 'text', text: `Validation error: ${nameValidation.error}` }],
          isError: true
        };
      }
    }

    // Validate language if provided
    if (args.language) {
      const langValidation = validateLanguage(args.language);
      if (!langValidation.valid) {
        return {
          content: [{ type: 'text', text: `Validation error: ${langValidation.error}` }],
          isError: true
        };
      }
    }

    const input: UpdateSnippetInput = {};
    if (args.newName) input.name = args.newName;
    if (args.language) input.language = args.language;
    if (args.code) input.code = args.code;
    if (args.description !== undefined) input.description = args.description;
    if (args.tags) input.tags = args.tags;

    const updated = this.db.updateSnippet(existing.id, input);

    return {
      content: [{
        type: 'text',
        text: `✅ Snippet updated successfully!\n\n${formatSnippet(updated!)}`
      }]
    };
  }

  /**
   * Handle delete_snippet tool
   */
  private async handleDeleteSnippet(args: { name: string }) {
    const existing = this.db.getSnippetByName(args.name);
    if (!existing) {
      return {
        content: [{ type: 'text', text: `❌ Snippet "${args.name}" not found.` }],
        isError: true
      };
    }

    this.db.deleteSnippet(existing.id);

    return {
      content: [{
        type: 'text',
        text: `🗑️ Snippet "${args.name}" has been deleted.`
      }]
    };
  }

  /**
   * Handle get_stats tool
   */
  private async handleGetStats() {
    const stats = this.db.getStats();

    const output = `
📊 Snippet Collection Statistics

Total Snippets: ${stats.totalSnippets}
Total Languages: ${stats.totalLanguages}
Total Tags: ${stats.totalTags}
Most Used Language: ${stats.mostUsedLanguage || 'N/A'}

🏷️ Top Tags:
${stats.topTags.map(t => `  • ${t.tag}: ${t.count} snippet(s)`).join('\n') || '  No tags yet'}
    `.trim();

    return {
      content: [{ type: 'text', text: output }]
    };
  }

  /**
   * Handle get_languages tool
   */
  private async handleGetLanguages() {
    const languages = this.db.getLanguages();

    if (languages.length === 0) {
      return {
        content: [{ type: 'text', text: '📭 No snippets found. Start by saving some snippets!' }]
      };
    }

    const output = languages.map((lang, index) => `${index + 1}. ${lang}`).join('\n');

    return {
      content: [{
        type: 'text',
        text: `💻 Programming Languages in your collection (${languages.length}):\n\n${output}`
      }]
    };
  }

  /**
   * Handle get_tags tool
   */
  private async handleGetTags() {
    const tags = this.db.getTags();

    if (tags.length === 0) {
      return {
        content: [{ type: 'text', text: '📭 No tags found. Start tagging your snippets!' }]
      };
    }

    const output = tags.map((tag, index) => `${index + 1}. ${tag}`).join('\n');

    return {
      content: [{
        type: 'text',
        text: `🏷️ Tags in your collection (${tags.length}):\n\n${output}`
      }]
    };
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SnipMCP server running on stdio');
  }

  /**
   * Close the server and database
   */
  close(): void {
    this.db.close();
  }
}
