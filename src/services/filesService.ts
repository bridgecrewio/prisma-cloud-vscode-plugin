import * as vscode from 'vscode';
import logger from '../logger';
import { CheckovResult } from '../types';
import { formatWindowsAbsoluteFilePath, isWindows } from '../utils';

export class FilesService {
    private static context: vscode.ExtensionContext;

    public static initialize(context: vscode.ExtensionContext) {
        FilesService.context = context;
    }

    public static async openResult(result: CheckovResult, line: number = 1) {
        if (line < 1) {
            line = 1;
        }
        if (!vscode.window.activeTextEditor) {
            vscode.commands.executeCommand('workbench.action.previousEditor');
        }
        let filePath;
        if (isWindows()) {
            filePath = formatWindowsAbsoluteFilePath(result.file_abs_path);
        } else {
            filePath = result.file_abs_path;
        }
        logger.info(`Opening file at ${filePath}`);
        return vscode.window.showTextDocument(vscode.Uri.file(filePath), { selection: new vscode.Range(line - 1, 0, line - 1, 0) });
    }
}
