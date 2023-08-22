import * as vscode from 'vscode';

import { TreeItem } from './dataProviders/abstractTreeDataProvider';
import { TreeDataProvidersContainer } from './services/treeDataProvidersContainer';
import { FiltersViewProvider } from './views/filtersWebviewPanel';
import { ResultsService } from '../../../services';

export let filtersViewProvider: FiltersViewProvider;

export class PrimarySidebar {
    public static iacTreeView: vscode.TreeView<TreeItem>;
    public static secretsTreeView: vscode.TreeView<TreeItem>;
    public static vulnerabilitiesTreeView: vscode.TreeView<TreeItem>;
    public static licensesTreeView: vscode.TreeView<TreeItem>;

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

        filtersViewProvider = new FiltersViewProvider(context.extensionUri);

        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('filters', filtersViewProvider),
        );

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
    }

    public static refreshBadgeCount() {
        PrimarySidebar.iacTreeView.badge = { value: ResultsService.getCount(), tooltip: '' };
    }
}

export function registerSidebar(context: vscode.ExtensionContext) {
    PrimarySidebar.initialize(context);
    TreeDataProvidersContainer.refresh();
};
