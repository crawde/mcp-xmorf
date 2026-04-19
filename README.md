# mcp-xmorf

MCP server for [xmorf](https://xmorf.com) — AI image editing and generation API.

## Tools

| Tool | Description |
|------|-------------|
| `xmorf_edit_image` | Edit images with natural language prompts (8 AI models) |
| `xmorf_generate_image` | Generate images from text descriptions |
| `xmorf_list_models` | List available editing models |

### Edit Models

| Model | Description |
|-------|-------------|
| `standard` | General-purpose AI image editing |
| `enhance` | Enhance realism / anything-to-real |
| `upscale` | Upscale and improve resolution |
| `shadow` | Light & shadow migration (needs reference image) |
| `kiss` | Passionate kiss effect (needs reference image) |
| `skin` | Skin editing and retouching |
| `angles` | Multi-angle view generation |
| `scene` | Scene change / next-scene generation |

## Setup

Get an API token from [xmorf.com](https://xmorf.com).

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "xmorf": {
      "command": "npx",
      "args": ["-y", "mcp-xmorf"],
      "env": {
        "XMORF_API_TOKEN": "xmorf_your_token_here"
      }
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "xmorf": {
      "command": "npx",
      "args": ["-y", "mcp-xmorf"],
      "env": {
        "XMORF_API_TOKEN": "xmorf_your_token_here"
      }
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "xmorf": {
      "command": "npx",
      "args": ["-y", "mcp-xmorf"],
      "env": {
        "XMORF_API_TOKEN": "xmorf_your_token_here"
      }
    }
  }
}
```

## Usage Examples

### Edit an image

```
Edit this photo to remove the background
```

The `xmorf_edit_image` tool accepts file paths, data URLs, or raw base64 as input. You can optionally specify an output path to save the result to disk.

### Generate an image

```
Generate a watercolor painting of a mountain landscape at dawn
```

### List models

```
What image editing models are available on xmorf?
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `XMORF_API_TOKEN` | Yes | Your xmorf API bearer token |

## API Reference

See the full API docs at [xmorf.com/docs](https://xmorf.com/docs).

## License

MIT
