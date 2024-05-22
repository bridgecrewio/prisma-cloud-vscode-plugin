import * as semver from 'semver';
import logger from '../logger';
import { CONFIG } from '.';
import { USER_CONFIGURATION_PARAM } from '../constants';

const minCheckovVersion = '2.0.0';

export const getNoCertVerify = (): boolean => {
    const noCertVerify = Boolean(CONFIG.userConfig[USER_CONFIGURATION_PARAM.SKIP_SSL_VERIFICATION]);
    return noCertVerify;
};

export const getAccessKey = (): string | undefined => {
    const accessKey = CONFIG.userConfig[USER_CONFIGURATION_PARAM.ACCESS_KEY];
    return accessKey;
};

export const getSecretKey = (): string | undefined => {
    const secretKey = CONFIG.userConfig[USER_CONFIGURATION_PARAM.SECRET_KEY];
    return secretKey;
};

export const getToken = (): string | undefined => {
    const token = `${getAccessKey()}::${getSecretKey()}`;
    return token;
};

export const getPrismaApiUrl = (): string | undefined => {
    const prismaURL = CONFIG.userConfig[USER_CONFIGURATION_PARAM.PRISMA_URL];
    return prismaURL;
};

export const getCertificate = (): string | undefined => {
    const cert = CONFIG.userConfig[USER_CONFIGURATION_PARAM.CERTIFICATE];
    return cert;
};

export const getFrameworks = (): string[] | undefined => {
    const frameworks = CONFIG.userConfig[USER_CONFIGURATION_PARAM.FRAMEWORKS];
    return frameworks ? frameworks.split(' ').map((entry: string) => entry.trim()) : undefined;
};

export const shouldDisableErrorMessage = (): boolean => {
    const disableErrorMessageFlag = Boolean(CONFIG.userConfig[USER_CONFIGURATION_PARAM.DISABLE_ERROR_MESSAGE_POPUP]);
    return disableErrorMessageFlag;
};

export const shouldUseEnforcmentRules = (): boolean => {
    const shouldUseEnforcementRules = Boolean(CONFIG.userConfig[USER_CONFIGURATION_PARAM.USE_ENFORCEMENT_RULES]);
    return shouldUseEnforcementRules;
};

export const getSastMaxSizeLimit = (): number => {
    const sastMaxSizeLimit = Number(CONFIG.userConfig[USER_CONFIGURATION_PARAM.SAST_SIZE_LIMIT]);
    return sastMaxSizeLimit;
};

export const getExternalChecksDir = (): string | undefined => {
    const externalChecksDir = CONFIG.userConfig[USER_CONFIGURATION_PARAM.EXTERNAL_CHECK_DIR];
    if (externalChecksDir) {
        return `"${externalChecksDir}"`;
    }
    return externalChecksDir;
};

export const getCheckovVersion = (): string => {
    let checkovVersion = CONFIG.userConfig[USER_CONFIGURATION_PARAM.CHECKOV_VERSION];
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