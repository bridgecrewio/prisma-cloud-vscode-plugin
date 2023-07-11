import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { registerEvents } from './events';
import { initializeServices } from './services';
import { registerSidebar } from './views/interface/primarySidebar/views';

export function activate(context: vscode.ExtensionContext) {
	registerCommands(context);
	registerEvents();
	initializeServices(context);
	registerSidebar();
}

export function deactivate() {}
