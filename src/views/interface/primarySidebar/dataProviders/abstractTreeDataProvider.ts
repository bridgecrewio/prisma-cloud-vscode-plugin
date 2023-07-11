import * as vscode from 'vscode';
import { Check, TreeService } from '../services/treeService';

export abstract class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private data: TreeItem[];
  private treeService: TreeService;

  constructor() {
    this.treeService = new TreeService();
    const checkovOutput = this.getCheckovDataByType();
    this.data = this.treeService.getTreeData(checkovOutput);
  }

  public refresh() {
    const checkovOutput = this.getCheckovDataByType();
    this.data = this.treeService.getTreeData(checkovOutput);
    this._onDidChangeTreeData.fire();
  }

  abstract getCheckovDataByType(): Array<Check>;

  getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      const a = vscode.ThemeIcon.Folder;
      return this.data;
    }
    return element.children;
  }

  getItemsAmount(): number {
    return this.data.length;
  }
}

export class TreeItem extends vscode.TreeItem {
  children: TreeItem[]|undefined;

  constructor(options: { label: string, iconPath: vscode.ThemeIcon | { light: string, dark: string } }, children?: TreeItem[]) {
    const { label, iconPath } = options;
    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Collapsed
                                 );
    this.children = children;
    this.iconPath = iconPath;
  }
}