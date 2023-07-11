import * as vscode from 'vscode';

import { CONFIG } from '../config';
import { CHECKOV_RESULT_CATEGORY } from '../constants';
import { CheckovResult } from '../types';

export class ResultsService {
    private static context: vscode.ExtensionContext;

    public static initialize(context: vscode.ExtensionContext) {
        ResultsService.context = context;
    }

    public static get(): CheckovResult[] {
        return ResultsService.context.workspaceState.get(CONFIG.storage.resultsKey) as CheckovResult[];
    }

    public static getByCategory(category: CHECKOV_RESULT_CATEGORY) {
        const results = ResultsService.get();

        switch (category) {
            case CHECKOV_RESULT_CATEGORY.IAC:
                return results.filter((result) => ['BC_VUL', 'CKV_SECRET', 'BC_LIC'].every((prefix) => !result.check_id.startsWith(prefix)));
            case CHECKOV_RESULT_CATEGORY.SCA:
                return results.filter((result) => result.check_id.startsWith('BC_VUL'));
            case CHECKOV_RESULT_CATEGORY.SECRETS:
                return results.filter((result) => result.check_id.startsWith('CKV_SECRET'));
            case CHECKOV_RESULT_CATEGORY.LICENSES:
                return results.filter((result) => result.check_id.startsWith('BC_LIC'));
        }
    }

    public static store(results: CheckovResult[]) {
        return ResultsService.context.workspaceState.update(CONFIG.storage.resultsKey, results);
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
