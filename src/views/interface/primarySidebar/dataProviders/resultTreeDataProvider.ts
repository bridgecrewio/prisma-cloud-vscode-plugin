import * as vscode from 'vscode';

import { getPrismaApiUrl } from '../../../../config/configUtils';
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';
import logger from '../../../../logger';
import { CategoriesService, FilesService, ResultsService } from '../../../../services';
import { CheckovResult } from '../../../../types';
import { CheckovResultWebviewPanel } from '../../checkovResult';
import { TreeService } from '../services/treeService';

export class ResultTreeDataProvider implements vscode.TreeDataProvider<ResultTreeItem> {

  readonly category: CHECKOV_RESULT_CATEGORY;

  private data: ResultTreeItem[] = [];
  private treeService: TreeService;

  constructor(category: CHECKOV_RESULT_CATEGORY) {
    this.category = category;
    this.treeService = new TreeService();
  }

  public getCheckovResults() {
    return ResultsService.getByCategory(this.category);
  };

  public refresh() {
    const checkovResults = this.getCheckovResults();
    this.data = this.treeService.getTreeData(this.category, checkovResults);
  }

  public getTreeItem(element: ResultTreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    return element;
  }

  public getChildren(element?: ResultTreeItem): vscode.ProviderResult<ResultTreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }

  public getItemsAmount(): number {
    return this.data.length;
  }

  public getParent(element: ResultTreeItem): vscode.ProviderResult<ResultTreeItem> {
    return element.parent;
  }

  public async showResult(result?: CheckovResult | null) {
    if (!result) {
        return;
    }
    const isIaC = CategoriesService.isIaCRisk(result.check_id, result.check_type);
    if (isIaC) {
      let fetchedDescription;
      if (getPrismaApiUrl()) {
        logger.info(`Fetching description for ${result.bc_check_id}`);
        fetchedDescription = await CheckovResultWebviewPanel.fetchDescription(result.bc_check_id);
      }
      if (!result.description && fetchedDescription) {
        result.description = fetchedDescription;
      }
    }
    const openedTextEditor = await FilesService.openFile(result.file_abs_path, result.file_line_range[0]);
    await CheckovResultWebviewPanel.show(this.category, result, openedTextEditor);
  }

  public getTreeItemByIds(id: string) {
    return this.traverseAndFind(id, { children: this.data } as ResultTreeItem);
  }

  private traverseAndFind(id: string, treeItem: ResultTreeItem): ResultTreeItem | undefined {
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
}

export class ResultTreeItem extends vscode.TreeItem {

  public readonly children: ResultTreeItem[] | undefined;
  public readonly result: CheckovResult | null;
  public readonly isCounter?: boolean;
  public readonly category: CHECKOV_RESULT_CATEGORY;
  public parent?: ResultTreeItem;

  constructor(options: { 
    label: string, 
    iconPath?: vscode.ThemeIcon | { light: string, dark: string }, 
    result?: CheckovResult,
    isCounter?: boolean,
    category: CHECKOV_RESULT_CATEGORY
  }, children?: ResultTreeItem[]) {
    const { label, iconPath, result, isCounter, category } = options;

    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Collapsed
    );
    this.children = children;
    this.iconPath = iconPath;
    this.result = result ?? null;
    this.isCounter = isCounter;
    this.category = category;
    this.command = {
      command: 'treeView.click',
      title: 'Show description',
      arguments: [result, category]
    };
  }
}
