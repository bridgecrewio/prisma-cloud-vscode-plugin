import { TreeDataProvider } from './abstractTreeDataProvider';
import { ResultsService } from '../../../../services';
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';

export class VulnerabilitiesTreeDataProvider extends TreeDataProvider {
    public readonly category = 'sca';
    
    public getCheckovResults() {
        return ResultsService.getByCategory(CHECKOV_RESULT_CATEGORY.SCA);
    }
};
