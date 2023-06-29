import * as vscode from 'vscode';

import { EVENT } from '../constants';
import { OnSaveFile } from './onSaveFile';

const events = new Map<EVENT, (document: vscode.TextDocument) => void>([
    [EVENT.SAVE_FILE, OnSaveFile.handle],
]);

export function registerEvents(): void {
    for (const [event, handler] of events) {
        vscode.workspace[event](handler);
    }
};
