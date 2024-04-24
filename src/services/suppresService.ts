import { EOL } from 'os';
import { extname, basename } from 'path';
import * as vscode from 'vscode';

import { CheckovResult } from '../types';
import { CategoriesService, ResultsService } from '.';
import { SuppressPackageJsonService } from './suppresServicePackageJson';

export class SuppressService {
    public static async suppress(result: CheckovResult, justification?: string) {
        const workspaceEdit = new vscode.WorkspaceEdit();
        let suppressionComment = SuppressService.generateSuppressionComment(result, justification);
        const resultFileName = basename(result.repo_file_path);
        const resultFileUri = SuppressService.resolveResultFileUri(result);
        let resultPosition = SuppressService.resolveNegativeResultPosition(result);
        const isPackageFile = resultFileName === 'package.json';

        // if some files that should contain suppression after risk line
        if (SuppressService.isFileWithInsertionAfterRiskLine(result)) {
            resultPosition = SuppressService.resolvePositiveResultPosition(result);
        } else if (isPackageFile)  {
            const suppressPackageJsonService = new SuppressPackageJsonService(resultFileUri.path);
            suppressionComment = await suppressPackageJsonService.wrapWithSuppressionCommentsSection(suppressionComment);
            resultPosition = await suppressPackageJsonService.resolveResultPosition();
        }

        workspaceEdit.insert(resultFileUri, resultPosition, suppressionComment);

        await vscode.workspace.applyEdit(workspaceEdit);

        ResultsService.suppressResult(result, isPackageFile, SuppressService.isFileWithInsertionAfterRiskLine(result));
    }

    private static isFileWithInsertionAfterRiskLine(result: CheckovResult): boolean {
        const filesWithInsertionsAfterRiskLine = ['.bicep'];
        for (const file of filesWithInsertionsAfterRiskLine) {
            if (result.file_abs_path.endsWith(file)) {
                return true;
            }
        }

        return false;
    }

    private static resolveResultFileUri(result: CheckovResult) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        return vscode.Uri.joinPath(workspaceFolders![0].uri, result.repo_file_path);
    }

    private static resolveNegativeResultPosition(result: CheckovResult) {
        if (result.file_line_range[0] === 0) {
            return new vscode.Position(0, 0);
        }

        return new vscode.Position(result.file_line_range[0] - 1, 0);
    }

    private static resolvePositiveResultPosition(result: CheckovResult) {
        if (result.file_line_range[0] === 0) {
            return new vscode.Position(0, 0);
        }

        return new vscode.Position(result.file_line_range[0], 0);
    }

    private static generateSuppressionComment(result: CheckovResult, justification: string = 'ADD REASON') {
        const suppressionComment = `checkov:skip=${SuppressService.getSkipCheckId(result)}: ${justification}`;
        const resultFileExtension = extname(result.repo_file_path);

        switch (resultFileExtension) {
            case '.xml':
            case '.csproj':
                return `<!--${suppressionComment}-->${EOL}`;
            case '.mod':
            case '.kt':
            case '.gradle':
                return `// ${suppressionComment}${EOL}`;
            case '.json':
                return `"${suppressionComment}"`;
            default:
                return `# ${suppressionComment}${EOL}`;
        }
    }

    private static getSkipCheckId(result: CheckovResult): string {
        const { check_id, check_type } = result;
        if (CategoriesService.isIaCRisk(check_id, check_type) || CategoriesService.isSecretsRisk(check_id)) {
            return result.check_id;
        }

        if (CategoriesService.isSCARisk(check_id)) {
            return result.vulnerability_details?.id || result.check_id;
        }

        return 'Not supported risk for suppression';
    }
}
