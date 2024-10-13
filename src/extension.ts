import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { CommonsClient } from "./commons/commonsClient";
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
	try {
		initiateLogger(context.logUri.fsPath);
		logger.info(`Initiating Prisma Cloud VS Code extension version ${vscode.extensions.getExtension(CONFIG.extensionId)?.packageJSON.version}`);
		logger.info(`Plugin path: ${context.extensionPath}`);
		initializeInstallationId(context);
		CommonsClient.i().init(context);
		CommonsClient.i().helloWorld();
		logger.info(CommonsClient.i().add(3, 5));
		logger.info(CommonsClient.i().handleRequest(JSON.stringify({strings: ["test", "best"], anotherString: "mest", number: 1})));
		CustomersModulesService.loadCachedData(context);
		await initializeAuthenticationService(context);
		await initializeCustomersModulesService(context);
		initializeAnalyticsService(context);
		registerCommands(context);
		initializeServices(context);
		registerWindowEvents();
		registerWorkspaceEvents();
		registerSidebar();
		registerCheckovResultView(context);
		registerCustomHighlight(context);
		vscode.commands.executeCommand(COMMAND.CHECKOV_INSTALL, [context]);
	} catch (e) {
		logger.error('Failed to initialize extension', e);
	}
}

export function deactivate() {
	if (lineClickDisposable) {
		lineClickDisposable.dispose();
	}
}
