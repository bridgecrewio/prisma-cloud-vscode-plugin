import { TreeItem } from '../dataProviders/abstractTreeDataProvider';
import { IconsService } from './iconsService';
import { CheckovResult } from '../../../../types';

export type FormattedCheck = {
    originalFilePath: string;
    filePath: string;
    checkClass: string;
    checkName: string;
    result: CheckovResult;
};

export class TreeService {
    iconService: IconsService;

    constructor() {
        this.iconService = new IconsService();
    }

    public getTreeData(checkovOutput: CheckovResult[]): Array<TreeItem> {
        const formattedData = this.formatCheckData(checkovOutput);

        return this.formTreeData(formattedData);
    }

    private formTreeData(formattedData: Array<FormattedCheck>): Array<TreeItem> {
        let formTreeData: any = [];
        let level: any = { formTreeData };

        formattedData.forEach(formattedCheck => {
            formattedCheck.filePath.split('/').reduce((r, name, i, a) => {
              const iconPath = this.iconService.getIconPath(name, formattedCheck);
              if (i === a.length - 1) {
                r.formTreeData.push(new TreeItem({ label: name, iconPath, result: formattedCheck.result }));
              } else if(!r[name]) {
                r[name] = {formTreeData: []};
                r.formTreeData.push(new TreeItem({ label: name, iconPath }, r[name].formTreeData));
              }

              return r[name];
            }, level);
        });

        return formTreeData;
    }

    private formatCheckData(results: CheckovResult[]): Array<FormattedCheck> {
        return results.map((result) => ({
            originalFilePath: this.escapeRedundantChars(result.repo_file_path),
            filePath: this.escapeRedundantChars(`${result.repo_file_path}/${result.check_class}/${result.check_name}`),
            checkClass: result.check_class,
            checkName: result.check_name,
            result: result,
        }));
    }

    private escapeRedundantChars(filePath: string): string {
        return filePath.replace(/\/\//g, '/').replace(/^\//, '');;
    }
}