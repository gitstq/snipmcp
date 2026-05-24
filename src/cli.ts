#!/usr/bin/env node
/**
 * SnipMCP - CLI Interface
 * Command-line interface for managing snippets directly
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SnippetDatabase } from './database.js';
import { formatSnippet, parseTags } from './utils.js';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();
const db = new SnippetDatabase();

program
  .name('snipmcp')
  .description('🚀 SnipMCP - Intelligent code snippet management')
  .version('1.0.0');

// Add snippet command
program
  .command('add')
  .description('Add a new code snippet')
  .requiredOption('-n, --name <name>', 'Snippet name')
  .requiredOption('-l, --language <language>', 'Programming language')
  .requiredOption('-c, --code <code>', 'Code content or file path')
  .option('-d, --description <description>', 'Snippet description')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('-f, --file', 'Treat code as file path')
  .action((options) => {
    const spinner = ora('Saving snippet...').start();
    
    try {
      let code = options.code;
      
      // Read from file if --file flag is set
      if (options.file) {
        if (!fs.existsSync(options.code)) {
          spinner.fail(`File not found: ${options.code}`);
          return;
        }
        code = fs.readFileSync(options.code, 'utf-8');
      }

      const snippet = db.createSnippet({
        name: options.name,
        language: options.language,
        code,
        description: options.description || '',
        tags: options.tags ? parseTags(options.tags) : []
      });

      spinner.succeed('Snippet saved successfully!');
      console.log('\n' + formatSnippet(snippet));
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// Get snippet command
program
  .command('get <name>')
  .description('Get a snippet by name')
  .option('-c, --copy', 'Copy to clipboard (requires xclip or pbcopy)')
  .action((name, _options) => {
    const snippet = db.getSnippetByName(name);
    
    if (!snippet) {
      console.log(chalk.red(`❌ Snippet "${name}" not found.`));
      return;
    }

    db.incrementUsage(snippet.id);
    console.log(formatSnippet(snippet));
  });

// Search snippets command
program
  .command('search <query>')
  .description('Search snippets')
  .option('-l, --language <language>', 'Filter by language')
  .option('-n, --limit <number>', 'Limit results', '10')
  .action((query, options) => {
    const spinner = ora('Searching...').start();
    
    try {
      let results = db.searchSnippets(query, parseInt(options.limit));
      
      if (options.language) {
        results = results.filter(r => r.snippet.language === options.language.toLowerCase());
      }

      spinner.stop();

      if (results.length === 0) {
        console.log(chalk.yellow(`🔍 No snippets found matching "${query}".`));
        return;
      }

      console.log(chalk.blue(`🔍 Found ${results.length} snippet(s):\n`));
      results.forEach((result, index) => {
        const snippet = result.snippet;
        console.log(`${chalk.cyan(`${index + 1}. ${snippet.name}`)} ${chalk.gray(`(${snippet.language})`)}`);
        console.log(`   ${snippet.description || chalk.gray('No description')}`);
        console.log(`   ${chalk.gray('Tags:')} ${snippet.tags.join(', ') || chalk.gray('none')}\n`);
      });
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// List snippets command
program
  .command('list')
  .description('List all snippets')
  .option('-l, --language <language>', 'Filter by language')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('-n, --limit <number>', 'Limit results', '50')
  .action((options) => {
    let snippets;
    
    if (options.tag) {
      snippets = db.getSnippetsByTag(options.tag);
    } else {
      snippets = db.getAllSnippets({
        language: options.language,
        limit: parseInt(options.limit)
      });
    }

    if (snippets.length === 0) {
      const filter = options.language ? ` for language "${options.language}"` : options.tag ? ` for tag "${options.tag}"` : '';
      console.log(chalk.yellow(`📭 No snippets found${filter}.`));
      return;
    }

    const filter = options.language ? ` (language: ${options.language})` : options.tag ? ` (tag: ${options.tag})` : '';
    console.log(chalk.blue(`📋 Showing ${snippets.length} snippet(s)${filter}:\n`));
    
    snippets.forEach((snippet, index) => {
      console.log(`${chalk.cyan(`${index + 1}. ${snippet.name}`)} ${chalk.gray(`(${snippet.language})`)}`);
      console.log(`   ${snippet.description || chalk.gray('No description')}`);
      console.log(`   ${chalk.gray('Tags:')} ${snippet.tags.join(', ') || chalk.gray('none')}\n`);
    });
  });

// Update snippet command
program
  .command('update <name>')
  .description('Update an existing snippet')
  .option('-N, --new-name <name>', 'New name')
  .option('-l, --language <language>', 'New language')
  .option('-c, --code <code>', 'New code content')
  .option('-d, --description <description>', 'New description')
  .option('-t, --tags <tags>', 'New comma-separated tags')
  .action((name, options) => {
    const spinner = ora('Updating snippet...').start();
    
    try {
      const existing = db.getSnippetByName(name);
      if (!existing) {
        spinner.fail(`Snippet "${name}" not found.`);
        return;
      }

      const update: any = {};
      if (options.newName) update.name = options.newName;
      if (options.language) update.language = options.language;
      if (options.code) update.code = options.code;
      if (options.description !== undefined) update.description = options.description;
      if (options.tags) update.tags = parseTags(options.tags);

      const updated = db.updateSnippet(existing.id, update);
      spinner.succeed('Snippet updated successfully!');
      console.log('\n' + formatSnippet(updated!));
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// Delete snippet command
program
  .command('delete <name>')
  .description('Delete a snippet')
  .option('-y, --yes', 'Skip confirmation')
  .action((name, options) => {
    const existing = db.getSnippetByName(name);
    if (!existing) {
      console.log(chalk.red(`❌ Snippet "${name}" not found.`));
      return;
    }

    if (!options.yes) {
      console.log(chalk.yellow(`⚠️  Are you sure you want to delete "${name}"?`));
      console.log('Use --yes to confirm.');
      return;
    }

    db.deleteSnippet(existing.id);
    console.log(chalk.green(`🗑️  Snippet "${name}" has been deleted.`));
  });

// Stats command
program
  .command('stats')
  .description('Show collection statistics')
  .action(() => {
    const stats = db.getStats();
    
    console.log(chalk.blue('📊 Snippet Collection Statistics\n'));
    console.log(`${chalk.cyan('Total Snippets:')} ${stats.totalSnippets}`);
    console.log(`${chalk.cyan('Total Languages:')} ${stats.totalLanguages}`);
    console.log(`${chalk.cyan('Total Tags:')} ${stats.totalTags}`);
    console.log(`${chalk.cyan('Most Used Language:')} ${stats.mostUsedLanguage || 'N/A'}\n`);
    
    if (stats.topTags.length > 0) {
      console.log(chalk.blue('🏷️  Top Tags:'));
      stats.topTags.forEach(t => {
        console.log(`  • ${t.tag}: ${t.count} snippet(s)`);
      });
    }
  });

// Languages command
program
  .command('languages')
  .description('List all programming languages')
  .action(() => {
    const languages = db.getLanguages();
    
    if (languages.length === 0) {
      console.log(chalk.yellow('📭 No snippets found. Start by saving some snippets!'));
      return;
    }

    console.log(chalk.blue(`💻 Programming Languages (${languages.length}):\n`));
    languages.forEach((lang, index) => {
      console.log(`${index + 1}. ${lang}`);
    });
  });

// Tags command
program
  .command('tags')
  .description('List all tags')
  .action(() => {
    const tags = db.getTags();
    
    if (tags.length === 0) {
      console.log(chalk.yellow('📭 No tags found. Start tagging your snippets!'));
      return;
    }

    console.log(chalk.blue(`🏷️  Tags (${tags.length}):\n`));
    tags.forEach((tag, index) => {
      console.log(`${index + 1}. ${tag}`);
    });
  });

// Export command
program
  .command('export <file>')
  .description('Export snippets to JSON file')
  .action((file) => {
    const spinner = ora('Exporting snippets...').start();
    
    try {
      const snippets = db.getAllSnippets();
      const data = JSON.stringify(snippets, null, 2);
      fs.writeFileSync(file, data);
      spinner.succeed(`Exported ${snippets.length} snippets to ${file}`);
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// Import command
program
  .command('import <file>')
  .description('Import snippets from JSON file')
  .action((file) => {
    const spinner = ora('Importing snippets...').start();
    
    try {
      if (!fs.existsSync(file)) {
        spinner.fail(`File not found: ${file}`);
        return;
      }

      const data = fs.readFileSync(file, 'utf-8');
      const snippets = JSON.parse(data);
      
      let imported = 0;
      let skipped = 0;

      for (const snippet of snippets) {
        const existing = db.getSnippetByName(snippet.name);
        if (existing) {
          skipped++;
          continue;
        }

        db.createSnippet({
          name: snippet.name,
          language: snippet.language,
          code: snippet.code,
          description: snippet.description || '',
          tags: snippet.tags || []
        });
        imported++;
      }

      spinner.succeed(`Imported ${imported} snippets, skipped ${skipped} duplicates.`);
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// Config command
program
  .command('config')
  .description('Show configuration info')
  .action(() => {
    const os = require('os');
    const dataDir = path.join(os.homedir(), '.snipmcp');
    
    console.log(chalk.blue('⚙️  SnipMCP Configuration\n'));
    console.log(`${chalk.cyan('Data Directory:')} ${dataDir}`);
    console.log(`${chalk.cyan('Database File:')} ${path.join(dataDir, 'snippets.db')}`);
    console.log(`\n${chalk.gray('To use with Claude Desktop or other MCP clients, add the following to your config:')}\n`);
    console.log(chalk.green(JSON.stringify({
      "mcpServers": {
        "snipmcp": {
          "command": "npx",
          "args": ["snipmcp"]
        }
      }
    }, null, 2)));
  });

program.parse();
