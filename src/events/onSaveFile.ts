import * as vscode from 'vscode';

export class OnSaveFile {
    public static handle(document: vscode.TextDocument) {
        console.log(document);
        // execute Checkov for the target file
    }
};
