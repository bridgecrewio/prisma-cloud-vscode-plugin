export enum COMMAND {
    CHECKOV_INSTALL = 'checkov.install',
    CHECKOV_EXECUTE = 'checkov.execute',
};

export enum WORKSPACE_EVENTS {
    SAVE_FILE = 'onDidSaveTextDocument',
};

export enum WINDOW_EVENTS {
    CHANGE_ACTIVE_TEXT_EDITOR = 'onDidChangeActiveTextEditor',
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

export enum PATH_TYPE {
    FOLDER = 'FOLDER',
    FILE = 'FILE',
    RISK = 'RISK',
    EMPTY = 'EMPTY',
    PACKAGE = 'PACKAGE',
}

export enum SEVERITY {
    INFO = 'INFO',
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
    UNKNOWN = 'UNKNOWN',
}

export enum CHECKOV_RESULT_CATEGORY { 
    IAC = 'iac', 
    SCA = 'sca', 
    SECRETS = 'secrets', 
    LICENSES = 'licenses' 
};

export enum CHECKOV_RESULT_VIEW_MESSAGE_TYPE {
    SUPPRESS = 'suppress',
};