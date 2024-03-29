import { spawn } from 'child_process';
import * as vscode from 'vscode';

import { CONFIG } from '../../../config';
import { AbstractExecutor } from './abstractExecutor';
import { CheckovInstallation, CheckovOutput } from '../../../types';
import { reRenderViews } from '../../../views/interface/utils';
import { CheckovInstall } from '../../../commands/checkov';
import { formatWindowsFilePath, isPipInstall, isWindows } from '../../../utils';

export class Pip3Executor extends AbstractExecutor {
    private static pid: any;

    public static async execute(installation: CheckovInstallation, files?: string[]) {
        AbstractExecutor.isScanInProgress = true;
        await reRenderViews();
        const args = [
            ...Pip3Executor.getCheckovCliParams(installation, files),
        ];

        console.log(`${installation.entrypoint} ${args.join(' ').replace(/[^:\s]*::[^:\s]*/, '')}`);
        const scanProcess = spawn(installation.entrypoint, args, {
            shell: true,
            env: {
                ...(isWindows() ? process.env : {}),
                PATH: CheckovInstall.processPathEnv,
                PRISMA_API_URL: CONFIG.userConfig.prismaURL,
                BC_SOURCE: 'vscode',
                BC_SOURCE_VERSION: '0.0.1',
            },
            detached: !isWindows(),
        });

        Pip3Executor.pid = scanProcess.pid;
        const processOutput = await Pip3Executor.handleProcessOutput(scanProcess);
        Pip3Executor.fixRepoFilePath(processOutput);
        AbstractExecutor.isScanInProgress = false;
        await reRenderViews();

        return processOutput;
    }

    public static async stopExecution() {
        if (Pip3Executor.pid) {
            process.kill(-Pip3Executor.pid);
            AbstractExecutor.isScanInProgress = false;
            await reRenderViews();
        }
    }

    private static fixRepoFilePath(result: CheckovOutput) {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            return;
        }

        const workspaceFolderPath = workspaceFolders[0].uri.fsPath;

        Pip3Executor.replacePath(result, workspaceFolderPath);

        return;
    }

    private static replacePath(result: CheckovOutput, fsPath: string) {
        if (Array.isArray(result)) {
            for (const output of result) {
                for (const failedCheck of output.results?.failed_checks) {
                    failedCheck.repo_file_path = failedCheck.file_abs_path.replace(fsPath, '');
                    if (isWindows() && isPipInstall()) {
                        failedCheck.original_abs_path = failedCheck.file_abs_path;
                        failedCheck.repo_file_path = formatWindowsFilePath(failedCheck.repo_file_path);
                        failedCheck.file_path = formatWindowsFilePath(failedCheck.file_path);
                        failedCheck.file_abs_path = `/${formatWindowsFilePath(failedCheck.file_abs_path)}`;
                    }
                }
            }
        } else {
            if (result.results) {
                for (const failedCheck of result.results?.failed_checks) {
                    failedCheck.repo_file_path = failedCheck.file_abs_path.replace(fsPath, '');
                    if (isWindows() && isPipInstall()) {
                        failedCheck.original_abs_path = failedCheck.file_abs_path;
                        failedCheck.repo_file_path = formatWindowsFilePath(failedCheck.repo_file_path);
                        failedCheck.file_path = formatWindowsFilePath(failedCheck.file_path);
                        failedCheck.file_abs_path = `/${formatWindowsFilePath(failedCheck.file_abs_path)}`;
                    }
                }
            }
        }
    }
};
