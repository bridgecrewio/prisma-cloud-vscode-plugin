import * as vscode from 'vscode';

import { CheckovResultWebviewPanel } from '../webviewPanel';
import { SuppressService } from '../../../../services';

export class SuppressMessage {
    public static async handle() {
        if (!CheckovResultWebviewPanel.checkovResult || !CheckovResultWebviewPanel.webviewPanel) {
            return;
        }

        const justification = await vscode.window.showInputBox({
			placeHolder: 'Justification',
			prompt: 'Include a short justification for the suppression',
		});

        if (typeof justification === 'undefined') {
            return;
        }

        SuppressService.suppress(CheckovResultWebviewPanel.checkovResult, justification);

        CheckovResultWebviewPanel.webviewPanel.dispose();
    }
};
