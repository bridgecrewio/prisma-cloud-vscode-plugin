import * as vscode from 'vscode';

import { CONFIG } from '../config';
import { CHECKOV_RESULT_CATEGORY } from '../constants';
import { CheckovResult } from '../types';
import { DiagnosticsService } from '../services';
import { TreeDataProvidersContainer } from '../views/interface/primarySidebar/services/treeDataProvidersContainer';
import { CategoriesService } from './categoriesService';

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

        const existingFilter = ResultsService.filters.find(filter => filter.filterName === filterName && filter.filterValue === filterValue);

        if (existingFilter) {
            ResultsService.filters = ResultsService.filters.filter(filter => filter.filterName === filterName && filter.filterValue !== filterValue);
            ResultsService.updatePluginState();
            return;
        }
        
        ResultsService.filters.push(newFilter);
        ResultsService.updatePluginState();
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
                return results.filter((result) => CategoriesService.isIaCRisk(result.check_id));
            case CHECKOV_RESULT_CATEGORY.SCA:
                return results.filter((result) => CategoriesService.isSCARisk(result.check_id));
            case CHECKOV_RESULT_CATEGORY.SECRETS:
                return results.filter((result) => CategoriesService.isSecretsRisk(result.check_id));
            case CHECKOV_RESULT_CATEGORY.LICENSES:
                return results.filter((result) => CategoriesService.isLicensesRisk(result.check_id));
        }
    }

    public static getByFilePath(filePath: string) {
        const results = ResultsService.get();

        if (vscode.workspace.workspaceFolders) {
            filePath = filePath.replace(vscode.workspace.workspaceFolders[0].uri.path, '');
        }

        return results.filter(result => result.repo_file_path === filePath);
    }

    public static store(results: CheckovResult[]) {
        ResultsService.context.workspaceState.update(CONFIG.storage.resultsKey, results);
        ResultsService.updatePluginState();
    }

    public static storeByFiles(files: string[], results: CheckovResult[]) {
        const storedResults = ResultsService.get();
        const updatedResults = [
            ...storedResults.filter((result) => !files.includes(result.file_abs_path)),
            ...results,
        ];

        return ResultsService.store(updatedResults);
    }

    public static clear() {
        ResultsService.context.workspaceState.update(CONFIG.storage.resultsKey, undefined);
    }

    public static suppressResult(targetResult: CheckovResult) {
        const results = ResultsService.get();
        const targetResultIndex = results.findIndex(({ check_id, repo_file_path, file_line_range }) => {
            return repo_file_path === targetResult.repo_file_path && check_id === targetResult.check_id && file_line_range[0] === targetResult.file_line_range[0];
        });

        results.splice(targetResultIndex, 1);

        for (const result of results) {
            if (result.repo_file_path !== targetResult.repo_file_path || result.file_line_range[0] < targetResult.file_line_range[0]) {
                continue;
            }
            result.file_line_range[0] = result.file_line_range[0] + 1;
            result.file_line_range[1] = result.file_line_range[1] + 1;
        }

        ResultsService.store(results);
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
        DiagnosticsService.calculateAndApply();
    }
};
