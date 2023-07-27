import * as vscode from 'vscode';

import { WORKSPACE_EVENTS, WINDOW_EVENTS } from '../constants';
import { OnSaveFile } from './onSaveFile';
import { OnChangeActiveTextEditor } from './onChangeActiveTextEditor';

const workspaceEvents = new Map<WORKSPACE_EVENTS, (document: vscode.TextDocument) => void>([
    [WORKSPACE_EVENTS.SAVE_FILE, OnSaveFile.handle],
]);

const windowEvents = new Map<WINDOW_EVENTS, (editor?: vscode.TextEditor) => void>([
    [WINDOW_EVENTS.CHANGE_ACTIVE_TEXT_EDITOR, OnChangeActiveTextEditor.handle],
]);

export function registerWindowEvents(): void {
    for (const [event, handler] of windowEvents) {
        vscode.window[event](handler);
    }
}

export function registerWorkspaceEvents(): void {
    for (const [event, handler] of workspaceEvents) {
        vscode.workspace[event](handler);
    }
};
