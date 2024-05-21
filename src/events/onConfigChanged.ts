import * as vscode from 'vscode';
import { CONFIG } from '../config';

export class OnConfigChanged {
    private static alreadyPresented = false;

    public static async handle(event: vscode.ConfigurationChangeEvent) {
        if (!OnConfigChanged.alreadyPresented) {
            // Check if the specific configuration of interest has changed
            if (!CONFIG.userConfig.accessKey && !CONFIG.userConfig.secretKey) {
                vscode.window.showInformationMessage(`PLease note that if you'll set access key and secret key, Prisma will find more vulnerabilities type`);
                OnConfigChanged.alreadyPresented = true;
            }
        }
    }
};