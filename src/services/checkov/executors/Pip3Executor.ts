import { SpawnOptionsWithoutStdio, spawn } from 'child_process';
import * as vscode from 'vscode';

import { CheckovInstall } from '../../../commands/checkov';
import { getPrismaApiUrl, getProxyConfigurations } from '../../../config/configUtils';
import logger from '../../../logger';
import { CheckovInstallation, CheckovOutput } from '../../../types';
import { asyncExec, formatWindowsFilePath, isPipInstall, isWindows } from '../../../utils';
import { reRenderViews } from '../../../views/interface/utils';
import { AbstractExecutor } from './abstractExecutor';

export class Pip3Executor extends AbstractExecutor {
    
    private static pid: any;

    public static async execute(installation: CheckovInstallation, files?: string[]) {
        AbstractExecutor.isScanInProgress = true;
        const prismaApiUrl = getPrismaApiUrl();
        const proxySettings = getProxyConfigurations();
        await reRenderViews();
        const args = [
            ...(await Pip3Executor.getCheckovCliParams(installation, files)),
        ];

        logger.info(`${installation.entrypoint} ${args.join(' ').replace(/[^:\s]*::[^:\s]*/, '')}`);
        
        const env: any = {
            ...(isWindows() ? process.env : {}),
            PATH: CheckovInstall.processPathEnv,
            BC_SOURCE: 'vscode',
            BC_SOURCE_VERSION: '0.0.1',
        };

        if (prismaApiUrl) {
            env['PRISMA_API_URL'] = prismaApiUrl;
        }
        if (proxySettings) {
            env['https_proxy'] = proxySettings;
            env['http_proxy'] = proxySettings;
            env['HTTPS_PROXY'] = proxySettings;
            env['HTTP_PROXY'] = proxySettings;
        }

        const options: SpawnOptionsWithoutStdio = {
            shell: true,
            env: env,
            detached: !isWindows()
        };
        
        if (isWindows()) {
            // on windows the cwd is not the root directory, need to adjust it for supporting Checkov
            options.cwd = '/';
        }
        
        const scanProcess = spawn(installation.entrypoint, args, options);

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
                    // fixing a cases in windows where the file_abs_path return as "c:/users\\documents"
                    if (isWindows() && isPipInstall()) {
                        const fsPathLowerFirstLetter = fsPath.charAt(0).toLowerCase() + fsPath.slice(1);
                        const fsPathUpperFirstLetter = fsPath.charAt(0).toUpperCase() + fsPath.slice(1);
                        failedCheck.file_abs_path = failedCheck.file_abs_path.replace(/\//g, '\\');
                        failedCheck.repo_file_path = failedCheck.file_abs_path.replace(fsPathLowerFirstLetter, '').replace(fsPathUpperFirstLetter, '');
                        failedCheck.original_abs_path = failedCheck.file_abs_path;
                        failedCheck.repo_file_path = formatWindowsFilePath(failedCheck.repo_file_path);
                        failedCheck.file_path = formatWindowsFilePath(failedCheck.file_path);
                        failedCheck.file_abs_path = `/${formatWindowsFilePath(failedCheck.file_abs_path)}`;
                    } else {
                        failedCheck.repo_file_path = failedCheck.file_abs_path.replace(fsPath, '');
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

    public static async getCheckovVersion(installation: CheckovInstallation): Promise<string> {
        const {stdout} = await asyncExec(`${installation.entrypoint} -v`, {env: {PATH: CheckovInstall.processPathEnv}});
        return stdout.trim();
    }
};
