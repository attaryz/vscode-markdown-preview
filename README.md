# Markdown Tree View

A VS Code extension that lists and previews markdown files in a dedicated sidebar panel.

## Features

- **Tree view** of all `.md` files in your workspace, organized by directory
- **Live preview** with Markdown rendering (using [marked](https://github.com/markedjs/marked))
- **Dark/light theme toggle** in the preview panel (auto-detects VS Code theme)
- **Mermaid diagram** support — renders `.mermaid` code blocks inline
- **Auto-refresh** when files are created, deleted, or renamed
- **Manual refresh** button in the sidebar title bar

## Usage

1. Open a workspace containing markdown files
2. Click the **Markdown Files** icon in the activity bar
3. Browse the tree and click a file to open its preview
4. Use the sun/moon icon to toggle between dark and light modes

## Commands

| Command | Description |
|---|---|
| `Refresh` | Re-scans the workspace for markdown files |
| `Open Preview` | Opens the selected file in the preview panel |

## Install from VSIX

```bash
code --install-extension vscode-markdown-tree-0.0.1.vsix
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Lint (type check)
npm run lint
```

## License

MIT
