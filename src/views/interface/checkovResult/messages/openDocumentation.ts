import * as vscode from 'vscode';
import { AnalyticsService } from '../../../../services/analyticsService';

export class OpenDocumentation {
    public static async handle({ url }: { url?: string }) {
        if (url) {
            await vscode.env.openExternal(vscode.Uri.parse(url));
            await AnalyticsService.trackDocumentationClick();
            return;
        }

        throw new Error('There is no url for opening documentation');
    }
}