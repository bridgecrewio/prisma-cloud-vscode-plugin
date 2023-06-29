import * as vscode from 'vscode';

export class StatusBar {
    private static _instance: vscode.StatusBarItem;

    static {
        StatusBar._instance = vscode.window.createStatusBarItem();
        StatusBar._instance.text = 'Prisma Cloud';
        StatusBar._instance.show();
    }

    public static setText(text: string, icon?: string) {
        StatusBar._instance.text = StatusBar.getText(text, icon);
    }

    protected static getText(text = 'Prisma Cloud', icon?: string) {
        return `${ icon ? `$(${icon}) ` : '' }${text}`;
    }
};
