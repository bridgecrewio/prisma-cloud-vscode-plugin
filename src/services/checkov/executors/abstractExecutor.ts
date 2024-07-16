import { ChildProcessWithoutNullStreams } from 'child_process';

import * as vscode from 'vscode';

import { CONFIG } from '../../../config';
import { CHECKOV_INSTALLATION_TYPE, REPO_ID } from '../../../constants';
import { CheckovInstallation, CheckovOutput } from '../../../types';
import { getDirSize, isPipInstall, isWindows } from '../../../utils';
import { ShowSettings } from '../../../commands/checkov';
import logger from '../../../logger';
import { getAccessKey, getCertificate, getExternalChecksDir, getFrameworks, getNoCertVerify, getSastMaxSizeLimit, getSecretKey, getToken, shouldUseEnforcmentRules } from '../../../config/configUtils';


export abstract class AbstractExecutor {
    public static isScanInProgress: boolean = false;

    protected static get projectPath() {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            return null;
        }

        if (isWindows()) {
            if (isPipInstall()) {
                return `"${workspaceFolders[0].uri.fsPath.replace(/\\/g, '/')}"`;
            }
            else {
                return `"/${workspaceFolders[0].uri.path.replace(':', '')}"`;
            }
        }

        return `"${workspaceFolders[0].uri.path.replace(':', '')}"`;
    }

    protected static async getCheckovCliParams(installation: CheckovInstallation, files?: string[]) {
        const externalChecksDir = getExternalChecksDir();
        const noCertVerifyParam = getNoCertVerify();
        const frameworks = getFrameworks();
        const secretKey = getSecretKey();
        const accessKey = getAccessKey();
        const checkovCliParams = [
            '--repo-id', REPO_ID,
            '--quiet',
            '--soft-fail',
            '--output', 'json'
        ];

        if (accessKey && secretKey) {
            checkovCliParams.push('--bc-api-key', `${getToken()}`);
        }

        if (externalChecksDir) {
            checkovCliParams.push('--external-checks-dir', externalChecksDir);
        }

        if (noCertVerifyParam) {
            checkovCliParams.push('--no-cert-verify');
        }

        if (frameworks) {
            checkovCliParams.push('--framework', frameworks.join(' '));
        }

        if (files) {
            files.forEach((file) => checkovCliParams.push('--file', `"${file}"`));
        } else {
            checkovCliParams.push('--directory', AbstractExecutor.projectPath!);

            const shouldSkipSast = await AbstractExecutor.shouldSkipSast();

            if (shouldSkipSast) {
                checkovCliParams.push('--skip-framework', 'sast');
                vscode.window.showInformationMessage('SAST didn\'t run due to the size of the repository. Adjust this limit in the settings', 'Prisma Cloud Settings').then(() => {
                    ShowSettings.execute();
                });
            }
        }

        const cert = getCertificate();
        if (cert) {
            if (installation.type === CHECKOV_INSTALLATION_TYPE.DOCKER) {
                checkovCliParams.push('--ca-certificate', `"${CONFIG.checkov.docker.certificateMountPath}"`);
            } else {
                checkovCliParams.push('--ca-certificate', `"${cert}"`);
            }
        }

        if (shouldUseEnforcmentRules()) {
            checkovCliParams.push('--use-enforcement-rules');
        }

        return checkovCliParams;
    }

    protected static async handleProcessOutput(process: ChildProcessWithoutNullStreams): Promise<CheckovOutput> {
        return new Promise((resolve, reject) => {
            const outputBuffers: string[] = [];
            let containerOutput = '';

            process.stderr.on('data', (data: any) => {
                data=data.toString();
                containerOutput+=data;
            });

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
                    logger.info('Full error checkov process output: \n' + (containerOutput === '' ? 'no errors' : containerOutput));
                    return reject(new Error(`The Checkov execution exited with code ${code}`));
                }

                const output = JSON.parse(outputBuffers.join('').replace(/.\[0m/g, ''));

                resolve(output);
            });
        });
    }

    private static async shouldSkipSast(): Promise<boolean> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        try {
            if (workspaceFolders) {
                const dirSize = Math.round((await getDirSize(workspaceFolders[0].uri.path)) / 8 / 100000);
                const mbLimit = getSastMaxSizeLimit();
                return dirSize > mbLimit;
            }
    
            return false;
        } catch (e: any) {
            logger.error('Error during calculating folder size for SAST: ' + e.message);
            return true;
        }
    }
};
