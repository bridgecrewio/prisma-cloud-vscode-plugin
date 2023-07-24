import { TreeDataProvider } from './abstractTreeDataProvider';
import { ResultsService } from '../../../../services';
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';

export class LicensesTreeDataProvider extends TreeDataProvider {
    public readonly category = 'licenses';

    public getCheckovResults() {
        return ResultsService.getByCategory(CHECKOV_RESULT_CATEGORY.LICENSES);
    }
};
