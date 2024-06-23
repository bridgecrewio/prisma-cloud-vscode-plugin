import axios from 'axios';
import * as vscode from 'vscode';
import { CONFIG } from "../config";
import { GLOBAL_CONTEXT } from "../constants";
import logger from '../logger';
import { getPrismaApiUrl } from '../config/configUtils';

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
        const { secretKey, accessKey } = CONFIG.userConfig;
        if (secretKey && accessKey) {
            try {
                const loginUrl = getPrismaApiUrl() + '/login';
                const response = await axios.post(loginUrl, {
                    username: accessKey,
                    password: secretKey,
                });
    
                if (response.status === 200) {
                    logger.info('Fetched new JWT token successfully');
                    await AuthenticationService.applicationContext.globalState.update(GLOBAL_CONTEXT.JWT_TOKEN, response.data.token);
                }
            } catch (error: any) {
                logger.info('Is not possible to fetch new JWT token. Authorization on prisma was failed: ', error.message);
                await AuthenticationService.applicationContext.globalState.update(GLOBAL_CONTEXT.JWT_TOKEN, undefined);
            }
        }
    }
}