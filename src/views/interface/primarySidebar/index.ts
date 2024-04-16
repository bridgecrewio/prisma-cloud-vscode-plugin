import * as vscode from 'vscode';

import { TreeItem } from './dataProviders/abstractTreeDataProvider';
import { TreeDataProvidersContainer } from './services/treeDataProvidersContainer';
import { CategoriesService, ResultsService } from '../../../services';
import { CHECKOV_RESULT_CATEGORY } from '../../../constants';

export class PrimarySidebar {
    public static iacTreeView: vscode.TreeView<TreeItem>;
    public static secretsTreeView: vscode.TreeView<TreeItem>;
    public static vulnerabilitiesTreeView: vscode.TreeView<TreeItem>;
    public static licensesTreeView: vscode.TreeView<TreeItem>;
    public static weaknessesTreeView: vscode.TreeView<TreeItem>;

    public static initialize(context: vscode.ExtensionContext) {
        PrimarySidebar.iacTreeView = vscode.window.createTreeView('iac-misconfiguration', {
            treeDataProvider: TreeDataProvidersContainer.iacTreeDataProvider,
        });
        PrimarySidebar.secretsTreeView = vscode.window.createTreeView('secrets', {
            treeDataProvider: TreeDataProvidersContainer.secretsTreeDataProvicer,
        });
        PrimarySidebar.vulnerabilitiesTreeView = vscode.window.createTreeView('vulnerabilities', {
            treeDataProvider: TreeDataProvidersContainer.vulnerabilitiesTreeDataProvider,
        });
        PrimarySidebar.licensesTreeView = vscode.window.createTreeView('licenses', {
            treeDataProvider: TreeDataProvidersContainer.licensesTreeDataProvider,
        });
        PrimarySidebar.weaknessesTreeView = vscode.window.createTreeView('weaknesses', {
            treeDataProvider: TreeDataProvidersContainer.weaknessesTreeDataProvider,
        });

        PrimarySidebar.iacTreeView.onDidChangeSelection(
            TreeDataProvidersContainer.iacTreeDataProvider.onDidChangeSelection.bind(TreeDataProvidersContainer.iacTreeDataProvider),
        );
        PrimarySidebar.secretsTreeView.onDidChangeSelection(
            TreeDataProvidersContainer.secretsTreeDataProvicer.onDidChangeSelection.bind(TreeDataProvidersContainer.secretsTreeDataProvicer),
        );
        PrimarySidebar.vulnerabilitiesTreeView.onDidChangeSelection(
            TreeDataProvidersContainer.vulnerabilitiesTreeDataProvider.onDidChangeSelection.bind(TreeDataProvidersContainer.vulnerabilitiesTreeDataProvider),
        );
        PrimarySidebar.licensesTreeView.onDidChangeSelection(
            TreeDataProvidersContainer.licensesTreeDataProvider.onDidChangeSelection.bind(TreeDataProvidersContainer.licensesTreeDataProvider),
        );
        PrimarySidebar.weaknessesTreeView.onDidChangeSelection(
            TreeDataProvidersContainer.weaknessesTreeDataProvider.onDidChangeSelection.bind(TreeDataProvidersContainer.weaknessesTreeDataProvider),
        );
    }

    public static refreshBadgeCount() {
        PrimarySidebar.iacTreeView.badge = { value: ResultsService.getCount(), tooltip: '' };
    }

    public static getTreeView(checkId: string, checkType: string) {
        const checkCategory = CategoriesService.getCategory(checkId, checkType);
        if (checkCategory) {
            return PrimarySidebar.getTreeViewByCategory(checkCategory);
        }

        console.error(`Can not get tree data provider by category for checkId: ${checkId}`);
    }

    private static getTreeViewByCategory(category: CHECKOV_RESULT_CATEGORY): vscode.TreeView<TreeItem> | undefined {
        switch(category) {
            case CHECKOV_RESULT_CATEGORY.IAC:
                return PrimarySidebar.iacTreeView;
            case CHECKOV_RESULT_CATEGORY.LICENSES:
                return PrimarySidebar.licensesTreeView;
            case CHECKOV_RESULT_CATEGORY.SCA:
                return PrimarySidebar.vulnerabilitiesTreeView;
            case CHECKOV_RESULT_CATEGORY.SECRETS:
                return PrimarySidebar.secretsTreeView;
            case CHECKOV_RESULT_CATEGORY.WEAKNESSES:
                return PrimarySidebar.weaknessesTreeView;
            default:
                console.log(`No such tree view for the category: ${category}`);
        }
    }
}

export function registerSidebar(context: vscode.ExtensionContext) {
    PrimarySidebar.initialize(context);
    TreeDataProvidersContainer.refresh();
};
