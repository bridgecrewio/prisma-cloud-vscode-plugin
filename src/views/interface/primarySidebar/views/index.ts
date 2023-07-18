import * as vscode from 'vscode';

import { TreeDataProvidersContainer } from '../services/treeDataProvidersContainer';

export function registerSidebar() {
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

    TreeDataProvidersContainer.refresh();

    [iacTreeView, secretsTreeView, vulnerabilitiesTreeView, licensesTreeView].forEach(
        (treeView) => treeView.onDidChangeSelection(TreeDataProvidersContainer.onDidChangeSelection),
    );
};
