import * as vscode from 'vscode';
import { CONFIG } from '../config';

const message = `You’re about to use the plugin without an API key. This means you’ll be utilizing Checkov open source with limited features. For a more comprehensive analysis and full functionality, we highly recommend using an API key to access the complete capabilities of Prisma Cloud.`;

export class OnConfigChanged {
    private static alreadyPresented = false;

    public static async handle(event: vscode.ConfigurationChangeEvent) {
        if (!OnConfigChanged.alreadyPresented) {
            // Check if the specific configuration of interest has changed
            if (!CONFIG.userConfig.accessKey && !CONFIG.userConfig.secretKey) {
                vscode.window.showInformationMessage(message);
                OnConfigChanged.alreadyPresented = true;
            }
        }
    }
};