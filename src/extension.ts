import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { CONFIG } from './config';
import { COMMAND } from './constants';
import { registerWindowEvents, registerWorkspaceEvents } from './events';
import logger, { initiateLogger } from './logger';
import { initializeServices } from './services';
import { initializeAnalyticsService } from './services/analyticsService';
import { initializeAuthenticationService } from './services/authenticationService';
import { CustomersModulesService, initializeCustomersModulesService } from './services/customersModulesService';
import { lineClickDisposable, registerCustomHighlight } from './services/customPopupService';
import { initializeInstallationId } from './utils';
import { registerCheckovResultView } from './views/interface/checkovResult';
import { registerSidebar } from './views/interface/primarySidebar';

export async function activate(context: vscode.ExtensionContext) {
	initiateLogger(context.logUri.fsPath);
	logger.info(`Initiating Prisma Cloud VS Code extension version ${vscode.extensions.getExtension(CONFIG.extensionId)?.packageJSON.version}`);
	logger.info(`Plugin path: ${context.extensionPath}`);
	initializeInstallationId(context);
	CustomersModulesService.loadCachedData(context);
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
