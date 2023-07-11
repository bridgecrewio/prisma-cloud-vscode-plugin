import * as vscode from 'vscode';

import { UserConfiguration } from '../types';

export const CONFIG = Object.freeze({
    extensionId: 'prisma-cloud.prisma-cloud-vscode-plugin',
    userConfigurationKey: 'prismaCloud',
    minRequiredPythonVersion: '3.7.0',
    checkov: {
        version: 'latest',
        docker: {
            sourceMountPath: '/checkovScan',
            certificateMountPath: '/checkovCert/cacert.pem',
        },
        skipChecks: 'BC_LIC*',
    },
    storage: {
        resultsKey: 'results',
    },
});

export const USER_CONFIG = vscode.workspace.getConfiguration(CONFIG.userConfigurationKey) as vscode.WorkspaceConfiguration & UserConfiguration;
