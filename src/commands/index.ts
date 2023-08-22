import * as vscode from 'vscode';

import { COMMAND } from '../constants';
import { CheckovInstall, CheckovExecute, ShowSettings } from './checkov';
import { CheckovExecutor } from '../services';

const commands = new Map<COMMAND, (context: vscode.ExtensionContext) => void>([
    [COMMAND.CHECKOV_INSTALL, CheckovInstall.execute],
    [COMMAND.CHECKOV_EXECUTE, CheckovExecute.execute],
    [COMMAND.SHOW_PLUGIN_SETTINGS, ShowSettings.execute],
    [COMMAND.CHECKOV_STOP_EXECUTE, CheckovExecutor.stopExecution]
]);

export function registerCommands(context: vscode.ExtensionContext): void {
    for (const [command, executor] of commands) {
        context.subscriptions.push(
            vscode.commands.registerCommand(command, () => executor(context)),
        );
    }
};
