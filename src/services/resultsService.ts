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

        console.log(results.length);

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
        return results.filter(result => result.file_abs_path === filePath);
    }

    public static store(results: CheckovResult[]) {
        ResultsService.context.workspaceState.update(CONFIG.storage.resultsKey, results);
        TreeDataProvidersContainer.refresh();
        DiagnosticsService.calculateAndApply();
    }

    public static updateByFilePath(filePath: string, results: CheckovResult[]) {
        const storedResults = ResultsService.get();
        const updatedResults = [
            ...storedResults.filter((result) => result.repo_file_path !== filePath),
            ...results,
        ];

        return ResultsService.store(updatedResults);
    }
};
