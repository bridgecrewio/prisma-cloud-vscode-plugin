import * as vscode from 'vscode';

import { IaCTreeDataProvider } from '../dataProviders/iacTreeDataProvider';
import { SecretsTreeDataProvider } from '../dataProviders/secretsTreeDataProvider';
import { VulnerabilitiesTreeDataProvider } from '../dataProviders/vulnerabilitiesTreeDataProvider';
import { LicensesTreeDataProvider } from '../dataProviders/licensesTreeDataProvider';
import { TreeItem } from '../dataProviders/abstractTreeDataProvider';
import { CheckovResultWebviewPanel } from '../../checkovResult';

export class TreeDataProvidersContainer {
    public static iacTreeDataProvider: IaCTreeDataProvider;
    public static secretsTreeDataProvicer: SecretsTreeDataProvider;
    public static vulnerabilitiesTreeDataProvider: VulnerabilitiesTreeDataProvider;
    public static licensesTreeDataProvider: LicensesTreeDataProvider;

    static {
        TreeDataProvidersContainer.iacTreeDataProvider = new IaCTreeDataProvider();
        TreeDataProvidersContainer.secretsTreeDataProvicer = new SecretsTreeDataProvider();
        TreeDataProvidersContainer.vulnerabilitiesTreeDataProvider = new VulnerabilitiesTreeDataProvider();
        TreeDataProvidersContainer.licensesTreeDataProvider = new LicensesTreeDataProvider();
    }

    public static refresh() {
        TreeDataProvidersContainer.iacTreeDataProvider.refresh();
        TreeDataProvidersContainer.secretsTreeDataProvicer.refresh();
        TreeDataProvidersContainer.vulnerabilitiesTreeDataProvider.refresh();
        TreeDataProvidersContainer.licensesTreeDataProvider.refresh();
    }

    public static onDidChangeSelection(event: vscode.TreeViewSelectionChangeEvent<TreeItem>) {
        const result = event.selection[0].result;

        if (!result) {
            return;
        }

        // TODO: Switch to result category
        return CheckovResultWebviewPanel.show('iac', result);
    }
};
