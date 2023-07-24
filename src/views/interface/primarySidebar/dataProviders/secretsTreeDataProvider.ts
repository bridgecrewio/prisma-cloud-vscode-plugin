import { TreeDataProvider } from './abstractTreeDataProvider';
import { ResultsService } from '../../../../services';
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';

export class SecretsTreeDataProvider extends TreeDataProvider {
    public readonly category = 'secrets';

    public getCheckovResults() {
        return ResultsService.getByCategory(CHECKOV_RESULT_CATEGORY.SECRETS);
    }
};
