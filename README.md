# 🚀 SnipMCP

<p align="center">
  <strong>A lightweight, local-first MCP (Model Context Protocol) server for intelligent code snippet management</strong>
</p>

<p align="center">
  <a href="#-english">English</a> •
  <a href="#-简体中文">简体中文</a> •
  <a href="#-繁體中文">繁體中文</a>
</p>

---

<h2 id="-english">🇺🇸 English</h2>

### 🎉 Introduction

**SnipMCP** is a lightweight, local-first MCP (Model Context Protocol) server designed for intelligent code snippet management. Unlike cloud-based solutions, SnipMCP stores all your snippets locally using SQLite, ensuring complete privacy and zero latency.

**Key Differentiators:**
- 🔒 **100% Local** - Your code never leaves your machine
- ⚡ **Zero Latency** - Instant access to your snippets
- 🤖 **AI Integration** - Works seamlessly with Claude, Copilot, and other MCP clients
- 🔍 **Full-Text Search** - Powerful SQLite FTS5 search capabilities
- 📦 **Zero Dependencies** - Single binary, no external services required

### ✨ Core Features

| Feature | Description |
|---------|-------------|
| 💾 **Save Snippets** | Store code with metadata, tags, and descriptions |
| 🔍 **Smart Search** | Full-text search across names, descriptions, and code |
| 🏷️ **Tag System** | Organize snippets with flexible tagging |
| 📊 **Statistics** | Track usage and collection insights |
| 🌐 **MCP Protocol** | Native integration with AI assistants |
| 🖥️ **CLI Interface** | Powerful command-line management |

### 🚀 Quick Start

#### Requirements
- **Node.js** >= 18.0.0
- **npm** or **yarn**

#### Installation

```bash
# Install globally
npm install -g snipmcp

# Or use directly with npx
npx snipmcp --help
```

#### MCP Client Configuration

Add SnipMCP to your MCP client (Claude Desktop, Copilot, etc.):

```json
{
  "mcpServers": {
    "snipmcp": {
      "command": "npx",
      "args": ["snipmcp"]
    }
  }
}
```

**For Claude Desktop:**
Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%/Claude/claude_desktop_config.json` (Windows)

### 📖 Usage Guide

#### CLI Commands

```bash
# Add a new snippet
snipmcp add -n "quick-sort" -l "python" -c "def quicksort(arr):..." -d "Fast sorting algorithm" -t "algorithm,sorting"

# Get a snippet
snipmcp get "quick-sort"

# Search snippets
snipmcp search "sorting algorithm"

# List all snippets
snipmcp list

# List by language
snipmcp list --language python

# Update a snippet
snipmcp update "quick-sort" --tags "algorithm,sorting,python"

# Delete a snippet
snipmcp delete "quick-sort" --yes

# Show statistics
snipmcp stats

# Export/Import
snipmcp export backup.json
snipmcp import backup.json
```

#### MCP Tools

When connected to an MCP client, SnipMCP provides these tools:

| Tool | Description |
|------|-------------|
| `save_snippet` | Save a new code snippet |
| `get_snippet` | Retrieve a snippet by name |
| `search_snippets` | Search across all snippets |
| `list_snippets` | List snippets with filters |
| `update_snippet` | Modify existing snippets |
| `delete_snippet` | Remove a snippet |
| `get_stats` | View collection statistics |
| `get_languages` | List all languages |
| `get_tags` | List all tags |

**Example conversation with Claude:**

```
You: Save this Python function for later: [code]
Claude: I'll save that snippet for you. What would you like to name it?

You: Name it "fibonacci" and tag it with "algorithm,math"
Claude: ✅ Snippet saved successfully!

You: Search for my sorting algorithms
Claude: I found 3 snippets matching "sorting":
   1. quick-sort (python)
   2. merge-sort (python)
   3. heap-sort (java)
