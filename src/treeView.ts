import * as vscode from 'vscode'
import * as path from 'path'

export class MarkdownFile extends vscode.TreeItem {
  constructor(public uri: vscode.Uri) {
    super(path.basename(uri.fsPath))
    this.command = {
      command: 'markdownTree.openPreview',
      title: 'Open Preview',
      arguments: [uri],
    }
    this.contextValue = 'markdownFile'
    this.iconPath = vscode.ThemeIcon.File
  }
}

export class MarkdownDirectory extends vscode.TreeItem {
  constructor(
    public label: string,
    public collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState)
    this.contextValue = 'markdownDirectory'
    this.iconPath = vscode.ThemeIcon.Folder
  }
}

type TreeNode = MarkdownDirectory | MarkdownFile

interface DirNode {
  dir: MarkdownDirectory
  children: Map<string, DirNode>
  files: MarkdownFile[]
}

export class MarkdownTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  private rootFiles: MarkdownFile[] = []
  private rootDirs: Map<string, DirNode> = new Map()

  async refresh() {
    await this.buildTree()
    this._onDidChangeTreeData.fire(undefined)
  }

  private async buildTree() {
    this.rootFiles = []
    this.rootDirs = new Map()

    const wsFolders = vscode.workspace.workspaceFolders
    if (!wsFolders) return

    const mdFiles = await vscode.workspace.findFiles('**/*.md', '**/node_modules/**')
    const root = wsFolders[0].uri.fsPath

    for (const uri of mdFiles) {
      const parts = path.relative(root, uri.fsPath).split(path.sep)
      if (parts.length === 1) {
        this.rootFiles.push(new MarkdownFile(uri))
      } else {
        this.insertFile(parts, uri)
      }
    }
  }

  private insertFile(parts: string[], uri: vscode.Uri) {
    let level = this.rootDirs
    let parentNode: DirNode | undefined
    for (let i = 0; i < parts.length - 1; i++) {
      const name = parts[i]
      if (!level.has(name)) {
        level.set(name, {
          dir: new MarkdownDirectory(name, vscode.TreeItemCollapsibleState.Collapsed),
          children: new Map(),
          files: [],
        })
      }
      parentNode = level.get(name)!
      level = parentNode.children
    }
    parentNode?.files.push(new MarkdownFile(uri))
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element
  }

  private sortNodes<T extends TreeNode>(nodes: T[]): T[] {
    return nodes.sort((a, b) => a.label!.toString().localeCompare(b.label!.toString()))
  }

  getChildren(element?: TreeNode): TreeNode[] {
    if (!element) {
      const dirs = this.sortNodes(Array.from(this.rootDirs.values()).map(n => n.dir))
      const files = this.sortNodes(this.rootFiles)
      return [...dirs, ...files]
    }
    if (element instanceof MarkdownDirectory) {
      return this.getDirChildren(element)
    }
    return []
  }

  private getDirChildren(dir: MarkdownDirectory): TreeNode[] {
    const node = this.findDirNode(dir, this.rootDirs)
    if (!node) return []

    const subdirs = this.sortNodes(Array.from(node.children.values()).map(n => n.dir))
    const files = this.sortNodes(node.files)
    return [...subdirs, ...files]
  }

  private findDirNode(dir: MarkdownDirectory, map: Map<string, DirNode>): DirNode | undefined {
    for (const [_, node] of map) {
      if (node.dir === dir) return node
      const found = this.findDirNode(dir, node.children)
      if (found) return found
    }
    return undefined
  }
}
