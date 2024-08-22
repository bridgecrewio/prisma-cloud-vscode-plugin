import { mkdir } from 'fs/promises';
import { EOL } from 'os';
import { dirname, join } from 'path';

import * as path from 'path';
import * as semver from 'semver';
import * as vscode from 'vscode';

import { CONFIG } from '../../config';
import { getCheckovVersion } from '../../config/configUtils';
import { CHECKOV_INSTALLATION_TYPE } from '../../constants';
import logger from '../../logger';
import { CheckovExecutor } from '../../services';
import { asyncExec, formatError, isWindows } from '../../utils';
import { StatusBar } from '../../views';

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
                    await CheckovExecutor.initialize(installationResult);
                    logger.info(`Successfully installed Checkov using ${installationResult.type}`, installationResult);
                    return;
                }
            }

            throw new Error("Checkov couldn't be installed using docker, pip or pipenv");
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
    
                (await asyncExec(`${pipExe} install --user -U -i https://pypi.org/simple/ checkov${CheckovInstall.checkovVersion === 'latest' ? '' : `==${CheckovInstall.checkovVersion}`}`, {env: {PIP_BREAK_SYSTEM_PACKAGES: '1'}}));
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
                logger.error(`Failed to install Checkov using ${pythonExe}`, { error: formatError(error as Error) });
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
            const installationDir = vscode.Uri.joinPath(context.globalStorageUri, 'checkov').fsPath;

            await mkdir(installationDir, { recursive: true });

            const isPythonVersionSuitable = await CheckovInstall.isPythonVersionSuitable('pipenv run python --version', installationDir);

            if (!isPythonVersionSuitable) {
                return false;
            }

            await asyncExec('pipenv --python 3 install checkov~=2.0.0', { cwd: installationDir });

            const entrypoint = await CheckovInstall.resolveEntrypoint(CHECKOV_INSTALLATION_TYPE.PIPENV, installationDir);

            return { type: CHECKOV_INSTALLATION_TYPE.PIPENV, entrypoint };
        } catch (error) {
            logger.error('Failed to install Checkov with Pipenv', { error: formatError(error as Error) });
            return false;
        }
    }

    private static async isPythonVersionSuitable(extractionCommand: string, dir?: string) {
        logger.info('Checking the Python version');

        try {
            const pythonVersion = (await asyncExec(extractionCommand, dir ? { cwd: dir } : {})).stdout.split(' ')[1];
            
            return !semver.lt(pythonVersion, CONFIG.requirenments.minPythonVersion);
        } catch (error) {
            throw new Error(`Failed checking the Python version: ${(error as Error).message}`);
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
