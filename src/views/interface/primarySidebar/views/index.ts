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

    TreeDataProvidersContainer.refresh();
};
