import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { registerEvents } from './events';
import { initializeServices } from './services';

export function activate(context: vscode.ExtensionContext) {
	registerCommands(context);
	registerEvents();
	initializeServices(context);
}

export function deactivate() {}
