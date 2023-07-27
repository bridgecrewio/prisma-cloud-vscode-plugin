import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { registerWindowEvents, registerWorkspaceEvents } from './events';
import { initializeServices } from './services';
import { registerSidebar } from './views/interface/primarySidebar/views';
import { registerCheckovResultView } from './views/interface/checkovResult';
import { registerDiagnostics } from './services/diagnosticsService';

export function activate(context: vscode.ExtensionContext) {	
	registerCommands(context);
	initializeServices(context);
	registerWindowEvents();
	registerWorkspaceEvents();
	registerDiagnostics(context);
	registerSidebar();
  	registerCheckovResultView(context);
}

export function deactivate() {}
