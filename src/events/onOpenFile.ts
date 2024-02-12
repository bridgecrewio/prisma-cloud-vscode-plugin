import * as vscode from 'vscode';
import { CheckovExecutor } from '../services';
import { AnalyticsService } from '../services/analyticsService';
import { AbstractExecutor } from '../services/checkov/executors/abstractExecutor';

export class OnOpenFile {
    public static async handle(document: vscode.TextDocument) {
        if (document && document.uri.scheme === 'file' && !AbstractExecutor.isScanInProgress) {
            const startTime = new Date();
            await CheckovExecutor.execute([document.fileName]);
            const endTime = new Date();
            if (!AbstractExecutor.isScanInProgress) {
                await AnalyticsService.trackOnOpenFileReaction({ reactionTime: endTime.getTime() - startTime.getTime() });
            }
        }
    }
};