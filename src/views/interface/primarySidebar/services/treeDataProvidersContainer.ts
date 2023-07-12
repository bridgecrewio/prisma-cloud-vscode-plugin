import { TreeDataProvider } from '../dataProviders/abstractTreeDataProvider';
import { IaCTreeDataProvider } from '../dataProviders/iacTreeDataProvider';
import { SecretsTreeDataProvider } from '../dataProviders/secretsTreeDataProvider';
import { VulnerabilitiesTreeDataProvider } from '../dataProviders/vulnerabilitiesTreeDataProvider';
import { LicensesTreeDataProvider } from '../dataProviders/licensesTreeDataProvider';

export class TreeDataProvidersContainer {
    public static iacTreeDataProvider: TreeDataProvider;
    public static secretsTreeDataProvicer: TreeDataProvider;
    public static vulnerabilitiesTreeDataProvider: TreeDataProvider;
    public static licensesTreeDataProvider: TreeDataProvider;

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
};
