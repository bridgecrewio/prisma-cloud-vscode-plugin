import * as vscode from 'vscode';

import { CheckovResultWebviewPanel } from '../webviewPanel';
import { SuppressService } from '../../../../services';
import { suppressionInputBoxOptions } from '../../../../constants';
import { AnalyticsService } from '../../../../services/analyticsService';

export class SuppressMessage {
    public static async handle() {
        if (!CheckovResultWebviewPanel.checkovResult || !CheckovResultWebviewPanel.webviewPanel) {
            return;
        }

        const justification = await vscode.window.showInputBox(suppressionInputBoxOptions);

        if (typeof justification === 'undefined') {
            return;
        }

        SuppressService.suppress(CheckovResultWebviewPanel.checkovResult, justification);
        await AnalyticsService.trackSuppressFromPanel();

        CheckovResultWebviewPanel.webviewPanel.dispose();
    }
};
