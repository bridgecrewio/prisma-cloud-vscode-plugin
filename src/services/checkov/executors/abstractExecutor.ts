import * as vscode from 'vscode';

import { CONFIG, USER_CONFIG } from '../../../config';

export abstract class AbstractExecutor {
    protected static get projectPath() {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            return null;
        }

        return workspaceFolders[0].uri.fsPath;
    }

    protected static getCheckovParams(filePath?: string) {
        const checkovParams = [
            '-s',
            '--bc-api-key', `${USER_CONFIG.accessKey}::${USER_CONFIG.secretKey}`,
            '-o', 'json',
        ];

        if (USER_CONFIG.certificate) {
            checkovParams.push('--ca-certificate', `"${CONFIG.checkov.docker.certificateMountPath}"`);
        }
        if (CONFIG.checkov.skipChecks) {
            checkovParams.push('--skip-check', `"${CONFIG.checkov.skipChecks}"`);
        }
        if (filePath) {
            checkovParams.push('-f', `"${filePath}"`);
        } else {
            checkovParams.push('-d', CONFIG.checkov.docker.sourceMountPath);
        }

        return checkovParams;
    }
};
