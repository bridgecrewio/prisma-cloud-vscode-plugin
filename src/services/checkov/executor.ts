import { CHECKOV_INSTALLATION_TYPE } from '../../constants';
import { DockerExecutor } from './executors';

export class CheckovExecutor {
    private static readonly executors = new Map<CHECKOV_INSTALLATION_TYPE, () => void>([
        [CHECKOV_INSTALLATION_TYPE.DOCKER, DockerExecutor.execute],
    ]);

    public static async execute() {
        const installation = CheckovExecutor.getInstallation();

        if (!CheckovExecutor.executors.has(installation.type)) {
            return;
        }

        return CheckovExecutor.executors.get(installation.type)!();
    }

    private static getInstallation() {
        return { type: CHECKOV_INSTALLATION_TYPE.DOCKER, entrypoint: 'docker' };
    }
};
