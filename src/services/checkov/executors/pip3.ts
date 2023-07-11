import { spawn } from 'child_process';

import { USER_CONFIG } from '../../../config';
import { AbstractExecutor } from './abstractExecutor';
import { CheckovInstallation } from '../../../types';

export class Pip3Executor extends AbstractExecutor {
    public static execute(installation: CheckovInstallation, filePath?: string) {
        const args = [
            ...Pip3Executor.getCheckovCliParams(installation, filePath),
        ];

        const process = spawn(installation.entrypoint, args, {
            shell: true,
            env: {
                PRISMA_API_URL: USER_CONFIG.prismaURL,
            },
        });

        return Pip3Executor.handleProcessOutput(process);
    }
};
