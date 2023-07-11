import { spawn } from 'child_process';

import * as vscode from 'vscode';

import { CONFIG, USER_CONFIG } from '../../../config';
import { AbstractExecutor } from './abstractExecutor';
import { CheckovInstallation, CheckovOutput } from '../../../types';

export class DockerExecutor extends AbstractExecutor {
    public static execute(installation: CheckovInstallation, filePath?: string) {
        const args = [
            'run',
            ...DockerExecutor.getDockerParams(),
            ...DockerExecutor.getConainerName(),
            ...DockerExecutor.getEnvs(),
            ...DockerExecutor.getVolumeMounts(),
            ...DockerExecutor.getWorkdir(),
            ...DockerExecutor.getImage(),
            ...DockerExecutor.getCheckovCliParams(installation, filePath),
        ];

        const process = spawn(installation.entrypoint, args, { shell: true });

        return DockerExecutor.handleProcessOutput(process);
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
            '--env', `PRISMA_API_URL=${USER_CONFIG.prismaURL}`,
        ];

        return envs;
    }

    private static getVolumeMounts() {
        const volumeMounts = [
            '--volume', `${DockerExecutor.projectPath}:${CONFIG.checkov.docker.sourceMountPath}`,
        ];

        if (USER_CONFIG.certificate) {
            volumeMounts.push('--volume', `${USER_CONFIG.certificate}:${CONFIG.checkov.docker.certificateMountPath}`);
        }

        return volumeMounts;
    }

    private static getWorkdir() {
        return ['--workdir', `${CONFIG.checkov.docker.sourceMountPath}`];
    }

    private static getImage() {
        return [`bridgecrew/checkov:${CONFIG.checkov.version}`];
    }
};

