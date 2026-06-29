import * as vscode from 'vscode'
import { MarkdownTreeProvider } from './treeView'
import { MarkdownPreviewProvider } from './preview'

export function activate(context: vscode.ExtensionContext) {
  const treeProvider = new MarkdownTreeProvider()
  const previewProvider = new MarkdownPreviewProvider()

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('markdownTree', treeProvider),
    vscode.commands.registerCommand('markdownTree.refresh', () => treeProvider.refresh()),
    vscode.commands.registerCommand('markdownTree.openPreview', (fileUri: vscode.Uri) => {
      previewProvider.show(fileUri)
    }),
    vscode.workspace.onDidCreateFiles(() => treeProvider.refresh()),
    vscode.workspace.onDidDeleteFiles(() => treeProvider.refresh()),
    vscode.workspace.onDidRenameFiles(() => treeProvider.refresh()),
  )

  treeProvider.refresh()
}

export function deactivate() {}
