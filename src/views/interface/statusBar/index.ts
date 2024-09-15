import * as vscode from 'vscode';

import { CONFIG } from '../../../config';
import { COMMAND } from '../../../constants';

export class StatusBar {

    private static instance: vscode.StatusBarItem;

    static {
        StatusBar.instance = vscode.window.createStatusBarItem();
        StatusBar.instance.text = CONFIG.userInterface.extensionTitle;
        StatusBar.instance.command = COMMAND.SHOW_PLUGIN_SETTINGS;
        StatusBar.instance.show();
    }

    public static progress() {
        StatusBar.instance.text = StatusBar.getText(CONFIG.userInterface.extensionTitle, 'sync~spin');
    }

    public static setText(text: string, icon?: string) {
        StatusBar.instance.text = StatusBar.getText(text, icon);
    }

    public static reset() {
        StatusBar.instance.text = CONFIG.userInterface.extensionTitle;
    }

    protected static getText(text = 'Prisma Cloud', icon?: string) {
        return `${ icon ? `$(${icon}) ` : '' }${text}`;
    }
}
