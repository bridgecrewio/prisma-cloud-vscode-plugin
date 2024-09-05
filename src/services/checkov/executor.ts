import { v4 as uuidv4 } from 'uuid';
import * as vscode from 'vscode';

import { CheckovInstall, ShowSettings } from '../../commands/checkov';
import { CONFIG } from '../../config';
import { shouldDisableErrorMessage } from '../../config/configUtils';
import { CHECKOV_INSTALLATION_TYPE, SEVERITY } from '../../constants';
import logger from '../../logger';
import { CheckovInstallation, CheckovOutput, CheckovResult } from '../../types';
import { formatWindowsFilePath, isWindows } from '../../utils';
import { StatusBar } from '../../views';
import { reRenderViews } from '../../views/interface/utils';
import { AnalyticsService } from '../analyticsService';
import { ResultsService } from '../resultsService';
import { AbstractExecutor } from './executors/abstractExecutor';
import { DockerExecutor } from './executors/DockerExecutor';
import { Pip3Executor } from './executors/Pip3Executor';

export class CheckovExecutor {
    private static readonly executors = new Map<CHECKOV_INSTALLATION_TYPE, typeof DockerExecutor | typeof Pip3Executor>([
        [CHECKOV_INSTALLATION_TYPE.DOCKER, DockerExecutor],
        [CHECKOV_INSTALLATION_TYPE.PIP3, Pip3Executor],
    ]);

    private static installation: CheckovInstallation;
    private static actualCheckovVersion?: string;

    public static async initialize(installation: CheckovInstallation) {
        CheckovExecutor.installation = installation;
        const executor = CheckovExecutor.executors.get(installation.type);
        executor ?
            CheckovExecutor.actualCheckovVersion = await CheckovExecutor.executors.get(installation.type)?.getCheckovVersion(installation) :
            logger.error(`No executor found for ${installation?.type}, can't determine Checkov version`);
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

        if (!executor) {
            logger.error(`No executor found for ${installation?.type}, aborting scan operation`);
            return;
        }

        if (AbstractExecutor.isScanInProgress) {
            logger.info('Existing scan already in progress, will not run a new one');
            return;
        }

        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1 && !targetFiles) {
            vscode.window.showWarningMessage('Full scan is only supported when working with a single VS Code workspace');
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
                    logger.info(`Checkov execution failed due to: ${e.message}`);
                    AbstractExecutor.isScanInProgress = false;
                    await reRenderViews();
                    StatusBar.reset();
                    if (!shouldDisableErrorMessage()) {
                        vscode.window.showErrorMessage(`Scanning stopped due to: ${e.message}`);
                    }
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
        
        if (!shouldDisableErrorMessage()) {
            vscode.window.showErrorMessage(`Fill the following Prisma Cloud settings: ${emptyPrismaSettings.join(', ')}`);
        }
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
            return  output.reduce((acc: CheckovResult[], checkType) => {
                if (checkType) {
                    for (const check of checkType.results.failed_checks) {
                        check.check_type = checkType.check_type;
                        check.id = uuidv4();
                        check.severity = check.severity || SEVERITY.INFO;
                    }
                }
                return acc.concat(checkType?.results.failed_checks ?? []);
            }, []);
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

    public static get checkovVersion() {
        return CheckovExecutor.actualCheckovVersion;
    }
}
