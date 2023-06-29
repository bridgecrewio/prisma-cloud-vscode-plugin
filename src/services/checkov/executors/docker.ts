import { spawn } from 'child_process';

import * as vscode from 'vscode';

import { CONFIG, USER_CONFIG } from '../../../config';
import { AbstractExecutor } from './abstractExecutor';

export class DockerExecutor extends AbstractExecutor {
    public static async execute(filePath?: string) {
        const command = 'docker run';
        const args = [
            ...DockerExecutor.getDockerParams(),
            ...DockerExecutor.getConainerName(),
            ...DockerExecutor.getEnvs(),
            ...DockerExecutor.getVolumeMounts(),
            ...DockerExecutor.getWorkdir(),
            ...DockerExecutor.getImage(),
            ...DockerExecutor.getCheckovParams(filePath),
        ];

        const child = spawn(command, args, { shell: true });

        child.stdout.on('data', (data) => {
            console.log(data.toString());
        });
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


// docker run --rm --tty --name vscode-checkov-1687860740078 --env PRISMA_API_URL=https://api0.prismacloud.io --env LOG_LEVEL=DEBUG 
// --env BC_SOURCE=vscode --env BC_SOURCE_VERSION=1.0.95 -v "/Users/vtrofymenko/Projects/vscode-extension-test:/checkovScan" 
// -v "/Users/vtrofymenko/Documents/cacert.pem:/checkovCert/cacert.pem" -w /checkovScan bridgecrew/checkov:2.3.293 
// --ca-certificate "/checkovCert/cacert.pem" -f "Dockerfile" -s --bc-api-key 89fad78e-2b69-47b9-97e0-5c3d5fdb942f::OnOdzlnru2KtDI3yyqlOY4qo438= 
// --skip-check "BC_LIC*" -o json