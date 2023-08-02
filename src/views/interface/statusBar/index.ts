import * as vscode from 'vscode';

import { CONFIG } from '../../../config';

export class StatusBar {
    private static instance: vscode.StatusBarItem;

    static {
        StatusBar.instance = vscode.window.createStatusBarItem();
        StatusBar.instance.text = CONFIG.userInterface.statusBarText;
        StatusBar.instance.show();
    }

    public static setProgressState() {
        StatusBar.instance.text = StatusBar.getText(CONFIG.userInterface.statusBarText, 'sync~spin');
    }

    public static setText(text: string, icon?: string) {
        StatusBar.instance.text = StatusBar.getText(text, icon);
    }

    public static reset() {
        StatusBar.instance.text = CONFIG.userInterface.statusBarText;
    }

    protected static getText(text = 'Prisma Cloud', icon?: string) {
        return `${ icon ? `$(${icon}) ` : '' }${text}`;
    }
};
