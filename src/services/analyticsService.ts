import axios from 'axios';
import * as vscode from 'vscode';
import { CONFIG } from '../config';
import { getPrismaApiUrl } from '../config/configUtils';
import { EVENT_TYPE, GLOBAL_CONTEXT, IDE_PLUGINS } from "../constants";
import logger from '../logger';
import { getOsNameAndVersion } from '../utils';
import { AuthenticationService } from './authenticationService';
import { CheckovExecutor } from './checkov';

export const initializeAnalyticsService = (context: vscode.ExtensionContext) => {
    AnalyticsService.enabled = !!getPrismaApiUrl();

    if (AnalyticsService.enabled) {
        // TODO: don't persisting context object, but get it from general event
        AnalyticsService.applicationContext = context;
    } 
};

export class AnalyticsService {
    private static retryCount: number = 0;
    static analyticsEndpoint: string = getPrismaApiUrl() + '/bridgecrew/api/v1/plugins-analytics';
    static applicationContext: vscode.ExtensionContext;
    static enabled: boolean = true;

    static async postAnalyticsEvent(eventType: EVENT_TYPE, eventData: Record<string, any>) {
        if (!AnalyticsService.enabled) { return; }

        const installationId = AnalyticsService.applicationContext.globalState.get(GLOBAL_CONTEXT.INSTALLATION_ID);
        const jwtToken = AuthenticationService.applicationContext.globalState.get(GLOBAL_CONTEXT.JWT_TOKEN) as string;

        if (installationId && jwtToken) {
            const requestBody = [{
                installationId,
                pluginName: IDE_PLUGINS.VSCODE,
                eventTime: new Date(),
                eventType,
                pluginVersion: vscode.extensions.getExtension(CONFIG.extensionId)?.packageJSON.version,
                ideVersion: vscode.version,
                operatingSystem: await getOsNameAndVersion(),
                checkovVersion: CheckovExecutor.checkovVersion,
                eventData,
            }];
    
            try {
                const response = await axios.put(AnalyticsService.analyticsEndpoint, requestBody, { headers: {
                    'Authorization': jwtToken } });

                if (response.status === 200) {
                    AnalyticsService.retryCount = 0;
                    logger.info('Sent analytics successfully');
                }

                return;
            } catch (e: any) {
                if (AnalyticsService.retryCount === 5) {
                    throw new Error('Analytics data can\'t be send with error: ' + e.message);
                }

                if (e.response.status === 403) {
                    logger.info('Got 403 for analytics, refreshing JWT token');
                    AnalyticsService.retryCount++;
                    await AuthenticationService.setAnalyticsJwtToken();
                    await AnalyticsService.postAnalyticsEvent(eventType, eventData);
                    return;
                }

                logger.info('Error: ' + e.message);
                return;
            }
        }

        logger.info('There are no installationId or jwtToken for sending analytics data');
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