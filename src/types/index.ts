import { USER_CONFIGURATION_PARAM, CHECKOV_INSTALLATION_TYPE, CHECKOV_RESULT_VIEW_MESSAGE_TYPE } from '../constants';

export * from './checkov';

export type UserConfiguration = {
    [key in USER_CONFIGURATION_PARAM]: string;
};

export type CheckovInstallation = {
    type: CHECKOV_INSTALLATION_TYPE;
    entrypoint: string;
};

export type CheckovResultViewMessage = {
    type: CHECKOV_RESULT_VIEW_MESSAGE_TYPE,
    url?: string,
};
