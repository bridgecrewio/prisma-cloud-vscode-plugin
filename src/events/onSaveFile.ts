import * as vscode from 'vscode';

import { CONFIG } from '../config';
import { CheckovExecutor } from '../services';

export class OnSaveFile {
    private static changedFiles: string[] = [];
    private static releaseTimeoutId: ReturnType<typeof setTimeout> | null = null;

    public static handle(document: vscode.TextDocument) {
        if (document.uri.scheme === 'file') {
            clearTimeout(OnSaveFile.releaseTimeoutId!);

            if (!OnSaveFile.changedFiles.includes(document.fileName)) {
                OnSaveFile.changedFiles.push(document.fileName);
            }
    
            OnSaveFile.releaseTimeoutId = setTimeout(OnSaveFile.release, CONFIG.filesSyncInterval);
        }
    }

    private static async release() {
        await CheckovExecutor.execute(OnSaveFile.changedFiles);
        OnSaveFile.changedFiles = [];
    }
};
