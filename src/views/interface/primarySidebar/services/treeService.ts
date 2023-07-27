import { TreeItem } from '../dataProviders/abstractTreeDataProvider';
import { IconsService } from './iconsService';
import { CheckovResult } from '../../../../types';
import { CHECKOV_RESULT_CATEGORY } from '../../../../constants';

export type FormattedCheck = {
    originalFilePath: string;
    filePath: string[];
    checkClass: string;
    checkName: string;
    result: CheckovResult;
    vulnerabilityDetailsId: string;
};

export class TreeService {
    iconService: IconsService;

    constructor() {
        this.iconService = new IconsService();
    }

    public getTreeData(category: CHECKOV_RESULT_CATEGORY, checkovOutput: CheckovResult[]): Array<TreeItem> {
        const formattedData = this.formatCheckData(category, checkovOutput);
        return this.formTreeData(formattedData);
    }

    private formTreeData(formattedData: Array<FormattedCheck>): Array<TreeItem> {
        let formTreeData: any = [];
        let level: any = { formTreeData };

        formattedData.forEach(formattedCheck => {
            formattedCheck.filePath.reduce((r, name, i, a) => {
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

    private formatCheckData(category: CHECKOV_RESULT_CATEGORY, results: CheckovResult[]): Array<FormattedCheck> {
        return results.map((result) => ({
            originalFilePath: this.escapeRedundantChars(result.repo_file_path),
            filePath: this.getFilePathByCategory(result, category),
            checkClass: result.check_class,
            checkName: result.check_name,
            result: result,
            vulnerabilityDetailsId: result.vulnerability_details?.id,
            severity: result.severity,
        }));
    }

    private getFilePathByCategory(result: CheckovResult, category: CHECKOV_RESULT_CATEGORY): string[] {
        const { vulnerability_details, file_line_range, resource } = result;
        const { root_package_name, root_package_version, package_name, id, license, package_version } = vulnerability_details || {};
        const repoFilePathArr = this.escapeRedundantChars(result.repo_file_path).split('/');

        if (category === CHECKOV_RESULT_CATEGORY.SCA) {
            return [
                ...repoFilePathArr, 
                root_package_name ? `${root_package_name}/${root_package_version}` : this.extractPackage(resource), 
                `${package_name}:${package_version} (${id})`
            ];
        }
        if (category === CHECKOV_RESULT_CATEGORY.IAC) {
            return [
                ...repoFilePathArr, 
                result.resource, 
                `${result.check_name} (${file_line_range[0]} - ${file_line_range[1]})`
            ];
        }
        if (category === CHECKOV_RESULT_CATEGORY.SECRETS) {
            return [''];
        }
        if (category === CHECKOV_RESULT_CATEGORY.LICENSES) {
            return [
                ...repoFilePathArr, 
                package_name, 
                license
            ];
        }    
        return [''];
    }

    extractPackage(resource: string): string {
        return resource.split(' ').find(elem => elem[0] === '(')?.replace('(', '') || '';
    }

    private escapeRedundantChars(filePath: string): string {
        return filePath.replace(/\/\//g, '/').replace(/^\//, '');;
    }
}