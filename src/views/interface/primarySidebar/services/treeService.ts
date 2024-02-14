import * as path from 'path';
import { TreeItem } from '../dataProviders/abstractTreeDataProvider';
import { IconsService } from './iconsService';
import { CheckovResult } from '../../../../types';
import { CHECKOV_RESULT_CATEGORY, PATH_TYPE, SEVERITY, dockerfileName, severityPriorityMap } from '../../../../constants';

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

    public getTreeData(category: CHECKOV_RESULT_CATEGORY, checkovOutput: CheckovResult[]): TreeItem[] {
        const formattedData = this.formatCheckData(category, checkovOutput);
        const treeData = this.formTreeData(formattedData);
        this.setParentLinks(treeData);
        if (treeData.length === 1) {
            return treeData;
        }
        this.sortTreeData({children: treeData} as TreeItem);
        return treeData;
    }

    private setParentLinks(formedData: TreeItem[]) {
        for (const treeItem of formedData) {
            if (treeItem.children) {
                for (const childTreeItem of treeItem.children) {
                    childTreeItem.parent = treeItem;
                }
                this.setParentLinks(treeItem.children);
            }
        }
    }

    private sortTreeData(treeData: TreeItem) {
        if (treeData.children) {
            if (treeData.children[0].result) {
                treeData.children.sort((a, b) => {
                    return severityPriorityMap[b.result?.severity || SEVERITY.UNKNOWN] - severityPriorityMap[a.result?.severity || SEVERITY.UNKNOWN];
                });
                return;
            }
            treeData.children.sort((a, b) => {
                if (a.isCounter || b.isCounter) {
                    return 0;
                }
                if ((a.label && typeof a.label === 'string') && (b.label && typeof b.label === 'string')) {
                    return a?.label.localeCompare(b.label);
                }
                return 0;
            });
            
            for (const child of treeData.children) {
                this.sortTreeData(child);
            }
        }
    }

    private formTreeData(formattedData: Array<FormattedCheck>): TreeItem[] {
        let formedTreeData: any = [];
        let level: any = { formedTreeData };
        let counter: number = 0;

        formattedData.forEach(formattedCheck => {
            formattedCheck.filePath.reduce((r, { path, pathType, severity }, i, a) => {
              const iconPath = this.iconService.getIconPath(pathType, severity);
              if (i === a.length - 1) {
                r.formedTreeData.push(new TreeItem({ label: path, iconPath, result: formattedCheck.result }));
                counter++;
              } else if(!r[path]) {
                r[path] = {formedTreeData: []};
                r.formedTreeData.push(new TreeItem({ label: path, iconPath }, r[path].formedTreeData));
              }

              return r[path];
            }, level);
        });

        formedTreeData.unshift(new TreeItem({ label: `Found issues: ${counter}`, isCounter: true }));

        return formedTreeData;
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
        const filePathType = this.getFilePathTypeByFilename(repoFilePathArr[repoFilePathArr.length - 1]);
        const repoPathCells: PathCell[] = repoFilePathArr.map((path, i) => ({ path, pathType: i === repoFilePathArr.length - 1 ? filePathType : PATH_TYPE.FOLDER }));

        if (category === CHECKOV_RESULT_CATEGORY.SCA) {
            return [
                ...repoPathCells, 
                root_package_name ? { 
                    path: `${root_package_name}/${root_package_version}`,
                    pathType: filePathType,
                } : {
                    path: this.extractPackage(resource),
                    pathType: filePathType
                }, 
                { path: `${package_name}:${package_version} (${id})`, pathType: PATH_TYPE.RISK, severity }
            ];
        }
        if (category === CHECKOV_RESULT_CATEGORY.IAC) {
            return [
                ...repoPathCells, 
                { path: result.resource, pathType: filePathType }, 
                { path: `${result.check_name} (${file_line_range[0]} - ${file_line_range[1]})`, pathType: PATH_TYPE.RISK, severity }
            ];
        }
        if (category === CHECKOV_RESULT_CATEGORY.SECRETS) {
            return [
                ...repoPathCells, 
                { path: `${result.check_name} (${file_line_range[0]} - ${file_line_range[1]})`, pathType: PATH_TYPE.RISK, severity }
            ];
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

    private getFilePathTypeByFilename(filename: string): PATH_TYPE {
        if (filename.includes(dockerfileName)) {
            return PATH_TYPE.DOCKERFILE;
        }

        const extension = path.extname(filename);
        const extensionMap: Record<string, PATH_TYPE> = {
            '.tf': PATH_TYPE.TERRAFORM,
            '.py': PATH_TYPE.PYTHON,
            '.kt': PATH_TYPE.KOTLIN,
        };
        
        return extensionMap[extension] || PATH_TYPE.FILE;
    }

    private extractPackage(resource: string): string {
        return resource.split(' ').find(elem => elem[0] === '(')?.replace('(', '') || resource.split('/').pop() || '';
    }

    private escapeRedundantChars(filePath: string): string {
        return filePath.replace(/\/\//g, '/').replace(/^\//, '');;
    }
}