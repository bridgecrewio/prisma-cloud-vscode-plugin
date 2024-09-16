import * as vscode from 'vscode';
import logger from '../logger';
import { CheckovResult } from '../types';
import { formatWindowsAbsoluteFilePath, isWindows } from '../utils';

export class FilesService {

    public static async openResult(result: CheckovResult, line: number = 1) {
        if (line < 1) {
            line = 1;
        }
        if (!vscode.window.activeTextEditor) {
            vscode.commands.executeCommand('workbench.action.previousEditor');
        }
        try {
            return await this.openFile(result.file_abs_path, line);
        } catch (e: any) {
            // There's a bug in Checkov that returns file_abs_path as a relative path instead of absolute path on full scans
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                logger.warn(`Failed to open file ${result.file_abs_path}, will try to open relative to workspace`);
                return this.openFile(workspaceFolder.uri.fsPath + result.file_abs_path, line);
            }
            logger.error(`Failed to open file ${result.file_abs_path}: ${e.message}`, e);
        }
    }

    private static openFile(filePath: string, line: number) {
        if (isWindows()) {
            filePath = formatWindowsAbsoluteFilePath(filePath);
        }
        logger.info(`Opening file at ${filePath}`);
        return vscode.window.showTextDocument(vscode.Uri.file(filePath), { selection: new vscode.Range(line - 1, 0, line - 1, 0) });
    }
}
