import { ChildProcessWithoutNullStreams, spawn, exec } from 'child_process';

import * as vscode from 'vscode';

import { CONFIG } from '../../../config';
import { AbstractExecutor } from './abstractExecutor';
import { CheckovInstallation } from '../../../types';
import { reRenderViews } from '../../../views/interface/utils';

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
            ...DockerExecutor.getVolumeMounts(),
            ...DockerExecutor.getWorkdir(),
            ...DockerExecutor.getImage(),
            ...DockerExecutor.getCheckovCliParams(installation, files),
        ];

        console.log(`${installation.entrypoint} ${args.join(' ').replace(/[^:\s]*::[^:\s]*/, '')}`);
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
                    process.stderr.on('data', (data) => console.log('error' + data.toString()));
                }
            } catch(e) {
                console.log(e);
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
        const envs = [
            '--env', 'BC_SOURCE=vscode',
            '--env', `BC_SOURCE_VERSION=${vscode.extensions.getExtension(CONFIG.extensionId)?.packageJSON.version}`,
            '--env', `PRISMA_API_URL=${CONFIG.userConfig.prismaURL}`,
        ];

        return envs;
    }

    private static getVolumeMounts() {
        const volumeMounts = [
            '--volume', `${DockerExecutor.projectPath}:${DockerExecutor.projectPath}`,
        ];

        if (CONFIG.userConfig.certificate) {
            volumeMounts.push('--volume', `${CONFIG.userConfig.certificate}:${CONFIG.checkov.docker.certificateMountPath}`);
        }

        return volumeMounts;
    }

    private static getWorkdir() {
        return ['--workdir', DockerExecutor.projectPath!];
    }

    private static getImage() {
        return [`bridgecrew/checkov:${CONFIG.checkov.version}`];
    }
};

