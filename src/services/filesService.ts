import * as vscode from 'vscode';

export class FilesService {
    private static context: vscode.ExtensionContext;

    public static initialize(context: vscode.ExtensionContext) {
        FilesService.context = context;
    }

    public static async openFile(file: string, line: number = 1) {
        if (line < 1) {
            line = 1;
        }
        if (!vscode.window.activeTextEditor) {
            vscode.commands.executeCommand('workbench.action.previousEditor');
        }
        return vscode.window.showTextDocument(vscode.Uri.file(file), { selection: new vscode.Range(line - 1, 0, line - 1, 0) });
    }
}
