import axios from 'axios';
import * as vscode from 'vscode';
import { CONFIG } from "../config";
import { EVENT_TYPE, GLOBAL_CONTEXT, IDE_PLUGINS } from "../constants";

export const initializeAnalyticsService = async (context: vscode.ExtensionContext) => {
    AnalyticsService.applicationContext = context;
	await AnalyticsService.setAnalyticsJwtToken();
};

export class AnalyticsService {
    static analyticsEndpoint: string = CONFIG.userConfig.prismaURL + '/bridgecrew/api/v1/plugins-analytics';
    static applicationContext: vscode.ExtensionContext;

    static async setAnalyticsJwtToken() {
        const { secretKey, accessKey } = CONFIG.userConfig;
        if (secretKey && accessKey) {
            try {
                const loginUrl = CONFIG.userConfig.prismaURL + '/login';
                const response = await axios.post(loginUrl, {
                    username: accessKey,
                    password: secretKey,
                });
    
                if (response.status === 200) {
                    await AnalyticsService.applicationContext.globalState.update(GLOBAL_CONTEXT.JWT_TOKEN, response.data.token);
                }
            } catch (error: any) {
                console.log('Authorization on prisma was failed: ', error.message);
                await AnalyticsService.applicationContext.globalState.update(GLOBAL_CONTEXT.JWT_TOKEN, undefined);
            }
        }
    }

    static async postAnalyticsEvent(eventType: EVENT_TYPE, eventData: Record<string, any>) {
        let retryCount = 0;
        const installationId = AnalyticsService.applicationContext.globalState.get(GLOBAL_CONTEXT.INSTALLATION_ID);
        const jwtToken = AnalyticsService.applicationContext.globalState.get(GLOBAL_CONTEXT.JWT_TOKEN) as string;

        if (installationId && jwtToken) {
            const requestBody = [{
                installationId,
                pluginName: IDE_PLUGINS.VSCODE,
                eventTime: new Date(),
                eventType,
                eventData,
            }];
    
            try {
                const response = await axios.put(AnalyticsService.analyticsEndpoint, requestBody, { headers: {
                    'Authorization': jwtToken } });

                if (response.status === 200) {
                    console.log('Sent analytics successfully');
                }

                return;
            } catch (e: any) {
                if (retryCount === 5) {
                    throw new Error('Analytics data can\'t be send with error: ' + e.message);
                }

                if (e.response.status === 403) {
                    retryCount++;
                    await AnalyticsService.setAnalyticsJwtToken();
                    await AnalyticsService.postAnalyticsEvent(eventType, eventData);
                    return;
                }

                console.log('Error: ' + e.message);
                return;
            }
        }

        throw new Error('There are no installationId or jwtToken for sending analytics data');
    }

    static async trackFullScanEvent(eventData: Record<string, any>) {
        AnalyticsService.postAnalyticsEvent(EVENT_TYPE.ON_FULL_SCAN, eventData);
    }

    static async trackFixFromBaloon() {
        AnalyticsService.postAnalyticsEvent(EVENT_TYPE.ON_FIX_BALOON, {});
    }

    static async trackFixFromPanel() {
        AnalyticsService.postAnalyticsEvent(EVENT_TYPE.ON_FIX_PANEL, {});
    }

    static async trackSuppressFromBaloon() {
        AnalyticsService.postAnalyticsEvent(EVENT_TYPE.ON_SUPPRESSION_BALOON, {});
    }

    static async trackSuppressFromPanel() {
        AnalyticsService.postAnalyticsEvent(EVENT_TYPE.ON_SUPPRESSION_PANEL, {});
    }

    static async trackDocumentationClick() {
        AnalyticsService.postAnalyticsEvent(EVENT_TYPE.ON_DOCUMENTATION_CLICK, {});
    }

    static async trackOnOpenFileReaction(eventData: Record<string, any>) {
        AnalyticsService.postAnalyticsEvent(EVENT_TYPE.ON_OPEN_FILE_SCAN, eventData);
    }
}