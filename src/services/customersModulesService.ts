import axios, { AxiosResponse } from 'axios';
import * as vscode from 'vscode';
import { GLOBAL_CONTEXT, IDE_PLUGINS } from "../constants";
import logger from '../logger';
import { getPrismaApiUrl } from '../config/configUtils';
import { CustomerModulesResponse } from '../models';
import { CategoriesService } from './categoriesService';
import { AuthenticationService } from './authenticationService';

export const initializeCustomersModulesService = async (context: vscode.ExtensionContext) => {
    CustomersModulesService.enabled = !!getPrismaApiUrl();

    if (CustomersModulesService.enabled) {
        CustomersModulesService.applicationContext = context;

        await CustomersModulesService.setViewByModules();
    }
};

export class CustomersModulesService {
    private static retryCount: number = 0;
    static modulesEndpoint: string = getPrismaApiUrl() + '/bridgecrew/api/v1/customer-modules';
    static applicationContext: vscode.ExtensionContext;
    static enabled: boolean = true;


    static async updateCustomerModules() {
        const token = AuthenticationService.applicationContext.globalState.get(GLOBAL_CONTEXT.JWT_TOKEN) as string;

        if (!CustomersModulesService.enabled || !token) { 
            await CustomersModulesService.applicationContext.globalState.update(GLOBAL_CONTEXT.CUSTOMER_MODULES, null);
            logger.error(`CustomersModulesService is not enabled Or token not exists`, {'isEnabled': CustomersModulesService.enabled, token});
            return; 
        }
    
        const requestBody = [{
            pluginName: IDE_PLUGINS.VSCODE,
            eventTime: new Date()
        }];

        try {
            const response: AxiosResponse = await axios.get(CustomersModulesService.modulesEndpoint, { headers: {
                'Authorization': token } });

            logger.info('get customer modules response data: ', { data: response.data });
            
            if (response.status === 200) {
                CustomersModulesService.retryCount = 0;
                await CustomersModulesService.applicationContext.globalState.update(GLOBAL_CONTEXT.CUSTOMER_MODULES, response.data as CustomerModulesResponse);
            }

            return;
        } catch (e: any) {
            if (CustomersModulesService.retryCount === 5) {
                await CustomersModulesService.applicationContext.globalState.update(GLOBAL_CONTEXT.CUSTOMER_MODULES, null);
                throw new Error('there was an error getting customer modules: ' + e.message);
            }

            if (e.response.status === 403) {
                logger.info('Got 403 for analytics, refreshing JWT token');
                CustomersModulesService.retryCount++;
                await AuthenticationService.setAnalyticsJwtToken();
                await CustomersModulesService.updateCustomerModules();
                return;
            }

            logger.info('Error: ' + e.message);
            return;
        }

    }

    static async setViewByModules() {
        try {
            await CustomersModulesService.updateCustomerModules();
        } catch (err) {
            logger.info('customer is not supporting SAST');
            CategoriesService.hideWeaknessesView();
        }
        
        const customerModules: CustomerModulesResponse | null | undefined = CustomersModulesService.applicationContext.globalState.get(GLOBAL_CONTEXT.CUSTOMER_MODULES);
        
        if(customerModules && customerModules.modules.SAST) {
            logger.info('customer is support SAST');
            CategoriesService.showWeaknessesView();
        } else {
            logger.info('customer is not supporting SAST');
            CategoriesService.hideWeaknessesView();
        }
    }
}