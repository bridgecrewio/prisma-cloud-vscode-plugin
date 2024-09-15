import * as vscode from 'vscode';

import {CHECKOV_RESULT_CATEGORY} from '../../../constants';
import logger from '../../../logger';
import {CategoriesService} from '../../../services';
import {CheckovResult} from '../../../types';
import {ResultTreeItem} from './dataProviders/resultTreeDataProvider';
import {TreeDataProvidersContainer} from './services/treeDataProvidersContainer';

export class PrimarySidebar {

    public static initialize() {
        TreeDataProvidersContainer.registerTreeProviders();
    }

    public static showTreeResult(result: CheckovResult, category: CHECKOV_RESULT_CATEGORY) {
        TreeDataProvidersContainer.treeViews[category].provider.showResult(result).catch(e => logger.error(e));
    }

    public static getTreeView(checkId: string, checkType: string) {
        const checkCategory = CategoriesService.getCategory(checkId, checkType);
        if (checkCategory) {
            return PrimarySidebar.getTreeViewByCategory(checkCategory);
        }

        logger.error(`Can not get tree data provider by category for checkId: ${checkId}`);
    }

    private static getTreeViewByCategory(category: CHECKOV_RESULT_CATEGORY): vscode.TreeView<ResultTreeItem> | undefined {
        if (TreeDataProvidersContainer.treeViews[category]) {
            return TreeDataProvidersContainer.treeViews[category].view;
        }
        logger.info(`No such tree view for the category: ${category}`);
    }
}

export function registerSidebar() {
    PrimarySidebar.initialize();
    TreeDataProvidersContainer.refresh();
}
