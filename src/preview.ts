import * as vscode from 'vscode'
import * as path from 'path'
import { marked } from 'marked'

const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`

const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`

export class MarkdownPreviewProvider {
  private panels: Map<string, vscode.WebviewPanel> = new Map()
  private isDark: boolean = true

  constructor() {
    this.isDark = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark
                 || vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast

    vscode.window.onDidChangeActiveColorTheme(e => {
      this.isDark = e.kind === vscode.ColorThemeKind.Dark
                  || e.kind === vscode.ColorThemeKind.HighContrast
      this.refreshAllPanels()
    })

    vscode.workspace.onDidChangeTextDocument(e => {
      const key = e.document.uri.toString()
      if (this.panels.has(key)) {
        this.refreshPanel(e.document.uri)
      }
    })
  }

  async show(uri: vscode.Uri) {
    const key = uri.toString()

    if (this.panels.has(key)) {
      this.panels.get(key)!.reveal(vscode.ViewColumn.Active)
      return
    }

    const doc = await vscode.workspace.openTextDocument(uri)
    const text = doc.getText()
    const html = await marked.parse(text)
    const fileName = path.basename(uri.fsPath)

    const panel = vscode.window.createWebviewPanel(
      'markdownPreview',
      fileName,
      vscode.ViewColumn.Active,
      { enableScripts: true }
    )

    panel.onDidDispose(() => {
      this.panels.delete(key)
    })

    panel.webview.onDidReceiveMessage(msg => {
      if (msg.type === 'toggleTheme') {
        this.isDark = !this.isDark
        this.refreshPanel(uri)
      }
    })

    panel.webview.html = this.renderHtml(html, fileName)
    this.panels.set(key, panel)
  }

  private async refreshPanel(uri: vscode.Uri) {
    const key = uri.toString()
    const panel = this.panels.get(key)
    if (!panel) return

    const doc = await vscode.workspace.openTextDocument(uri)
    const text = doc.getText()
    const html = await marked.parse(text)
    const fileName = path.basename(uri.fsPath)
    panel.webview.html = this.renderHtml(html, fileName)
  }

  private refreshAllPanels() {
    for (const [key] of this.panels) {
      const uri = vscode.Uri.parse(key)
      this.refreshPanel(uri)
    }
  }

  private renderHtml(body: string, title: string): string {
    const theme = this.isDark ? 'dark' : 'light'
    return `<!DOCTYPE html>
<html lang="en" class="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg: ${this.isDark ? '#1e1e1e' : '#ffffff'};
      --text: ${this.isDark ? '#d4d4d4' : '#24292f'};
      --border: ${this.isDark ? '#404040' : '#d0d7de'};
      --code-bg: ${this.isDark ? '#2d2d2d' : '#f6f8fa'};
      --blockquote-border: ${this.isDark ? '#404040' : '#d0d7de'};
      --blockquote-text: ${this.isDark ? '#969696' : '#656d76'};
      --th-bg: ${this.isDark ? '#2d2d2d' : '#f6f8fa'};
      --link: ${this.isDark ? '#58a6ff' : '#0969da'};
      --heading: ${this.isDark ? '#e6e6e6' : '#1f2328'};
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
      background: var(--bg);
      color: var(--text);
    }
    .toolbar {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    .toolbar button {
      background: var(--code-bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .toolbar button {
      background: none;
      border: none;
      color: var(--text);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      line-height: 0;
    }
    .toolbar button:hover {
      background: var(--code-bg);
    }
    .toolbar svg {
      width: 18px;
      height: 18px;
    }
    h1, h2, h3, h4, h5, h6 { color: var(--heading); }
    a { color: var(--link); }
    img { max-width: 100%; }
    pre {
      background: var(--code-bg);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      border: 1px solid var(--border);
    }
    code {
      background: var(--code-bg);
      padding: 2px 4px;
      border-radius: 2px;
      font-size: 0.9em;
    }
    pre code { background: none; padding: 0; border-radius: 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid var(--border); padding: 8px; text-align: left; }
    th { background: var(--th-bg); }
    blockquote {
      border-left: 4px solid var(--blockquote-border);
      margin: 0;
      padding-left: 16px;
      color: var(--blockquote-text);
    }
    hr { border: none; border-top: 1px solid var(--border); }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="toggleTheme()" title="Toggle ${this.isDark ? 'Light' : 'Dark'} Mode">${this.isDark ? sunIcon : moonIcon}</button>
  </div>
  ${body}
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script>
    const vscode = acquireVsCodeApi();
    function toggleTheme() {
      vscode.postMessage({ type: 'toggleTheme' });
    }
    document.addEventListener('DOMContentLoaded', () => {
      mermaid.initialize({ startOnLoad: false, theme: '${this.isDark ? 'dark' : 'default'}' });
      mermaid.run({ querySelector: '.language-mermaid' });
    });
  </script>
</body>
</html>`
  }
}
