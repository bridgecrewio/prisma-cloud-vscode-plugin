import { ChildProcessWithoutNullStreams } from 'child_process';

import * as vscode from 'vscode';

import { ShowSettings } from '../../../commands/checkov';
import { CONFIG } from '../../../config';
import { getAccessKey, getCertificate, getExternalChecksDir, getFrameworks, getNoCertVerify, getSastMaxSizeLimit, getSecretKey, getToken, shouldUseEnforcmentRules } from '../../../config/configUtils';
import { CHECKOV_INSTALLATION_TYPE, REPO_ID } from '../../../constants';
import logger from '../../../logger';
import { CheckovInstallation, CheckovOutput } from '../../../types';
import { getDirSize } from '../../../utils';
import { getContainingFolderPath, parseUri } from '../../../utils/fileUtils';

export abstract class AbstractExecutor {
    public static isScanInProgress: boolean = false;

    /**
     * There are 3 possible situations when scanning operation starts:
     * 1. The IDE has standalone files opened that are not a part of any workspace
     * 2. The IDE has an opened workspace
     * 3. The IDE has an opened workspace and some standalone files outside of it that are also opened
     * @returns An array of directories containing all possible locations of files that should be scanned.
     */
    protected static get projectPaths(): string[] {
        const uris: vscode.Uri[] = [];
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            uris.push(workspaceFolders[0].uri);
        }
        vscode.window.tabGroups.all.forEach(tabGroup => 
            tabGroup.tabs.forEach(tab => {
                if (tab.input instanceof vscode.TabInputText) {
                    const document: vscode.TabInputText = tab.input;
                    if (workspaceFolders) {
                        if (!workspaceFolders.some(folder => document.uri.fsPath.startsWith(folder.name))) {
                            uris.push(getContainingFolderPath(document.uri));
                        }
                    } else {
                        uris.push(getContainingFolderPath(document.uri));
                    }
                }
            })
        );
        return uris.map(uri => parseUri(uri));
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
        } else if (vscode.workspace.workspaceFolders) {
            const directory = parseUri(vscode.workspace.workspaceFolders![0].uri);
            checkovCliParams.push('--directory', directory);
            const excludedPaths = AbstractExecutor.projectPaths.filter(path => !path.startsWith(directory));
            if (excludedPaths.length) {
                logger.warn(`There are files opened from outside the workspace that won't be scanned in these directories: ${excludedPaths}`);
                vscode.window.showWarningMessage('You have opened files from outside your workspace. Those files will not be scanned as part of a full scan');
            }
            const shouldSkipSast = await AbstractExecutor.shouldSkipSast();
            if (shouldSkipSast) {
                checkovCliParams.push('--skip-framework', 'sast');
                vscode.window.showInformationMessage('SAST didn\'t run due to the size of the repository. Adjust this limit in the settings', 'Prisma Cloud Settings').then(() => {
                    ShowSettings.execute();
                });
            }
        } else {
            // If there are no files and no workspace, scan all opened files in the editor
            vscode.window.tabGroups.all.forEach(tabGroup => 
                tabGroup.tabs.forEach(tab => 
                    tab.input instanceof vscode.TabInputText && checkovCliParams.push('--file', parseUri(tab.input.uri))
                )
            );
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
}
