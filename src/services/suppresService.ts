import { EOL } from 'os';
import { extname } from 'path';

import * as vscode from 'vscode';

import { CheckovResult } from '../types';
import { ResultsService } from '.';

export class SuppressService {
    public static async suppress(result: CheckovResult, justification?: string) {
        const workspaceEdit = new vscode.WorkspaceEdit();
        const suppressionComment = SuppressService.generateSuppressionComment(result, justification);
        const resultFileExtension = extname(result.repo_file_path);
        const resultFileUri = SuppressService.resolveResultFileUri(result);
        const resultPosition = SuppressService.resolveResultPosition(result);

        // TODO: SCA (json) suppression implementation
        if (resultFileExtension === '.json') {
            vscode.window.showInformationMessage('The SCA suppression is not available yet');
            return;
        }

        workspaceEdit.insert(resultFileUri, resultPosition, `${suppressionComment}${EOL}`);

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
                return `<!--${suppressionComment}-->`;
            case '.mod':
            case '.kt':
            case '.gradle':
                return `// ${suppressionComment}`;
            case '.json':
                return suppressionComment;
            default:
                return `# ${suppressionComment}`;
        }
    }
};
