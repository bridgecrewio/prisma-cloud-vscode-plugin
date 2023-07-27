import { TreeDataProvider } from './abstractTreeDataProvider';
import { ResultsService } from '../../../../services';
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';

export class IaCTreeDataProvider extends TreeDataProvider {
    public readonly category = CHECKOV_RESULT_CATEGORY.IAC;

    public getCheckovResults() {
        return ResultsService.getByCategory(CHECKOV_RESULT_CATEGORY.IAC);
    }
};
