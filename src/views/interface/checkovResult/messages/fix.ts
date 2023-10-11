
import { CheckovResultWebviewPanel } from '../webviewPanel';
import { FixService } from '../../../../services';
import { AnalyticsService } from '../../../../services/analyticsService';

export class FixMessage {
    public static async handle() {
        if (!CheckovResultWebviewPanel.checkovResult || !CheckovResultWebviewPanel.webviewPanel) {
            return;
        }

        await FixService.fix(CheckovResultWebviewPanel.checkovResult);
        await AnalyticsService.trackFixFromPanel();
    }
};
