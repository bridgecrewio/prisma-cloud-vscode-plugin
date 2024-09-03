import * as path from 'path';
import * as vscode from 'vscode';
import { isPipInstall, isWindows } from '.';

export const getContainingFolderPath = (uri: vscode.Uri) => {
    const filePath = uri.fsPath;
    const folderPath = path.dirname(filePath);
    return vscode.Uri.file(folderPath);
};

export const parseUri = (uri: vscode.Uri) => {
    if (isWindows()) {
        if (isPipInstall()) {
            return `"${uri.fsPath.replace(/\\/g, '/')}"`;
        } else {
            return `"/${uri.path.replace(':', '')}"`;
        }
    }
    return `"${uri.path.replace(':', '')}"`;
};