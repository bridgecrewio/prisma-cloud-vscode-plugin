export const dockerfileName = 'Dockerfile';
export const REPO_ID = 'vscode/extension';

export enum COMMAND {
    CHECKOV_INSTALL = 'checkov.install',
    CHECKOV_EXECUTE = 'checkov.execute',
    SHOW_PLUGIN_SETTINGS = 'checkov.showPluginSettings',
    CHECKOV_STOP_EXECUTE = 'checkov.stop.execute',
};

export enum WORKSPACE_EVENTS {
    SAVE_FILE = 'onDidSaveTextDocument',
    OPEN_FILE = 'onDidOpenTextDocument',
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
    DOCKERFILE = 'DOCKER',
    KOTLIN = 'KOTLIN',
    PYTHON = 'PYTHON',
    TERRAFORM = 'TERRAFORM',
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
    FIX = 'fix',
    DOCUMENTATION_CLICK = 'documentationClick',
};

export const severityPriorityMap: Record<SEVERITY, number> = {
    [SEVERITY.UNKNOWN]: 0,
    [SEVERITY.INFO]: 1,
    [SEVERITY.LOW]: 2,
    [SEVERITY.MEDIUM]: 3,
    [SEVERITY.HIGH]: 4,
    [SEVERITY.CRITICAL]: 5,
};

export const suppressionInputBoxOptions = {
    title: 'Suppress Policy',
    placeHolder: 'Justification',
    prompt: 'Include a short justification for the suppression',
};

export enum EVENT_TYPE {
    ON_FULL_SCAN = 'onFullScan',
    ON_SUPPRESSION_BALOON = 'onSuppressionBaloon',
    ON_SUPPRESSION_PANEL = 'onSuppressionPanel',
    ON_DOCUMENTATION_CLICK = 'onDocumentationClick',
    ON_FIX_BALOON = 'onFixBaloon',
    ON_FIX_PANEL = 'onFixPanel',
    ON_OPEN_FILE_SCAN = 'onOpenFileScan',
}

export type AnalyticsData = {
    installationId: string;
    pluginName: IDE_PLUGINS;
    eventTime: Date;
    eventType: EVENT_TYPE;
    eventData: EventData;
};

type EventData = {
    [key: string]: unknown;
};

export enum IDE_PLUGINS {
    JETBRAINS = 'jetbrains',
    VSCODE = 'vscode',
}

export enum GLOBAL_CONTEXT {
    JWT_TOKEN = 'jwtToken',
    INSTALLATION_ID = 'installationId',
}