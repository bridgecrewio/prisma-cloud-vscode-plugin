import { TreeItem } from '../dataProviders/abstractTreeDataProvider';
import { IconsService } from './iconsService';
import { CheckovResult } from '../../../../types';

export type FormattedCheck = {
    originalFilePath: string;
    filePath: string;
    checkClass: string;
    checkName: string;
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
                r.formTreeData.push(new TreeItem({ label: name, iconPath }));
              } else if(!r[name]) {
                r[name] = {formTreeData: []};
                r.formTreeData.push(new TreeItem({ label: name, iconPath }, r[name].formTreeData));
              }

              return r[name];
            }, level);
        });

        return formTreeData;
    }

    private formatCheckData(data: CheckovResult[]): Array<FormattedCheck> {
        return data.map(({ repo_file_path, check_class, check_name }) => ({
            originalFilePath: this.escapeRedundantChars(repo_file_path),
            filePath: this.escapeRedundantChars(`${repo_file_path}/${check_class}/${check_name}`),
            checkClass: check_class,
            checkName: check_name,
        }));
    }

    private escapeRedundantChars(filePath: string): string {
        return filePath.replace(/\/\//g, '/').replace(/^\//, '');;
    }
}