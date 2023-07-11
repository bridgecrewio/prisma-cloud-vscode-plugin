import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { registerEvents } from './events';
import { registerSidebar } from './views/interface/primarySidebar/views';

export function activate(context: vscode.ExtensionContext) {
	registerCommands(context);
	registerEvents();
	registerSidebar();
}

export function deactivate() {}
