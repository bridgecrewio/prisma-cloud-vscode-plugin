import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { registerEvents } from './events';

export function activate(context: vscode.ExtensionContext) {
	registerCommands(context);
	registerEvents();
}

export function deactivate() {}
