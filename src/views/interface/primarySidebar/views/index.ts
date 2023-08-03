import * as vscode from 'vscode';

import { TreeDataProvidersContainer } from '../services/treeDataProvidersContainer';
import { FiltersViewProvider } from './filtersWebviewPanel';

export function registerSidebar(context: vscode.ExtensionContext) {
    const iacTreeView = vscode.window.createTreeView('iac-misconfiguration', {
        treeDataProvider: TreeDataProvidersContainer.iacTreeDataProvider,
    });

    const secretsTreeView = vscode.window.createTreeView('secrets', {
        treeDataProvider: TreeDataProvidersContainer.secretsTreeDataProvicer,
    });

    const vulnerabilitiesTreeView = vscode.window.createTreeView('vulnerabilities', {
        treeDataProvider: TreeDataProvidersContainer.vulnerabilitiesTreeDataProvider,
    });

    const licensesTreeView = vscode.window.createTreeView('licenses', {
        treeDataProvider: TreeDataProvidersContainer.licensesTreeDataProvider,
    });

    iacTreeView.onDidChangeSelection(
        TreeDataProvidersContainer.iacTreeDataProvider.onDidChangeSelection.bind(TreeDataProvidersContainer.iacTreeDataProvider)
    );
    secretsTreeView.onDidChangeSelection(
        TreeDataProvidersContainer.secretsTreeDataProvicer.onDidChangeSelection.bind(TreeDataProvidersContainer.secretsTreeDataProvicer)
    );
    vulnerabilitiesTreeView.onDidChangeSelection(
        TreeDataProvidersContainer.vulnerabilitiesTreeDataProvider.onDidChangeSelection.bind(TreeDataProvidersContainer.vulnerabilitiesTreeDataProvider)
    );
    licensesTreeView.onDidChangeSelection(
        TreeDataProvidersContainer.licensesTreeDataProvider.onDidChangeSelection.bind(TreeDataProvidersContainer.licensesTreeDataProvider)
    );

    const provider = new FiltersViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("filters", provider)
    );

    TreeDataProvidersContainer.refresh();
};
