import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { COMMAND } from './constants';
import { registerWindowEvents, registerWorkspaceEvents } from './events';
import { initializeServices } from './services';
import { registerSidebar } from './views/interface/primarySidebar';
import { registerCheckovResultView } from './views/interface/checkovResult';
import { registerCustomHighlight, lineClickDisposable } from './services/customPopupService';
import { initializeInstallationId } from './utils';
import { initializeAnalyticsService } from './services/analyticsService';

export async function activate(context: vscode.ExtensionContext) {	
	initializeInstallationId(context);
	await initializeAnalyticsService(context);
	registerCommands(context);
	initializeServices(context);
	registerWindowEvents();
	registerWorkspaceEvents();
	registerSidebar(context);
  	registerCheckovResultView(context);
	registerCustomHighlight(context);
	vscode.commands.executeCommand(COMMAND.CHECKOV_INSTALL);
}

export function deactivate() {
	if (lineClickDisposable) {
		lineClickDisposable.dispose();
	}
}
