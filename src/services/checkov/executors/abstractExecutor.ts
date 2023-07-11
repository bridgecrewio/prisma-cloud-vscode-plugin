import { ChildProcessWithoutNullStreams } from 'child_process';

import * as vscode from 'vscode';

import { CONFIG } from '../../../config';
import { CHECKOV_INSTALLATION_TYPE } from '../../../constants';
import { CheckovInstallation, CheckovOutput } from '../../../types';

export abstract class AbstractExecutor {
    protected static get projectPath() {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            return null;
        }

        return workspaceFolders[0].uri.fsPath;
    }

    protected static getCheckovCliParams(installation: CheckovInstallation, filePath?: string) {
        const checkovCliParams = [
            '--quiet',
            '--soft-fail',
            '--output', 'json',
            '--bc-api-key', `${CONFIG.userConfig.accessKey}::${CONFIG.userConfig.secretKey}`,
        ];

        if (filePath) {
            checkovCliParams.push('--file', `"${filePath}"`);
        } else {
            if (installation.type === CHECKOV_INSTALLATION_TYPE.DOCKER) {
                checkovCliParams.push('--directory', CONFIG.checkov.docker.sourceMountPath);
            } else {
                checkovCliParams.push('--directory', AbstractExecutor.projectPath!);
            }
        }

        if (CONFIG.checkov.skipChecks) {
            checkovCliParams.push('--skip-check', `"${CONFIG.checkov.skipChecks}"`);
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
                outputBuffers.push(data);
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
