import * as vscode from 'vscode';

import { CHECKOV_INSTALLATION_TYPE, USER_CONFIGURATION_PARAM } from '../../constants';
import { CheckovInstallation, CheckovOutput, CheckovResult } from '../../types';
import { DockerExecutor, Pip3Executor } from './executors';
import { ResultsService } from '../resultsService';
import { StatusBar } from '../../views';
import { CONFIG } from '../../config';
import { ShowSettings } from '../../commands/checkov';

export class CheckovExecutor {
    private static readonly executors = new Map<CHECKOV_INSTALLATION_TYPE, (installation: CheckovInstallation, files?: string[]) => Promise<CheckovOutput>>([
        [CHECKOV_INSTALLATION_TYPE.DOCKER, DockerExecutor.execute],
        [CHECKOV_INSTALLATION_TYPE.PIP3, Pip3Executor.execute],
    ]);
    private static installation: CheckovInstallation;

    public static initialize(installation: CheckovInstallation) {
        CheckovExecutor.installation = installation;
    }

    public static async execute(targetFiles?: string[]) {
        const installation = CheckovExecutor.installation;
        const executor = CheckovExecutor.executors.get(installation?.type);

        if (!executor) {
            return;
        }

        const emptyPrismaSettings = CheckovExecutor.getEmptyPrismaSettings();

        if (!emptyPrismaSettings.length) {
            vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
                StatusBar.progress();
                progress.report({
                    message: `Prisma Cloud is scanning your ${targetFiles ? 'files: ' + targetFiles.join(',') : 'project'}`,
                });
    
                const checkovOutput = await executor(installation, targetFiles);
    
                const results = CheckovExecutor.processOutput(checkovOutput);
    
                if (targetFiles) {
                    ResultsService.storeByFiles(targetFiles, results);
                } else {
                    vscode.window.showInformationMessage(`Prisma Cloud has detected ${results.length} code security issues in your project`);
                    ResultsService.store(results);
                }
    
                StatusBar.reset();
            });

            return;
        }

        ShowSettings.execute();
        vscode.window.showErrorMessage(`Fill following Prisma Cloud settings: ${emptyPrismaSettings.join(', ')}`);
    }

    private static processOutput(output: CheckovOutput) {
        if (Array.isArray(output)) {
            return output.reduce((acc: CheckovResult[], checkType) => acc.concat(checkType?.results.failed_checks ?? []), []);
        }

        return output.results?.failed_checks ?? [];
    }

    private static getEmptyPrismaSettings(): string[] {
        const requiredSettings = [
            USER_CONFIGURATION_PARAM.ACCESS_KEY, 
            USER_CONFIGURATION_PARAM.SECRET_KEY, 
            USER_CONFIGURATION_PARAM.PRISMA_URL
        ];
        const configParamToText: Record<string, string> = {
            [USER_CONFIGURATION_PARAM.ACCESS_KEY]: 'Access Key',
            [USER_CONFIGURATION_PARAM.SECRET_KEY]: 'Secret Key',
            [USER_CONFIGURATION_PARAM.PRISMA_URL]: 'Prisma URL'
        };
        const emptyParams: string[] = [];

        for (const setting of requiredSettings) {
            if (!CONFIG.userConfig[setting]) {
                emptyParams.push(configParamToText[setting]);
            }
        }

        return emptyParams;
    }
};
