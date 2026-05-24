#!/usr/bin/env node
/**
 * SnipMCP - Main Entry Point
 * MCP Server for intelligent code snippet management
 */

import { SnipMCPServer } from './mcp-server.js';

async function main() {
  const server = new SnipMCPServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.error('\nShutting down SnipMCP server...');
    server.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.error('\nShutting down SnipMCP server...');
    server.close();
    process.exit(0);
  });

  // Start server
  await server.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
