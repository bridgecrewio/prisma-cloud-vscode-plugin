import * as vscode from 'vscode';

import { CONFIG } from '../config';
import { CHECKOV_RESULT_CATEGORY } from '../constants';
import { CheckovResult } from '../types';
import { DiagnosticsService } from './index';
import { TreeDataProvidersContainer } from '../views/interface/primarySidebar/services/treeDataProvidersContainer';
import { CategoriesService } from './categoriesService';

export class ResultsService {
    private static context: vscode.ExtensionContext;

    public static initialize(context: vscode.ExtensionContext) {
        ResultsService.context = context;
    }

    public static get(): CheckovResult[] {
        return ResultsService.context.workspaceState.get(CONFIG.storage.resultsKey) ?? [];
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
        TreeDataProvidersContainer.refresh();
        DiagnosticsService.calculateAndApply();
    }

    public static storeByFilePath(filePath: string, results: CheckovResult[]) {
        const storedResults = ResultsService.get();
        const updatedResults = [
            ...storedResults.filter((result) => result.repo_file_path !== filePath),
            ...results,
        ];

        return ResultsService.store(updatedResults);
    }

    public static remove(targetResult: CheckovResult) {
        const storedResults = ResultsService.get();
        const targetResultIndex = storedResults.findIndex(({ check_id, repo_file_path, file_line_range }) => {
            return repo_file_path === targetResult.repo_file_path && check_id === targetResult.check_id && file_line_range[0] === targetResult.file_line_range[0];
        });

        ResultsService.store(storedResults.splice(targetResultIndex, 1));
    }

    public static clear() {
        ResultsService.context.workspaceState.update(CONFIG.storage.resultsKey, undefined);
    }

    public static shiftResultsPosition(filePath: string, startLine: number) {
        const results = ResultsService.get();

        for (const result of results) {
            if (result.repo_file_path !== filePath || result.file_line_range[0] < startLine) {
                continue;
            }
            result.file_line_range[0] = result.file_line_range[0] + 1;
            result.file_line_range[1] = result.file_line_range[1] + 1;
        }

        ResultsService.store(results);
    }

    public static suppressResult(targetResult: CheckovResult) {
        const results = ResultsService.get();
        const filteredResults = results.filter(({ check_id, repo_file_path, file_line_range }) => {
            return repo_file_path !== targetResult.repo_file_path && check_id === targetResult.check_id && file_line_range[0] === targetResult.file_line_range[0];
        });

        for (const result of filteredResults) {
            if (result.repo_file_path !== targetResult.repo_file_path || result.file_line_range[0] < targetResult.file_line_range[0]) {
                continue;
            }
            result.file_line_range[0] = result.file_line_range[0] + 1;
            result.file_line_range[1] = result.file_line_range[1] + 1;
        }

        ResultsService.store(filteredResults);
    }
};
