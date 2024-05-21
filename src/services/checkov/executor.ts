import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

import { CHECKOV_INSTALLATION_TYPE, SEVERITY, USER_CONFIGURATION_PARAM } from '../../constants';
import { CheckovInstallation, CheckovOutput, CheckovResult } from '../../types';
import { DockerExecutor, Pip3Executor } from './executors';
import { ResultsService } from '../resultsService';
import { StatusBar } from '../../views';
import { CONFIG } from '../../config';
import { ShowSettings, CheckovInstall } from '../../commands/checkov';
import { AbstractExecutor } from './executors/abstractExecutor';
import { reRenderViews } from '../../views/interface/utils';
import { AnalyticsService } from '../analyticsService';
import { formatWindowsFilePath, isWindows } from '../../utils';
import logger from '../../logger';

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

        if (isWindows()) {
            targetFiles = targetFiles?.map(file => {
                if (CheckovInstall.installationType === CHECKOV_INSTALLATION_TYPE.DOCKER) {
                    return file[0] === '/' ? formatWindowsFilePath(file) : `/${formatWindowsFilePath(file)}`;
                } else {
                    return file;
                }
            });
        } 

        if (!executor || AbstractExecutor.isScanInProgress) {
            return;
        }

        const emptyPrismaSettings = CheckovExecutor.getEmptyPrismaSettings();

        if (!emptyPrismaSettings.length) {
            await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
                let checkovOutput: CheckovOutput;
                StatusBar.progress();
                progress.report({
                    message: `Prisma Cloud is scanning your ${targetFiles ? 'files: ' + targetFiles.join(',') : 'project'}`,
                });

                const startTime = new Date();
                try {
                    checkovOutput = await executor.execute(installation, targetFiles);
                } catch (e: any) {
                    logger.info(`The Checkov execution was failed due to: ${e.message}`);
                    AbstractExecutor.isScanInProgress = false;
                    await reRenderViews();
                    StatusBar.reset();
                    vscode.window.showErrorMessage(`Scanning is stopped due to: ${e.message}`);
                    return;
                }
                const endTime = new Date();
                const results = CheckovExecutor.processOutput(checkovOutput);
    
                if (targetFiles) {
                    ResultsService.storeByFiles(targetFiles, results);
                } else {
                    await AnalyticsService.trackFullScanEvent({ 
                        scanTime: endTime.getTime() - startTime.getTime(),
                        executorType: installation.type,
                        issuesFound: results.length,
                    });
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
            const failedChecks = output.reduce((acc: CheckovResult[], checkType) => {
                if (checkType) {
                    for (const check of checkType.results.failed_checks) {
                        check.check_type = checkType.check_type;
                        check.id = uuidv4();
                        check.severity = check.severity || SEVERITY.INFO;
                    };
                }
                return acc.concat(checkType?.results.failed_checks ?? []);
            }, []);

            return failedChecks;
        }

        // response from checkov with EmptyCheckovOutput type
        if (!output.results) {
            return [];
        }

        for (const failedCheck of output.results?.failed_checks) {
            failedCheck.id = uuidv4();
            failedCheck.check_type = output.check_type;
            failedCheck.severity = failedCheck.severity || SEVERITY.INFO;
        }

        return output.results?.failed_checks ?? [];
    }

    private static getEmptyPrismaSettings(): string[] {
        const requiredSettings: string[] = [];
        const configParamToText: Record<string, string> = {};
        const emptyParams: string[] = [];

        for (const setting of requiredSettings) {
            if (!CONFIG.userConfig[setting]) {
                emptyParams.push(configParamToText[setting]);
            }
        }

        return emptyParams;
    }
};
