import { TreeDataProvider } from './abstractTreeDataProvider';
import { ResultsService } from '../../../../services';
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';

export class WeaknessesTreeDataProvider extends TreeDataProvider {
    public readonly category = CHECKOV_RESULT_CATEGORY.WEAKNESSES;
    
    public getCheckovResults() {
        return ResultsService.getByCategory(CHECKOV_RESULT_CATEGORY.WEAKNESSES);
    }
};
