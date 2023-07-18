import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { registerEvents } from './events';
import { initializeServices } from './services';
import { registerSidebar } from './views/interface/primarySidebar/views';
import { registerCheckovResultView } from './views/interface/checkovResult';

export function activate(context: vscode.ExtensionContext) {
	registerCommands(context);
	registerEvents();
	initializeServices(context);
	registerSidebar();
  	registerCheckovResultView(context);
}

export function deactivate() {}
