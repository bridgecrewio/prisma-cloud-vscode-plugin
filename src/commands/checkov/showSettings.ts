import * as vscode from 'vscode';

export class ShowSettings {
    static execute() {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:"palo alto networks - prisma cloud.prisma-cloud"');
    }
}