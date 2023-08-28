import { EOL } from 'os';
import { extname, basename } from 'path';
import * as vscode from 'vscode';

import { CheckovResult } from '../types';
import { ResultsService } from '.';
import { SuppressServicePackageJson } from './suppresServicePackageJson';

export class SuppressService {
    public static async suppress(result: CheckovResult, justification?: string) {
        const workspaceEdit = new vscode.WorkspaceEdit();
        let suppressionComment = SuppressService.generateSuppressionComment(result, justification);
        const resultFileName = basename(result.repo_file_path);
        const resultFileUri = SuppressService.resolveResultFileUri(result);
        let resultPosition = SuppressService.resolveResultPosition(result);

        if (resultFileName === 'package.json')  {
            const suppressServicePackageJson = new SuppressServicePackageJson(resultFileUri.path);
            suppressionComment = await suppressServicePackageJson.wrapWithSuppressionCommentsSection(suppressionComment);
            resultPosition = await suppressServicePackageJson.resolveResultPosition();
        }

        workspaceEdit.insert(resultFileUri, resultPosition, suppressionComment);

        await vscode.workspace.applyEdit(workspaceEdit);

        ResultsService.suppressResult(result);
    }

    private static resolveResultFileUri(result: CheckovResult) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        return vscode.Uri.joinPath(workspaceFolders![0].uri, result.repo_file_path);
    }

    private static resolveResultPosition(result: CheckovResult) {
        if (result.file_line_range[0] === 0) {
            return new vscode.Position(0, 0);
        }

        return new vscode.Position(result.file_line_range[0] - 1, 0);
    }

    private static generateSuppressionComment(result: CheckovResult, justification: string = 'ADD REASON') {
        const suppressionComment = `checkov:skip=${result.check_id}: ${justification}`;
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
}
