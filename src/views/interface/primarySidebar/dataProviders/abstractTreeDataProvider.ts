import * as vscode from 'vscode';

import { TreeService } from '../services/treeService';
import { CheckovResult } from '../../../../types';
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';
import { CategoriesService, FilesService } from '../../../../services';
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

  public getParent(element: TreeItem): vscode.ProviderResult<TreeItem> {
    return element.parent;
  }

  public async onDidChangeSelection(event: vscode.TreeViewSelectionChangeEvent<TreeItem>) {
    const result = event.selection[0]?.result;

    if (!result) {
        return;
    }

    console.log(result);

    const isIaC = CategoriesService.isIaCRisk(result.check_id);

    if (isIaC) {
      const fetchedDescription = await CheckovResultWebviewPanel.fetchDescription(result.bc_check_id);

      if (!result.description && fetchedDescription) {
        result.description = fetchedDescription;
      }
    }

    const openedTextEditor = await FilesService.openFile(result.repo_file_path, result.file_line_range[0]);
    await CheckovResultWebviewPanel.show(this.category, result, openedTextEditor);
  } 

  public getTreeItemByIds(id: string) {
    return this.traverseAndFind(id, { children: this.data } as TreeItem);
  }

  private traverseAndFind(id: string, treeItem: TreeItem): TreeItem | undefined {
      if (treeItem?.result?.id === id) {
        return treeItem;
      } 

      if (treeItem.children) {
        for (const child of treeItem.children) {
          const result = this.traverseAndFind(id, child);

          if (result) { return result; }
        }
      }
  }
};

export class TreeItem extends vscode.TreeItem {
  public readonly children: TreeItem[] | undefined;
  public readonly result: CheckovResult | null;
  public parent?: TreeItem;

  constructor(options: { 
    label: string, 
    iconPath?: vscode.ThemeIcon | { light: string, dark: string }, 
    result?: CheckovResult, 
  }, children?: TreeItem[]) {
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
