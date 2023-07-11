import { ChildProcessWithoutNullStreams } from 'child_process';

import * as vscode from 'vscode';

import { CONFIG, USER_CONFIG } from '../../../config';
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
        const checkovParams = [
            '--quiet',
            '--soft-fail',
            '--output', 'json',
            '--bc-api-key', `${USER_CONFIG.accessKey}::${USER_CONFIG.secretKey}`,
        ];

        if (USER_CONFIG.certificate) {
            if (installation.type === CHECKOV_INSTALLATION_TYPE.DOCKER) {
                checkovParams.push('--ca-certificate', `"${CONFIG.checkov.docker.certificateMountPath}"`);
            } else {
                checkovParams.push('--ca-certificate', `"${USER_CONFIG.certificate}"`);
            }
        }

        if (CONFIG.checkov.skipChecks) {
            checkovParams.push('--skip-check', `"${CONFIG.checkov.skipChecks}"`);
        }

        if (filePath) {
            checkovParams.push('-f', `"${filePath}"`);
        } else {
            if (installation.type === CHECKOV_INSTALLATION_TYPE.DOCKER) {
                checkovParams.push('-d', CONFIG.checkov.docker.sourceMountPath);
            } else {
                checkovParams.push('-d', AbstractExecutor.projectPath!);
            }
        }

        return checkovParams;
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
