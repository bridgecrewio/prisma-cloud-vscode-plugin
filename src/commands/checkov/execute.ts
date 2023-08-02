import * as vscode from 'vscode';

import { CheckovExecutor } from '../../services';
import { StatusBar } from '../../views';

export class CheckovExecute {
    public static async execute() {
        StatusBar.setText('Running Scanning', 'sync~spin');

        vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
            progress.report({
                message: 'Prisma Cloud is scanning your repository',
            });

            await CheckovExecutor.execute();

            StatusBar.reset();
        });
    }
};
