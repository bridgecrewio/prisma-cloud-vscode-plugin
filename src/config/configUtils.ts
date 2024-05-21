import * as semver from 'semver';
import logger from '../logger';
import { CONFIG } from '.';

const minCheckovVersion = '2.0.0';

export const getNoCertVerify = (): boolean => {
    const noCertVerify = CONFIG.userConfig.noCertVerify;
    return (noCertVerify && noCertVerify.toLowerCase() === 'true') ? true : false;
};

export const getAccessKey = (): string | undefined => {
    const accessKey = CONFIG.userConfig.accessKey;
    return accessKey;
};

export const getSecretKey = (): string | undefined => {
    const secretKey = CONFIG.userConfig.secretKey;
    return secretKey;
};

export const getToken = (): string | undefined => {
    const token = `${getAccessKey()}::${getSecretKey}`;
    return token;
};

export const getPrismaApiUrl = (): string | undefined => {
    const prismaURL = CONFIG.userConfig.prismaURL;
    return prismaURL;
};

export const getFrameworks = (): string[] | undefined => {
    const frameworks = CONFIG.userConfig.frameworks;
    return frameworks ? frameworks.split(' ').map((entry: string) => entry.trim()) : undefined;
};

export const shouldDisableErrorMessage = (): boolean | undefined => {
    const disableErrorMessageFlag = CONFIG.userConfig.disableErrorMessage;
    return (disableErrorMessageFlag && disableErrorMessageFlag.toLowerCase() === 'true') ? true : false;
};

export const getExternalChecksDir = (): string | undefined => {
    const externalChecksDir = CONFIG.userConfig.externalChecksDir;
    return externalChecksDir;
};

export const getCheckovVersion = async (): Promise<string> => {
    let checkovVersion = CONFIG.userConfig.checkovVersion;
    checkovVersion = checkovVersion ? checkovVersion.trim().toLowerCase() : '';

    if (!checkovVersion || checkovVersion === 'latest') {
        return 'latest';
    } else {
        logger.debug(`Found version other than "latest" or "platform" - will attempt to use this: ${checkovVersion}`);
        if (!semver.valid(checkovVersion)) {
            throw Error(`Invalid checkov version: ${checkovVersion}`);
        }
        
        const clean = semver.clean(checkovVersion);
        if (!clean) {
            throw Error(`Invalid checkov version: ${checkovVersion}`);
        }

        if (!semver.satisfies(checkovVersion, `>=${minCheckovVersion}`)) {
            throw Error(`Invalid checkov version: ${checkovVersion} (must be >=${minCheckovVersion})`);
        }

        logger.debug(`Cleaned version: ${clean}`);

        return clean;
    }
};