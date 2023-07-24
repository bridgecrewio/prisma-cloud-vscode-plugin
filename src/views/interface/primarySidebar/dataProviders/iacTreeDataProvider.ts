import { TreeDataProvider } from './abstractTreeDataProvider';
import { ResultsService, FilesService } from '../../../../services';
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';

export class IaCTreeDataProvider extends TreeDataProvider {
    public readonly category = 'iac';

    public getCheckovResults() {
        return ResultsService.getByCategory(CHECKOV_RESULT_CATEGORY.IAC);
    }
};
