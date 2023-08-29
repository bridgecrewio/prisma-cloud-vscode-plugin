import { spawn } from 'child_process';

import { CONFIG } from '../../../config';
import { AbstractExecutor } from './abstractExecutor';
import { CheckovInstallation } from '../../../types';
import { reRenderViews } from '../../../views/interface/utils';

export class Pip3Executor extends AbstractExecutor {
    private static pid: any;

    public static async execute(installation: CheckovInstallation, files?: string[]) {
        AbstractExecutor.isScanInProgress = true;
        await reRenderViews();
        const args = [
            ...Pip3Executor.getCheckovCliParams(installation, files),
        ];

        const process = spawn(installation.entrypoint, args, {
            shell: true,
            env: {
                PRISMA_API_URL: CONFIG.userConfig.prismaURL,
            },
            detached: true,
        });

        Pip3Executor.pid = process.pid;
        const processOutput = await Pip3Executor.handleProcessOutput(process);
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
};
