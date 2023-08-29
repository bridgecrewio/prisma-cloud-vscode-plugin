import * as vscode from 'vscode';

import { CHECKOV_INSTALLATION_TYPE, USER_CONFIGURATION_PARAM } from '../../constants';
import { CheckovInstallation, CheckovOutput, CheckovResult } from '../../types';
import { DockerExecutor, Pip3Executor } from './executors';
import { ResultsService } from '../resultsService';
import { StatusBar } from '../../views';
import { CONFIG } from '../../config';
import { ShowSettings } from '../../commands/checkov';
import { AbstractExecutor } from './executors/abstractExecutor';
import { reRenderViews } from '../../views/interface/utils';

export class CheckovExecutor {
    private static readonly executors = new Map<CHECKOV_INSTALLATION_TYPE, typeof DockerExecutor | typeof Pip3Executor>([
        [CHECKOV_INSTALLATION_TYPE.DOCKER, DockerExecutor],
        [CHECKOV_INSTALLATION_TYPE.PIP3, Pip3Executor],
    ]);

    private static installation: CheckovInstallation;

    public static initialize(installation: CheckovInstallation) {
        CheckovExecutor.installation = installation;
    }

    public static getExecutor() {
        const installation = CheckovExecutor.installation;
        return CheckovExecutor.executors.get(installation?.type);
    }

    public static async execute(targetFiles?: string[]) {
        const installation = CheckovExecutor.installation;
        const executor = CheckovExecutor.getExecutor();

        if (!executor || AbstractExecutor.isScanInProgress) {
            return;
        }

        const emptyPrismaSettings = CheckovExecutor.getEmptyPrismaSettings();

        if (!emptyPrismaSettings.length) {
            vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
                let checkovOutput: CheckovOutput;
                StatusBar.progress();
                progress.report({
                    message: `Prisma Cloud is scanning your ${targetFiles ? 'files: ' + targetFiles.join(',') : 'project'}`,
                });

                try {
                    checkovOutput = await executor.execute(installation, targetFiles);
                } catch (e) {
                    AbstractExecutor.isScanInProgress = false;
                    await reRenderViews();
                    StatusBar.reset();
                    return;
                }
    
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

    public static stopExecution() {
        const installation = CheckovExecutor.installation;
        const executor = CheckovExecutor.executors.get(installation?.type);
        if (executor?.stopExecution) {
            executor.stopExecution();
            StatusBar.reset();
        }
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
