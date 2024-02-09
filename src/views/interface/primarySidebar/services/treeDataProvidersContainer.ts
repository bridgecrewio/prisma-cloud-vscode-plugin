import { IaCTreeDataProvider } from '../dataProviders/iacTreeDataProvider';
import { SecretsTreeDataProvider } from '../dataProviders/secretsTreeDataProvider';
import { VulnerabilitiesTreeDataProvider } from '../dataProviders/vulnerabilitiesTreeDataProvider';
import { LicensesTreeDataProvider } from '../dataProviders/licensesTreeDataProvider';
import { PrimarySidebar } from '../../primarySidebar';
import { CategoriesService } from '../../../../services';
import { TreeDataProvider } from '../dataProviders/abstractTreeDataProvider';
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';

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
        PrimarySidebar.refreshBadgeCount();
    }

    public static getTreeDataProviderByCategory(category: CHECKOV_RESULT_CATEGORY): TreeDataProvider | undefined {
        switch(category) {
            case CHECKOV_RESULT_CATEGORY.IAC:
                return TreeDataProvidersContainer.iacTreeDataProvider;
            case CHECKOV_RESULT_CATEGORY.LICENSES:
                return TreeDataProvidersContainer.licensesTreeDataProvider;
            case CHECKOV_RESULT_CATEGORY.SCA:
                return TreeDataProvidersContainer.vulnerabilitiesTreeDataProvider;
            case CHECKOV_RESULT_CATEGORY.SECRETS:
                return TreeDataProvidersContainer.secretsTreeDataProvicer;
            default:
                console.log(`No such tree data provider for the category: ${category}`);
        }
    }

    public static getTreeItemByCheckIds({ checkId, id }: { checkId: string, id: string }) {
        const checkCategory = CategoriesService.getCategoryByCheckId(checkId);
        if (checkCategory) {
            const treeDataProvider = TreeDataProvidersContainer.getTreeDataProviderByCategory(checkCategory);
            return treeDataProvider?.getTreeItemByIds(id);
        } else {
            console.error(`Can not specify category for the risk. checkId: ${checkId} id: ${id}`);
        }
    }
};
