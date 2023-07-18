import { workspace, WorkspaceConfiguration } from 'vscode';

import { UserConfiguration } from '../types';

export const CONFIG = Object.freeze({
    get userConfig(): WorkspaceConfiguration & UserConfiguration {
        return workspace.getConfiguration(CONFIG.userConfigurationKey) as WorkspaceConfiguration & UserConfiguration;
    },
    extensionId: 'prisma-cloud.prisma-cloud-vscode-plugin',
    userConfigurationKey: 'prismaCloud',
    minRequiredPythonVersion: '3.7.0',
    checkov: {
        version: 'latest',
        docker: {
            sourceMountPath: '/checkovScan',
            certificateMountPath: '/checkovCert/cacert.pem',
        },
    },
    storage: {
        resultsKey: 'results',
    },
    userInterface: {
        resultPanelTitle: 'Prisma Issue',
        statusBarText: 'Prisma Cloud',
    },
});
