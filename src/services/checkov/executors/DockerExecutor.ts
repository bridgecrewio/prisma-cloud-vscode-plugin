import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';

import * as vscode from 'vscode';

import { CheckovInstall } from '../../../commands/checkov';
import { CONFIG } from '../../../config';
import { getCertificate, getPrismaApiUrl, getProxyConfigurations } from '../../../config/configUtils';
import logger from '../../../logger';
import { CheckovInstallation } from '../../../types';
import { asyncExec, isWindows } from '../../../utils';
import { parseUri } from '../../../utils/fileUtils';
import { reRenderViews } from '../../../views/interface/utils';
import { AbstractExecutor } from './abstractExecutor';
import * as path from 'path';

export class DockerExecutor extends AbstractExecutor {
    
    private static containerName: string;
    private static activeProcess: ChildProcessWithoutNullStreams;

    public static async execute(installation: CheckovInstallation, files?: string[]) {
        AbstractExecutor.isScanInProgress = true;
        await reRenderViews();
        const containerName = DockerExecutor.getConainerName();
        DockerExecutor.containerName = containerName[1];


        const args = [
            'run',
            ...DockerExecutor.getDockerParams(),
            ...containerName,
            ...DockerExecutor.getEnvs(),
            ...DockerExecutor.getVolumeMounts(files),
            ...DockerExecutor.getWorkdir(),
            ...DockerExecutor.getImage(),
            ...(await DockerExecutor.getCheckovCliParams(installation, DockerExecutor.fixFilePaths(files))),
        ];

        logger.info(`${installation.entrypoint} ${args.join(' ').replace(/[^:\s]*::[^:\s]*/, '')}`);
        DockerExecutor.activeProcess = spawn(installation.entrypoint, args, { shell: true });
        const executionResult = await DockerExecutor.handleProcessOutput(DockerExecutor.activeProcess);
        AbstractExecutor.isScanInProgress = false;
        await reRenderViews();

        return executionResult;
    }

    public static async stopExecution() {
        if (DockerExecutor.containerName) {
            try {
                const process = exec(`docker kill ${DockerExecutor.containerName}`);
                AbstractExecutor.isScanInProgress = false;
                await reRenderViews();

                if (process.stderr) {
                    process.stderr.on('data', (data) => logger.info('error' + data.toString()));
                }
            } catch (e) {
                logger.info(e);
            }
        }
    }

    private static getDockerParams() {
        return ['--rm', '--tty'];
    }

    private static getConainerName() {
        const containerName = `vscode-checkov-${Date.now()}`;

        return ['--name', containerName];
    }

    private static getEnvs() {
        const proxyConfigurations = getProxyConfigurations();
        const envs = [
            '--env', 'BC_SOURCE=vscode',
            '--env', `BC_SOURCE_VERSION=${vscode.extensions.getExtension(CONFIG.extensionId)?.packageJSON.version}`
        ];

        if (getPrismaApiUrl()) {
            envs.push('--env', `PRISMA_API_URL=${getPrismaApiUrl()}`);
        }

        if (proxyConfigurations) {
            envs.push('--env', `https_proxy=${proxyConfigurations}`);
            envs.push('--env', `http_proxy=${proxyConfigurations}`);
            envs.push('--env', `HTTPS_PROXY=${proxyConfigurations}`);
            envs.push('--env', `HTTP_PROXY=${proxyConfigurations}`);
        }

        return envs;
    }

    private static getVolumeMounts(files?: string[]) {
        const volumeMounts = [];
        if (files) {
            files.forEach(file => {
                const dir = path.dirname(file);
                volumeMounts.push('--volume', `"${dir}":"${dir}"`);
            });
        } else if (vscode.workspace.workspaceFolders) {
            const dir = parseUri(vscode.workspace.workspaceFolders[0].uri);
            volumeMounts.push('--volume', `${dir}:${dir}`);
        } else {
            AbstractExecutor.projectPaths.forEach(path => volumeMounts.push('--volume', `${path}:${path}`));
        }
        const cert = getCertificate();
        if (cert) {
            volumeMounts.push('--volume', `${cert}:${CONFIG.checkov.docker.certificateMountPath}`);
        }

        return volumeMounts;
    }

    private static getWorkdir() {
        if (vscode.workspace.workspaceFolders) {
            return ['--workdir', parseUri(vscode.workspace.workspaceFolders[0].uri)];
        }
        return [];
    }

    private static getImage() {
        return [`bridgecrew/checkov:${CheckovInstall.checkovVersion}`];
    }

    private static fixFilePaths(files?: string[]): string[] | undefined {
        if (isWindows() && files) {
            return files.map(file => `/${file}`);
        }
        return files;
    }

    public static async getCheckovVersion(installation: CheckovInstallation): Promise<string> {
        const args = [
            'run',
            ...DockerExecutor.getImage(),
            '-v'
        ];
        const {stdout} = await asyncExec(`${installation.entrypoint} ${args.join(' ')}`);
        return stdout.trim();
    }
}

