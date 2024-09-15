import * as vscode from 'vscode';

import {COMMAND} from '../constants';
import {CheckovExecute, CheckovInstall, ShowSettings} from './checkov';
import {CheckovExecutor} from '../services';
import {FiltersService} from '../services/filtersService';
import {LOG_FILE_NAME} from '../logger';
import {PrimarySidebar} from "../views/interface/primarySidebar";
import {AuthenticationService} from "../services/authenticationService";

const commands = new Map<COMMAND, (...args: any[]) => void>([
    [COMMAND.CHECKOV_INSTALL, CheckovInstall.execute],
    [COMMAND.CHECKOV_EXECUTE, CheckovExecute.execute],
    [COMMAND.SHOW_PLUGIN_SETTINGS, ShowSettings.execute],
    [COMMAND.CHECKOV_STOP_EXECUTE, CheckovExecutor.stopExecution],
    [COMMAND.FILTER_INFO_ENABLE, FiltersService.applyInfoSeverityFilter],
    [COMMAND.FILTER_INFO_DISABLE, FiltersService.applyInfoSeverityFilter],
    [COMMAND.FILTER_LOW_ENABLE, FiltersService.applyLowSeverityFilter],
    [COMMAND.FILTER_LOW_DISABLE, FiltersService.applyLowSeverityFilter],
    [COMMAND.FILTER_MEDIUM_ENABLE, FiltersService.applyMediumSeverityFilter],
    [COMMAND.FILTER_MEDIUM_DISABLE, FiltersService.applyMediumSeverityFilter],
    [COMMAND.FILTER_HIGH_ENABLE, FiltersService.applyHighSeverityFilter],
    [COMMAND.FILTER_HIGH_DISABLE, FiltersService.applyHighSeverityFilter],
    [COMMAND.FILTER_CRITICAL_ENABLE, FiltersService.applyCriticalSeverityFilter],
    [COMMAND.FILTER_CRITICAL_DISABLE, FiltersService.applyCriticalSeverityFilter],
    [COMMAND.CLICK_RESULT, PrimarySidebar.showTreeResult],
    [COMMAND.TEST_CONNECTION, testAppConnection]
]);

export function registerCommands(context: vscode.ExtensionContext): void {
    for (const [command, executor] of commands) {
        context.subscriptions.push(
            vscode.commands.registerCommand(command, executor),
        );
    }
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND.OPEN_PRISMA_LOG, async () => {
            vscode.window.showTextDocument(vscode.Uri.joinPath(context.logUri, LOG_FILE_NAME));
        }),
    );
}

async function testAppConnection() {
    const response = await AuthenticationService.login();
    if (response?.data?.token) {
        vscode.window.showInformationMessage('Connection successful');
    } else {
        vscode.window.showErrorMessage(`Failed to connect to the server: ${response}`);
    }
}
