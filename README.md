# weather-server MCP Server

A Model Context Protocol server

This is a TypeScript-based MCP server that implements a simple notes system. It demonstrates core MCP concepts by providing:

- Resources representing text notes with URIs and metadata
- Tools for creating new notes
- Prompts for generating summaries of notes

## Features

### Resources

- List and access notes via `note://` URIs
- Each note has a title, content and metadata
- Plain text mime type for simple content access

### Tools

- `create_note` - Create new text notes
  - Takes title and content as required parameters
  - Stores note in server state

### Prompts

- `summarize_notes` - Generate a summary of all stored notes
  - Includes all note contents as embedded resources
  - Returns structured prompt for LLM summarization

## Development

Install dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run watch
```

## Installation

Load up a Datastax collection with the monster data.

Get the Datastax Astra DB API endpoint and token from the Astra DB UI.

Run `pnpm install` to install the dependencies.

Run `pnpm run build` to build the server.

Edit the `claude_desktop_config.json` file to add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "monster-server": {
      "name": "monster-server",
      "command": "[path to node]",
      "args": ["[path to this repo]/build/index.js"],
      "env": {
        "ASTRA_DB_API_ENDPOINT": "https://[dbname].apps.astra.datastax.com",
        "ASTRA_DB_APPLICATION_TOKEN": "[token]"
      }
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

You will need to set the `ASTRA_DB_API_ENDPOINT` and `ASTRA_DB_APPLICATION_TOKEN` environment variables in the inspector UI.
