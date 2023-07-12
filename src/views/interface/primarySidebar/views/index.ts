import * as vscode from 'vscode';

import { TreeDataProvidersContainer } from '../services/treeDataProvidersContainer';

let iacTreeView: vscode.TreeView<vscode.TreeItem>;

export function registerSidebar() {
    iacTreeView = vscode.window.createTreeView('iac-misconfiguration', {
        treeDataProvider: TreeDataProvidersContainer.iacTreeDataProvider,
    });

    vscode.window.createTreeView('secrets', {
        treeDataProvider: TreeDataProvidersContainer.secretsTreeDataProvicer,
    });

    vscode.window.createTreeView('vulnerabilities', {
        treeDataProvider: TreeDataProvidersContainer.vulnerabilitiesTreeDataProvider,
    });

    vscode.window.createTreeView('licenses', {
        treeDataProvider: TreeDataProvidersContainer.licensesTreeDataProvider,
    });

    TreeDataProvidersContainer.refresh();
};

function updateViewContainerBadge(badgeText: string, badgeValue: number): void {
    iacTreeView.badge = {
        tooltip: badgeText,
        value: badgeValue,
    };
};
