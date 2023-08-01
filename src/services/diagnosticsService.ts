import * as vscode from 'vscode';

import { CheckovResult } from '../types';
import { diagnosticsCollection } from '../constants/diagnosticsCollection';
import { ResultsService } from './resultsService';
import { createDiagnosticKey } from '../utils';
import { DIAGNOSTICS_MAP } from '../constants/diagnosticsCollection';
import { CHECKOV_RESULT_CATEGORY } from '../constants';
import { CategoriesService } from './categoriesService';

export function registerDiagnostics(context: vscode.ExtensionContext) {
    context.subscriptions.push(diagnosticsCollection);
	DiagnosticsService.calculateAndApply();
}

export interface DiagnosticReferenceCode {
    target: vscode.Uri;
    value: string;
}

export class DiagnosticsService {
    private static context: vscode.ExtensionContext;
    private static noDescription: string = 'No description for the risk';

    public static initialize(context: vscode.ExtensionContext) {
        DiagnosticsService.context = context;
    }

    static getFailedCheckForDiagnostic(checkKey: string) {
        const diagnosticsMap: Record<string, CheckovResult> = DiagnosticsService.context.workspaceState.get(DIAGNOSTICS_MAP) as Record<string, CheckovResult>;

        return  diagnosticsMap[checkKey];
    }

    static calculateAndApply() {
        const document = vscode.window.activeTextEditor?.document;

        if (document) {
            const failedChecks = ResultsService.getByFilePath(document.fileName);
            const foundDiagnostics: vscode.Diagnostic[] = [];

            for (const failedCheck of failedChecks) {
                const startLine = document.lineAt(failedCheck.file_line_range[0] > 0 ? failedCheck.file_line_range[0] - 1 : 0);
                const endLine = document.lineAt(failedCheck.file_line_range[1] > 0 ? failedCheck.file_line_range[1] - 1 : 0);
                const startPos = startLine.range.start.translate({ characterDelta: startLine.firstNonWhitespaceCharacterIndex });
                const endPos = endLine.range.end;
                const range = new vscode.Range(startPos, endPos);
                const code: DiagnosticReferenceCode | string =
                    failedCheck.guideline?.startsWith('http') ? 
                        {
                            target: vscode.Uri.parse(failedCheck.guideline),
                            value: 'Learn more'
                        } : `${failedCheck.guideline ? `: ${failedCheck.guideline}` : ''}`;
                const diagnostic: vscode.Diagnostic = {
                    message: `${failedCheck.severity ? (failedCheck.severity + ': ') : ''}${failedCheck.check_name}`,
                    range,
                    severity: vscode.DiagnosticSeverity.Error,
                    code,
                    relatedInformation: [{
                        location: {
                            uri: document.uri,
                            range,
                        },
                        message: this.getMessageByCategory(failedCheck, CategoriesService.getCategoryByCheckId(failedCheck.check_id)),
                    }],
                };
                const diagnosticsMap = DiagnosticsService.context.workspaceState.get(DIAGNOSTICS_MAP) as object;

                foundDiagnostics.push(diagnostic);
                DiagnosticsService.context.workspaceState.update(DIAGNOSTICS_MAP, {...diagnosticsMap, [createDiagnosticKey(diagnostic)]: failedCheck});
            }
            diagnosticsCollection.set(vscode.Uri.file(document.fileName), foundDiagnostics);
        }
    }

    static getMessageByCategory(failedCheck: CheckovResult, category?: CHECKOV_RESULT_CATEGORY,): string {
        switch (category) {
            case CHECKOV_RESULT_CATEGORY.SCA:
            case CHECKOV_RESULT_CATEGORY.LICENSES:
                return failedCheck.vulnerability_details?.description || this.noDescription;
            case CHECKOV_RESULT_CATEGORY.IAC:
            case CHECKOV_RESULT_CATEGORY.SECRETS:
                return failedCheck.description || this.noDescription;
            default:
                return this.noDescription;
        }
    }
};