```

### 💡 Design Philosophy

**Why SnipMCP?**

1. **Privacy First**: Unlike cloud-based snippet managers, your code stays on your machine
2. **AI-Native**: Built for the MCP ecosystem, enabling AI assistants to access your knowledge
3. **Developer Experience**: Fast CLI, powerful search, and seamless integration
4. **Future-Proof**: MCP is becoming the standard for AI tool integration

### 📦 Supported Languages

- JavaScript / TypeScript
- Python
- Java
- Go
- Rust
- C / C++
- C#
- PHP
- Ruby
- Swift
- Kotlin
- SQL
- HTML / CSS / SCSS
- JSON / YAML / XML
- Markdown
- Shell / Bash / PowerShell
- And more...

### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<h2 id="-简体中文">🇨🇳 简体中文</h2>

### 🎉 项目介绍

**SnipMCP** 是一个轻量级、本地优先的 MCP（Model Context Protocol）服务器，专为智能代码片段管理而设计。与基于云的解决方案不同，SnipMCP 使用 SQLite 在本地存储所有代码片段，确保完全的隐私和零延迟。

**核心差异化优势：**
- 🔒 **100% 本地** - 您的代码永远不会离开您的机器
- ⚡ **零延迟** - 即时访问您的代码片段
- 🤖 **AI 集成** - 与 Claude、Copilot 和其他 MCP 客户端无缝协作
- 🔍 **全文搜索** - 强大的 SQLite FTS5 搜索能力
- 📦 **零依赖** - 单一二进制文件，无需外部服务

### ✨ 核心特性

| 特性 | 描述 |
|------|------|
| 💾 **保存代码片段** | 存储带有元数据、标签和描述的代码 |
| 🔍 **智能搜索** | 跨名称、描述和代码的全文搜索 |
| 🏷️ **标签系统** | 使用灵活的标签组织代码片段 |
| 📊 **统计分析** | 跟踪使用情况和收集洞察 |
| 🌐 **MCP 协议** | 与 AI 助手原生集成 |
| 🖥️ **CLI 界面** | 强大的命令行管理工具 |

### 🚀 快速开始

#### 环境要求
- **Node.js** >= 18.0.0
- **npm** 或 **yarn**

#### 安装

```bash
# 全局安装
npm install -g snipmcp

# 或直接使用 npx
npx snipmcp --help
```

#### MCP 客户端配置

将 SnipMCP 添加到您的 MCP 客户端（Claude Desktop、Copilot 等）：

```json
{
  "mcpServers": {
    "snipmcp": {
      "command": "npx",
      "args": ["snipmcp"]
    }
  }
}
```

**Claude Desktop 配置：**
编辑 `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 或 `%APPDATA%/Claude/claude_desktop_config.json` (Windows)

### 📖 使用指南

#### CLI 命令

```bash
# 添加新代码片段
snipmcp add -n "quick-sort" -l "python" -c "def quicksort(arr):..." -d "快速排序算法" -t "algorithm,sorting"

# 获取代码片段
snipmcp get "quick-sort"

# 搜索代码片段
snipmcp search "sorting algorithm"

# 列出所有代码片段
snipmcp list

# 按语言列出
snipmcp list --language python

# 更新代码片段
snipmcp update "quick-sort" --tags "algorithm,sorting,python"

# 删除代码片段
snipmcp delete "quick-sort" --yes

# 显示统计信息
snipmcp stats

# 导出/导入
snipmcp export backup.json
snipmcp import backup.json
```

#### MCP 工具

连接到 MCP 客户端后，SnipMCP 提供以下工具：

| 工具 | 描述 |
|------|------|
| `save_snippet` | 保存新代码片段 |
| `get_snippet` | 按名称检索代码片段 |
| `search_snippets` | 搜索所有代码片段 |
| `list_snippets` | 带过滤器列出代码片段 |
| `update_snippet` | 修改现有代码片段 |
| `delete_snippet` | 删除代码片段 |
| `get_stats` | 查看收集统计信息 |
| `get_languages` | 列出所有语言 |
| `get_tags` | 列出所有标签 |

**与 Claude 对话示例：**

```
您：保存这个 Python 函数供以后使用：[代码]
Claude：我会为您保存那个代码片段。您想给它起什么名字？

您：命名为 "fibonacci"，并标记为 "algorithm,math"
Claude: ✅ 代码片段保存成功！

您：搜索我的排序算法
Claude: 找到 3 个匹配 "sorting" 的代码片段：
   1. quick-sort (python)
   2. merge-sort (python)
   3. heap-sort (java)
```

### 💡 设计理念

**为什么选择 SnipMCP？**

1. **隐私优先**：与基于云的代码片段管理器不同，您的代码保留在您的机器上
2. **AI 原生**：为 MCP 生态系统构建，使 AI 助手能够访问您的知识
3. **开发者体验**：快速 CLI、强大的搜索和无缝集成
4. **面向未来**：MCP 正在成为 AI 工具集成的标准

### 📦 支持的语言

- JavaScript / TypeScript
- Python
- Java
- Go
- Rust
- C / C++
- C#
- PHP
- Ruby
- Swift
- Kotlin
- SQL
- HTML / CSS / SCSS
- JSON / YAML / XML
- Markdown
- Shell / Bash / PowerShell
- 更多...

### 🤝 贡献指南

欢迎贡献！请随时提交 Pull Request。

1. Fork 仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 📄 开源协议

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。