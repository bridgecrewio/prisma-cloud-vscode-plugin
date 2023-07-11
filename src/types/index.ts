import { USER_CONFIGURATION_PARAM } from '../constants';

export type UserConfiguration = {
    [key in USER_CONFIGURATION_PARAM]: string;
};
