import axios from 'axios';
import * as vscode from 'vscode';
import {CONFIG} from "../config";
import {getPrismaApiUrl} from '../config/configUtils';
import {GLOBAL_CONTEXT} from "../constants";
import logger from '../logger';

export const initializeAuthenticationService = async (context: vscode.ExtensionContext) => {
    AuthenticationService.enabled = !!getPrismaApiUrl();

    if (AuthenticationService.enabled) {
        // TODO: don't persisting context object, but get it from general event
        AuthenticationService.applicationContext = context;
        await AuthenticationService.setAnalyticsJwtToken();
    } 
};

export class AuthenticationService {
    static applicationContext: vscode.ExtensionContext;
    static enabled: boolean = true;

    static async setAnalyticsJwtToken() {
        const response = await this.login();
        if (response?.status === 200) {
            logger.info('Fetched new JWT token successfully');
            await AuthenticationService.applicationContext.globalState.update(GLOBAL_CONTEXT.JWT_TOKEN, response.data.token);
        } else {
            logger.error(`Failed fetching a new JWT token, authorization on prisma failed: ${response}`);
            await AuthenticationService.applicationContext.globalState.update(GLOBAL_CONTEXT.JWT_TOKEN, undefined);
        }
    }

    static async login() {
        try {
            const { secretKey, accessKey } = CONFIG.userConfig;
            if (secretKey && accessKey) {
                const loginUrl = getPrismaApiUrl() + '/login';
                return await axios.post(loginUrl, {
                    username: accessKey,
                    password: secretKey,
                });
            }
        } catch (error: any) {
            return error.message;
        }
    }
}