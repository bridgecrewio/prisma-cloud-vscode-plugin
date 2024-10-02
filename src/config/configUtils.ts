import * as semver from 'semver';
import logger from '../logger';
import { CONFIG } from '.';
import { USER_CONFIGURATION_PARAM } from '../constants';
import { PROXY_SUPPORT } from '../models/proxySettings';

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
    let prismaURL: string = CONFIG.userConfig[USER_CONFIGURATION_PARAM.PRISMA_URL];
    if (prismaURL?.endsWith('/')) {
        prismaURL = prismaURL.substring(0, prismaURL.length - 1);
    }
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

export const getProxyConfigurations = (): string | unknown | null => {
    const proxySupport: PROXY_SUPPORT | unknown = CONFIG.userWorkspaceConfig.get('http.proxySupport');
    const proxyUrl = CONFIG.userWorkspaceConfig.get('http.proxy');
    let proxySettings = null;

    if (!proxySupport) {
        return null;
    }

    switch (proxySupport) {
        case PROXY_SUPPORT.ON:
        case PROXY_SUPPORT.OVERRIDE:
            proxySettings = proxyUrl;
            break;
        
        case PROXY_SUPPORT.FALLBACK:
            if (proxyUrl) {
                proxySettings = proxyUrl;
            }
            else if (process.env['https_proxy']) {
                proxySettings = process.env['https_proxy'];
            }
            else if (process.env['HTTPS_PROXY']) {
                proxySettings = process.env['HTTPS_PROXY'];
            }
            else {
                proxySettings = null;
            }
            break;
        case PROXY_SUPPORT.OFF:
            proxySettings = null;
            break;

        default:
            proxySettings = null;
    }

    logger.info(`proxy settings: ${JSON.stringify(proxySettings)}`);
    return proxySettings;
};