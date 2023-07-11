import { CHECKOV_INSTALLATION_TYPE } from '../../constants';
import { CheckovInstallation, CheckovOutput, CheckovResult } from '../../types';
import { DockerExecutor, Pip3Executor } from './executors';
import { ResultsService } from '../resultsService';

export class CheckovExecutor {
    private static readonly executors = new Map<CHECKOV_INSTALLATION_TYPE, (installation: CheckovInstallation, filePath?: string) => Promise<CheckovOutput>>([
        [CHECKOV_INSTALLATION_TYPE.DOCKER, DockerExecutor.execute],
        [CHECKOV_INSTALLATION_TYPE.PIP3, Pip3Executor.execute],
    ]);

    public static async execute(filePath?: string) {
        const installation = CheckovExecutor.getInstallation();
        const executor = CheckovExecutor.executors.get(installation.type);

        if (!executor) {
            return;
        }

        const checkovOutput = await executor(installation, filePath);

        const results = checkovOutput.reduce((acc, checkType) => acc.concat(checkType.results.failed_checks), [] as CheckovResult[]);

        ResultsService.store(results);
    }

    private static getInstallation() {
        // return { type: CHECKOV_INSTALLATION_TYPE.PIP3, entrypoint: '/Users/vtrofymenko/Library/Python/3.11/bin/checkov' };
        return { type: CHECKOV_INSTALLATION_TYPE.DOCKER, entrypoint: 'docker' };
    }
};
