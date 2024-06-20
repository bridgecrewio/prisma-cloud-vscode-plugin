import * as vscode from 'vscode';

import { COMMAND } from '../constants';
import { CheckovInstall, CheckovExecute, ShowSettings } from './checkov';
import { CategoriesService, CheckovExecutor, ResultsService } from '../services';
import { FiltersService } from '../services/filtersService';
import { LOG_FILE_NAME } from '../logger';

const commands = new Map<COMMAND, (context: vscode.ExtensionContext) => void>([
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
    [COMMAND.SHOW_WEAKNESSES, CategoriesService.showWeaknessesView],
    [COMMAND.HIDE_WEAKNESSES, CategoriesService.hideWeaknessesView],
]);

export function registerCommands(context: vscode.ExtensionContext): void {
    for (const [command, executor] of commands) {
        context.subscriptions.push(
            vscode.commands.registerCommand(command, () => executor(context)),
        );
    }
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND.OPEN_PRISMA_LOG, async () => {
            vscode.window.showTextDocument(vscode.Uri.joinPath(context.logUri, LOG_FILE_NAME));
        }),
    );
};
