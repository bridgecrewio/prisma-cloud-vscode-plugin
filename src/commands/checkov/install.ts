import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { EOL } from 'os';

import * as semver from 'semver';
import * as path from 'path';
import * as vscode from 'vscode';

import { CONFIG } from '../../config';
import { CHECKOV_INSTALLATION_TYPE } from '../../constants';
import { StatusBar } from '../../views';
import { asyncExec, isWindows, formatError } from '../../utils';
import { CheckovExecutor } from '../../services';
import logger from '../../logger';
import { getCheckovVersion } from '../../config/configUtils';

export class CheckovInstall {
    public static processPathEnv: string;
    public static checkovVersion: string;
    public static installationType: CHECKOV_INSTALLATION_TYPE;
    private static readonly installations = [
        CheckovInstall.withDocker,
        CheckovInstall.withPip3,
        CheckovInstall.withPipenv,
    ];

    public static async execute(context: vscode.ExtensionContext) {
        try {
            StatusBar.progress();

            CheckovInstall.checkovVersion = getCheckovVersion();
            for (const installation of CheckovInstall.installations) {
                const installationResult = await installation(context);
    
                if (installationResult) {
                    CheckovExecutor.initialize(installationResult);
                    logger.info('Checkov installation was succeed', installationResult);
                    return;
                }
            }

            throw new Error('The Checkov can not be installed');
        } catch (error) {
            throw error;
        } finally {
            StatusBar.reset();
        }
    }

    private static async withDocker() {
        logger.info('Installing Checkov with Docker');

        try {
            await asyncExec(`docker pull bridgecrew/checkov:${CheckovInstall.checkovVersion}`);

            const entrypoint = await CheckovInstall.resolveEntrypoint(CHECKOV_INSTALLATION_TYPE.DOCKER);
            CheckovInstall.installationType = CHECKOV_INSTALLATION_TYPE.DOCKER;

            return { type: CHECKOV_INSTALLATION_TYPE.DOCKER, entrypoint };
        } catch (error) {
            logger.error('The Checkov installation with Docker was failed', { error: formatError(error as Error) });
            return false;
        }
    }

    private static async withPip3() {
        logger.info('Installing Checkov with Pip3');
        let firstTry = true;
        let pythonExe = 'python3';
        let pipExe = 'pip3';

        while (true) {
            try {
                const isPythonVersionSuitable = await CheckovInstall.isPythonVersionSuitable(`${pythonExe} --version`);
    
                if (!isPythonVersionSuitable) {
                    return false;
                }
    
                (await asyncExec(`${pipExe} install --user -U -i https://pypi.org/simple/ checkov${CheckovInstall.checkovVersion === 'latest' ? '' : `==${CheckovInstall.checkovVersion}`}`));
                if (isWindows()) {
                    CheckovInstall.processPathEnv = (await asyncExec('echo %PATH%')).stdout.trim();
                } else {
                    CheckovInstall.processPathEnv = (await asyncExec('echo $PATH')).stdout.trim();
                    CheckovInstall.processPathEnv = (await asyncExec(`${pythonExe} -c "import site; print(site.USER_BASE)"`)).stdout.trim() + '/bin' + ':' + CheckovInstall.processPathEnv;
                }
    
                const entrypoint = await CheckovInstall.resolveEntrypoint(CHECKOV_INSTALLATION_TYPE.PIP3);
                CheckovInstall.installationType = CHECKOV_INSTALLATION_TYPE.PIP3;
    
                return { type: CHECKOV_INSTALLATION_TYPE.PIP3, entrypoint };
            } catch (error) {
                logger.error(`The Checkov installation with ${pythonExe} was failed`, { error: formatError(error as Error) });
                if (firstTry) {
                    logger.info('Retrying using `python` and `pip`');
                    pythonExe = 'python';
                    pipExe = 'pip';
                    firstTry = false;
                } else {
                    return false;
                }
            }
        }
    }

    private static async withPipenv(context: vscode.ExtensionContext) {
        logger.info('Installing Checkov with Pipenv');

        try {
            const isPythonVersionSuitable = await CheckovInstall.isPythonVersionSuitable('pipenv run python --version');

            if (!isPythonVersionSuitable) {
                return false;
            }

            const installationDir = vscode.Uri.joinPath(context.globalStorageUri, 'checkov').fsPath;

            await mkdir(installationDir, { recursive: true });

            await asyncExec('pipenv --python 3 install checkov~=2.0.0', { cwd: installationDir });

            const entrypoint = await CheckovInstall.resolveEntrypoint(CHECKOV_INSTALLATION_TYPE.PIPENV, installationDir);

            return { type: CHECKOV_INSTALLATION_TYPE.PIPENV, entrypoint };
        } catch (error) {
            logger.error('The Checkov installation with Pipenv was failed', { error: formatError(error as Error) });
            return false;
        }
    }

    private static async isPythonVersionSuitable(extractionCommand: string) {
        logger.info('Checking the Python version');

        try {
            const pythonVersion = (await asyncExec(extractionCommand)).stdout.split(' ')[1];
            
            return !semver.lt(pythonVersion, CONFIG.requirenments.minPythonVersion);
        } catch (error) {
            throw new Error(`Checking the Python version was failed due: ${(error as Error).message}`);
        }
    }

    private static async resolveEntrypoint(installationType: CHECKOV_INSTALLATION_TYPE, cwd?: string) {
        switch (installationType) {
            case CHECKOV_INSTALLATION_TYPE.DOCKER:
                return 'docker';
            case CHECKOV_INSTALLATION_TYPE.PIP3:
                try {
                    await asyncExec('checkov --version', {env: {
                        PATH: CheckovInstall.processPathEnv
                    }});

                    return 'checkov';
                } catch (error) {
                    if (isWindows()) {
                        const checkovLocationOutput = (await asyncExec('pip3 show checkov')).stdout.trim();

                        for (const line of checkovLocationOutput.split(EOL)) {
                            if (line.startsWith('Location: ')) {
                                const sitePackagePath = line.split(' ')[1];
                                return path.join(path.dirname(sitePackagePath), 'Scripts', 'checkov');
                            }
                        }
                    }

                    const sitePackagesDirectory = (await asyncExec('python3 -c "import site; print(site.USER_BASE)"')).stdout;

                    return join(sitePackagesDirectory.trim(), 'bin', 'checkov');
                }
            case CHECKOV_INSTALLATION_TYPE.PIPENV:
                if (isWindows()) {
                    const envPath = (await asyncExec('pipenv run where python', { cwd })).stdout;

                    return `"${join(dirname(envPath.split(EOL)[0]), 'checkov')}"`;
                }
                const envPath = (await asyncExec('pipenv run which python', { cwd })).stdout;

                return `"${join(dirname(envPath), 'checkov')}"`;
        }
    }
};
