import { EOL } from 'os';

import * as vscode from 'vscode';

import { CheckovResult } from '../types';
import { ResultsService } from '.';

export class SuppressService {
    public static async suppress(result: CheckovResult, justification?: string) {
        const workspaceEdit = new vscode.WorkspaceEdit();
        const suppressionComment = SuppressService.generateSuppressionComment(result);
        const resultFileUri = SuppressService.resolveResultFileUri(result);
        const resultPosition = SuppressService.resolveResultPosition(result);

        workspaceEdit.insert(resultFileUri, resultPosition, `# ${suppressionComment}: ${justification || 'ADD REASON'}${EOL}`);

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

    private static generateSuppressionComment(result: CheckovResult) {
        return `checkov:skip=${result.check_id}`;
    }
};
