import { ChildProcessWithoutNullStreams } from 'child_process';

import * as vscode from 'vscode';

import { CONFIG } from '../../../config';
import { CHECKOV_INSTALLATION_TYPE, REPO_ID } from '../../../constants';
import { CheckovInstallation, CheckovOutput } from '../../../types';

export abstract class AbstractExecutor {
    public static isScanInProgress: boolean = false;

    protected static get projectPath() {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            return null;
        }

        return `"${workspaceFolders[0].uri.path.replace(':', '')}"`;
    }

    protected static getCheckovCliParams(installation: CheckovInstallation, files?: string[]) {
        const checkovCliParams = [
            '--repo-id', REPO_ID,
            '--quiet',
            '--soft-fail',
            '--output', 'json',
            '--bc-api-key', `${CONFIG.userConfig.accessKey}::${CONFIG.userConfig.secretKey}`,
        ];

        if (files) {
            files.forEach((file) => checkovCliParams.push('--file', file));
        } else {
            checkovCliParams.push('--directory', AbstractExecutor.projectPath!);
        }

        if (CONFIG.userConfig.certificate) {
            if (installation.type === CHECKOV_INSTALLATION_TYPE.DOCKER) {
                checkovCliParams.push('--ca-certificate', `"${CONFIG.checkov.docker.certificateMountPath}"`);
            } else {
                checkovCliParams.push('--ca-certificate', `"${CONFIG.userConfig.certificate}"`);
            }
        }

        if (CONFIG.userConfig.useEnforcementRules) {
            checkovCliParams.push('--use-enforcement-rules');
        }

        return checkovCliParams;
    }

    protected static async handleProcessOutput(process: ChildProcessWithoutNullStreams): Promise<CheckovOutput> {
        return new Promise((resolve, reject) => {
            const outputBuffers: string[] = [];

            process.stdout.on('data', (data) => {
                if (outputBuffers.length || data.toString().startsWith('{') || data.toString().startsWith('[')) {
                    outputBuffers.push(data);
                }
            });

            process.on('error', (error) => {
                reject(new Error(error.toString()));
            });

            process.on('exit', (code) => {
                if (code !== 0) {
                    return reject(new Error(`The Checkov execution exited with code ${code}`));
                }

                const output = JSON.parse(outputBuffers.join('').replace(/.\[0m/g, ''));

                resolve(output);
            });
        });
    }
};
