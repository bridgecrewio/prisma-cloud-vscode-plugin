import * as vscode from 'vscode';

import { CheckovResultWebviewPanel } from './webviewPanel';

export function registerCheckovResultView(context: vscode.ExtensionContext) {
    CheckovResultWebviewPanel.initialize(context);
};

export * from './webviewPanel';
