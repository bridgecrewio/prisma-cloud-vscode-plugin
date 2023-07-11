export enum COMMAND {
    CHECKOV_INSTALL = 'checkov.install',
    CHECKOV_EXECUTE = 'checkov.execute',
};

export enum EVENT {
    SAVE_FILE = 'onDidSaveTextDocument',
};

export enum CHECKOV_INSTALLATION_TYPE {
    DOCKER = 'docker',
    PIP3 = 'pip3',
    PIPENV = 'pipenv',
};

export enum USER_CONFIGURATION_PARAM {
    ACCESS_KEY = 'accessKey',
    SECRET_KEY = 'secretKey',
    PRISMA_URL = 'prismaURL',
    CERTIFICATE = 'certificate',
    USE_ENFORCEMENT_RULES = 'useEnforcementRules',
};

export enum CHECKOV_RESULT_CATEGORY { IAC, SCA, SECRETS, LICENSES };
