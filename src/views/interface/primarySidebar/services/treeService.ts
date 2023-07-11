import * as path from 'path';
import { TreeItem } from "../dataProviders/abstractTreeDataProvider";
import { IconsService } from './iconsService';

export type FormattedCheck = {
    originalFilePath: string;
    filePath: string;
    checkClass: string;
    checkName: string;
};

type CheckData = {
    repo_file_path: string;
    check_class: string;
    check_name: string;
};

export type Check = {
    check_type: string;
    results: {
        failed_checks: Array<CheckData>
    };
};

export class TreeService {
    iconService: IconsService;

    constructor() {
        this.iconService = new IconsService();
    }

    public getTreeData(checkovOutput: Array<Check>): Array<TreeItem> {
        const formattedData = this.formatCheckData(checkovOutput);
        console.log('formattedData', formattedData);
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

    private formatCheckData(data: Array<Check>): Array<FormattedCheck> {
        const formattedData: Array<FormattedCheck> = [];
        data.map(record => {
            return record?.results?.failed_checks.map(({ repo_file_path, check_class, check_name }) => {
                formattedData.push({
                    originalFilePath: this.escapeRedundantChars(repo_file_path),
                    filePath: this.escapeRedundantChars(`${repo_file_path}/${check_class}/${check_name}`),
                    checkClass: check_class,
                    checkName: check_name,
                });
            });
        });

        return formattedData;
    }

    private escapeRedundantChars(filePath: string): string {
        return filePath.replace(/\/\//g, '/').replace(/^\//, '');;
    }
}