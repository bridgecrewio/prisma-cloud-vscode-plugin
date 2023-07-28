import { TreeItem } from '../dataProviders/abstractTreeDataProvider';
import { IconsService } from './iconsService';
import { CheckovResult } from '../../../../types';
import { CHECKOV_RESULT_CATEGORY, PATH_TYPE, SEVERITY } from '../../../../constants';

export type FormattedCheck = {
    originalFilePath: string;
    filePath: PathCell[];
    checkClass: string;
    checkName: string;
    result: CheckovResult;
    vulnerabilityDetailsId: string;
};

type PathCell = {
    path: string;
    pathType: PATH_TYPE;
    severity?: SEVERITY
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
            formattedCheck.filePath.reduce((r, { path, pathType, severity }, i, a) => {
              const iconPath = this.iconService.getIconPath(pathType, severity);
              if (i === a.length - 1) {
                r.formTreeData.push(new TreeItem({ label: path, iconPath, result: formattedCheck.result }));
              } else if(!r[path]) {
                r[path] = {formTreeData: []};
                r.formTreeData.push(new TreeItem({ label: path, iconPath }, r[path].formTreeData));
              }

              return r[path];
            }, level);
        });

        return formTreeData;
    }

    private formatCheckData(category: CHECKOV_RESULT_CATEGORY, results: CheckovResult[]): FormattedCheck[] {
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

    private getFilePathByCategory(result: CheckovResult, category: CHECKOV_RESULT_CATEGORY): PathCell[] {
        const { vulnerability_details, file_line_range, resource, severity } = result;
        const { root_package_name, root_package_version, package_name, id, license, package_version } = vulnerability_details || {};
        const repoFilePathArr = this.escapeRedundantChars(result.repo_file_path).split('/');
        const repoPathCells: PathCell[] = repoFilePathArr.map((path, i) => ({
            path,
            pathType: i === repoFilePathArr.length - 1 ? PATH_TYPE.FILE : PATH_TYPE.FOLDER
        }));

        if (category === CHECKOV_RESULT_CATEGORY.SCA) {
            return [
                ...repoPathCells, 
                root_package_name ? { 
                    path: `${root_package_name}/${root_package_version}`,
                    pathType: PATH_TYPE.FILE,
                } : {
                    path: this.extractPackage(resource),
                    pathType: PATH_TYPE.FILE
                }, 
                { path: `${package_name}:${package_version} (${id})`, pathType: PATH_TYPE.RISK, severity }
            ];
        }
        if (category === CHECKOV_RESULT_CATEGORY.IAC) {
            return [
                ...repoPathCells, 
                { path: result.resource, pathType: PATH_TYPE.FILE }, 
                { path: `${result.check_name} (${file_line_range[0]} - ${file_line_range[1]})`, pathType: PATH_TYPE.RISK, severity }
            ];
        }
        if (category === CHECKOV_RESULT_CATEGORY.SECRETS) {
            return [{ path: '', pathType: PATH_TYPE.EMPTY }];
        }
        if (category === CHECKOV_RESULT_CATEGORY.LICENSES) {
            return [
                ...repoPathCells, 
                { path: package_name, pathType: PATH_TYPE.PACKAGE }, 
                { path: license, pathType: PATH_TYPE.RISK, severity }
            ];
        }    
        return [{ path: '', pathType: PATH_TYPE.EMPTY }];
    }

    private getPathTypeBySeverity(severity: string) {

    }

    private extractPackage(resource: string): string {
        return resource.split(' ').find(elem => elem[0] === '(')?.replace('(', '') || '';
    }

    private escapeRedundantChars(filePath: string): string {
        return filePath.replace(/\/\//g, '/').replace(/^\//, '');;
    }
}