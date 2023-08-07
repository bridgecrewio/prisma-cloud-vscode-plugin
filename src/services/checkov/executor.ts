import * as vscode from 'vscode';

import { CHECKOV_INSTALLATION_TYPE } from '../../constants';
import { CheckovInstallation, CheckovOutput, CheckovResult } from '../../types';
import { DockerExecutor, Pip3Executor } from './executors';
import { ResultsService } from '../resultsService';
import { StatusBar } from '../../views';

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
    }

    private static processOutput(output: CheckovOutput) {
        console.log(output);
        if (Array.isArray(output)) {
            return output.reduce((acc: CheckovResult[], checkType) => acc.concat(checkType?.results.failed_checks ?? []), []);
        }
        console.log(output?.results);
        console.log(output?.results.failed_checks);
        return output.results?.failed_checks ?? [];
    }
};
