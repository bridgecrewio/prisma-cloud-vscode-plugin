import { USER_CONFIGURATION_PARAM, CHECKOV_INSTALLATION_TYPE } from '../constants';

export * from './checkov';

export type UserConfiguration = {
    [key in USER_CONFIGURATION_PARAM]: string;
};

export type CheckovInstallation = {
    type: CHECKOV_INSTALLATION_TYPE;
    entrypoint: string;
};
