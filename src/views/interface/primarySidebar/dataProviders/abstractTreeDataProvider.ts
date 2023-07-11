import * as vscode from 'vscode';

import { TreeService } from '../services/treeService';
import { CheckovResult } from '../../../../types';

export abstract class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  public readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private data: TreeItem[] = [];
  private treeService: TreeService;

  constructor() {
    this.treeService = new TreeService();
  }

  abstract getCheckovResults(): CheckovResult[];

  public refresh() {
    const checkovResults = this.getCheckovResults();

    this.data = this.treeService.getTreeData(checkovResults);
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    return element;
  }

  public getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      const a = vscode.ThemeIcon.Folder;
      return this.data;
    }
    return element.children;
  }

  public getItemsAmount(): number {
    return this.data.length;
  }
};

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
};
