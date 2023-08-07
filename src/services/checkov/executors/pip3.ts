import { spawn } from 'child_process';

import { CONFIG } from '../../../config';
import { AbstractExecutor } from './abstractExecutor';
import { CheckovInstallation } from '../../../types';

export class Pip3Executor extends AbstractExecutor {
    public static execute(installation: CheckovInstallation, files?: string[]) {
        const args = [
            ...Pip3Executor.getCheckovCliParams(installation, files),
        ];

        const process = spawn(installation.entrypoint, args, {
            shell: true,
            env: {
                PRISMA_API_URL: CONFIG.userConfig.prismaURL,
            },
        });

        return Pip3Executor.handleProcessOutput(process);
    }
};
