import * as vscode from 'vscode';

import { TreeService } from '../services/treeService';
import { CheckovResult } from '../../../../types';
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';
import { FilesService } from '../../../../services';
import { CheckovResultWebviewPanel } from '../../checkovResult';

export abstract class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  abstract readonly category: CHECKOV_RESULT_CATEGORY;

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

    this.data = this.treeService.getTreeData(this.category, checkovResults);
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

  public async onDidChangeSelection(event: vscode.TreeViewSelectionChangeEvent<TreeItem>) {
    const result = event.selection[0]?.result;

    if (!result) {
        return;
    }

    console.log(result);

    const openedTextEditor = await FilesService.openFile(result.repo_file_path, result.file_line_range[0]);
    CheckovResultWebviewPanel.show(this.category, result, openedTextEditor);
  } 
};

export class TreeItem extends vscode.TreeItem {
  public readonly children: TreeItem[] | undefined;
  public readonly result: CheckovResult | null;

  constructor(options: { label: string, iconPath?: vscode.ThemeIcon | { light: string, dark: string }, result?: CheckovResult }, children?: TreeItem[]) {
    const { label, iconPath, result } = options;

    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Collapsed
                                 );
    this.children = children;
    this.iconPath = iconPath;
    this.result = result ?? null;
  }
};
