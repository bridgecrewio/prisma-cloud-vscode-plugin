import * as vscode from 'vscode';

import { CONFIG } from '../config';
import { CHECKOV_RESULT_CATEGORY } from '../constants';
import { CheckovResult } from '../types';
import { formatWindowsAbsoluteFilePath, isWindows } from '../utils';
import { TreeDataProvidersContainer } from '../views/interface/primarySidebar/services/treeDataProvidersContainer';
import { CategoriesService } from './categoriesService';
import { CustomPopupService } from './customPopupService';

type Filter = {
    filterName: keyof CheckovResult;
    filterValue: string;
};

export class ResultsService {
    private static context: vscode.ExtensionContext;
    private static filters: Filter[] = [];

    public static initialize(context: vscode.ExtensionContext) {
        ResultsService.context = context;
    }

    public static addFilter(newFilter: Filter) {
        const { filterName, filterValue } = newFilter;

        const existingFilter = ResultsService.isFilterActive(newFilter);

        if (existingFilter) {
            ResultsService.filters = ResultsService.filters.filter(filter => filter.filterName === filterName && filter.filterValue !== filterValue);
            ResultsService.updatePluginState();
            return;
        }
        
        ResultsService.filters.push(newFilter);
        ResultsService.updatePluginState();
    }

    public static isFilterActive(filterToCheck: Filter): boolean {
        const { filterName, filterValue } = filterToCheck;
        return Boolean(ResultsService.filters.find(filter => filter.filterName === filterName && filter.filterValue === filterValue));
    }

    public static get(): CheckovResult[] {
        const currentState = ResultsService.context.workspaceState.get(CONFIG.storage.resultsKey) as CheckovResult[] ?? [];

        return ResultsService.applyFilters(currentState);
    }

    public static getCount() {
        return ResultsService.get().length;
    }

    public static getByCategory(category: CHECKOV_RESULT_CATEGORY) {
        const results = ResultsService.get();

        switch (category) {
            case CHECKOV_RESULT_CATEGORY.IAC:
                return results.filter((result) => CategoriesService.isIaCRisk(result.check_id, result.check_type));
            case CHECKOV_RESULT_CATEGORY.SCA:
                return results.filter((result) => CategoriesService.isSCARisk(result.check_id));
            case CHECKOV_RESULT_CATEGORY.SECRETS:
                return results.filter((result) => CategoriesService.isSecretsRisk(result.check_id));
            case CHECKOV_RESULT_CATEGORY.LICENSES:
                return results.filter((result) => CategoriesService.isLicensesRisk(result.check_id));
            case CHECKOV_RESULT_CATEGORY.WEAKNESSES:
                return results.filter((result) => CategoriesService.isWeaknessesRisk(result.check_type));
        }
    }

    public static getByFilePath(filePath: string) {
        const results = ResultsService.get();
        return results.filter(result => this.isSameFilePath(filePath, result));
    }

    public static store(results: CheckovResult[]) {
        ResultsService.context.workspaceState.update(CONFIG.storage.resultsKey, results);
        ResultsService.updatePluginState();
    }

    public static storeByFiles(files: string[], results: CheckovResult[]) {
        const storedResults = ResultsService.get();
        const updatedResults = [
            ...storedResults.filter((result) => !files.some(file => this.isSameFilePath(file, result))),
            ...results,
        ];

        return ResultsService.store(updatedResults);
    }

    private static isSameFilePath(filePath: string, result: CheckovResult) {
        // There's a bug in Checkov that returns file_abs_path as a relative path instead of absolute path on full scans
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (isWindows()) {
            return formatWindowsAbsoluteFilePath(result.file_abs_path) === formatWindowsAbsoluteFilePath(filePath) ||
                formatWindowsAbsoluteFilePath(workspaceFolder + result.file_abs_path) === formatWindowsAbsoluteFilePath(filePath);
        }
        return result.file_abs_path === filePath || workspaceFolder + result.file_abs_path === filePath;
    }

    public static clear() {
        ResultsService.context.workspaceState.update(CONFIG.storage.resultsKey, undefined);
    }

    public static suppressResult(targetResult: CheckovResult, isPackageFile: boolean, skipRiskLineShifting: boolean) {
        const results = ResultsService.get();
        const targetResultIndex = ResultsService.getTargetResultIndex(targetResult);

        results.splice(targetResultIndex, 1);

        if (!isPackageFile) {
            for (const result of results) {
                if (skipRiskLineShifting && result.file_line_range[0] <= targetResult.file_line_range[0]) {
                    continue;
                }
                if (result.repo_file_path !== targetResult.repo_file_path || result.file_line_range[0] < targetResult.file_line_range[0]) {
                    continue;
                }
                result.file_line_range[0] = result.file_line_range[0] + 1;
                result.file_line_range[1] = result.file_line_range[1] + 1;
            }
        }

        ResultsService.store(results);
    }

    private static getTargetResultIndex(targetResult: CheckovResult): number {
        const results = ResultsService.get();
        return results.findIndex(({ check_id, repo_file_path, file_line_range }) => {
            return repo_file_path === targetResult.repo_file_path && check_id === targetResult.check_id && file_line_range[0] === targetResult.file_line_range[0];
        });
    }

    private static applyFilters(currentState: CheckovResult[]): CheckovResult[] {
        let filteredResult: CheckovResult[] = [];

        if (!ResultsService.filters.length) {
            return currentState;
        }

        for (const { filterName, filterValue } of ResultsService.filters) {
            filteredResult = [...filteredResult, ...currentState.filter(check => check[filterName] === filterValue)];
        }

        return filteredResult;
    }

    private static updatePluginState() {
        TreeDataProvidersContainer.refresh();
        CustomPopupService.highlightLines();
    }
}
