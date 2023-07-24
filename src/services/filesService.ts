import * as vscode from 'vscode';

export class FilesService {
    private static context: vscode.ExtensionContext;

    public static initialize(context: vscode.ExtensionContext) {
        FilesService.context = context;
    }

    public static async openFile(file: string, line: number = 1) {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            return;
        }

        if (line < 1) {
            line = 1;
        }

        const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, file);

        if (!vscode.window.activeTextEditor) {
            vscode.commands.executeCommand('workbench.action.previousEditor');
        }

        return vscode.window.showTextDocument(fileUri, { selection: new vscode.Range(line - 1, 0, line - 1, 0) });
    }
};
