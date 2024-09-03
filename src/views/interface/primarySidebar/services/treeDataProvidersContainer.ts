import * as vscode from "vscode";
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';
import logger from '../../../../logger';
import { CategoriesService, ResultsService } from '../../../../services';
import { ResultTreeDataProvider, ResultTreeItem } from '../dataProviders/resultTreeDataProvider';

interface TreeViewContext {
    key: string;
    provider: ResultTreeDataProvider;
    view?: vscode.TreeView<ResultTreeItem>;
}

export class TreeDataProvidersContainer {

    public static treeViews: Record<CHECKOV_RESULT_CATEGORY, TreeViewContext> = {
        [CHECKOV_RESULT_CATEGORY.IAC]: {
            key: 'iac-misconfiguration',
            provider: new ResultTreeDataProvider(CHECKOV_RESULT_CATEGORY.IAC)
        },
        [CHECKOV_RESULT_CATEGORY.SCA]: {
            key: 'vulnerabilities',
            provider: new ResultTreeDataProvider(CHECKOV_RESULT_CATEGORY.SCA)
        },
        [CHECKOV_RESULT_CATEGORY.SECRETS]: {
            key: 'secrets',
            provider: new ResultTreeDataProvider(CHECKOV_RESULT_CATEGORY.SECRETS)
        },
        [CHECKOV_RESULT_CATEGORY.LICENSES]: {
            key: 'licenses',
            provider: new ResultTreeDataProvider(CHECKOV_RESULT_CATEGORY.LICENSES)
        },
        [CHECKOV_RESULT_CATEGORY.WEAKNESSES]: {
            key: 'weaknesses',
            provider: new ResultTreeDataProvider(CHECKOV_RESULT_CATEGORY.WEAKNESSES)
        }
    };

    public static registerTreeProviders() {
        Object.values(this.treeViews).forEach(treeViewContext => {
            treeViewContext.view = vscode.window.createTreeView(treeViewContext.key, {
                treeDataProvider: treeViewContext.provider,
            });
        });
    }

    public static refresh() {
        Object.values(this.treeViews).forEach(treeViewContext => {
            treeViewContext.provider.refresh();
            treeViewContext.view!.badge = { value: ResultsService.getCount(), tooltip: '' };
        });
    }

    public static getTreeDataProviderByCategory(category: CHECKOV_RESULT_CATEGORY): ResultTreeDataProvider | undefined {
        if (this.treeViews[category]) {
            return this.treeViews[category].provider;
        }
        logger.info(`No such tree data provider for the category: ${category}`);
    }

    public static getTreeItem({ checkId, id, checkType }: { checkId: string, id: string, checkType: string }) {
        const checkCategory = CategoriesService.getCategory(checkId, checkType);
        if (checkCategory) {
            const treeDataProvider = TreeDataProvidersContainer.getTreeDataProviderByCategory(checkCategory);
            return treeDataProvider?.getTreeItemByIds(id);
        } else {
            logger.error(`Can not specify category for the risk. checkId: ${checkId} id: ${id}`);
        }
    }
}
