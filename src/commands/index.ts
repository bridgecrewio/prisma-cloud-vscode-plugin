import * as vscode from 'vscode';

import { COMMAND } from '../constants';
import { CheckovInstall, CheckovExecute, ShowSettings } from './checkov';

const commands = new Map<COMMAND, (context: vscode.ExtensionContext) => void>([
    [COMMAND.CHECKOV_INSTALL, CheckovInstall.execute],
    [COMMAND.CHECKOV_EXECUTE, CheckovExecute.execute],
    [COMMAND.SHOW_PLUGIN_SETTINGS, ShowSettings.execute],
]);

export function registerCommands(context: vscode.ExtensionContext): void {
    for (const [command, executor] of commands) {
        context.subscriptions.push(
            vscode.commands.registerCommand(command, () => executor(context)),
        );
    }
};
