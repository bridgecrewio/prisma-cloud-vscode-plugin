import * as vscode from 'vscode';

export class SuppressMessage {
    public static async handle() {
        const justification = await vscode.window.showInputBox({
			placeHolder: 'Justification',
			prompt: 'Include a short justification for the suppression',
		});

        console.log(`Justification: ${justification}`);
    }
};
