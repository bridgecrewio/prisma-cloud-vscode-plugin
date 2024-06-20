import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { COMMAND } from './constants';
import { registerWindowEvents, registerWorkspaceEvents } from './events';
import { initializeServices } from './services';
import { registerSidebar } from './views/interface/primarySidebar';
import { registerCheckovResultView } from './views/interface/checkovResult';
import { registerCustomHighlight, lineClickDisposable } from './services/customPopupService';
import { initializeInstallationId } from './utils';
import { initiateLogger } from './logger';
import { initializeAnalyticsService } from './services/analyticsService';
import { initializeCustomersModulesService } from './services/customersModulesService';
import { initializeAuthenticationService } from './services/authenticationService';

export async function activate(context: vscode.ExtensionContext) {
	initiateLogger(context.logUri.fsPath);

	initializeInstallationId(context);
	await initializeAuthenticationService(context);
	await initializeCustomersModulesService(context);
	initializeAnalyticsService(context);
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
