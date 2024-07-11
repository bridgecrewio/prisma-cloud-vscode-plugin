import { workspace, WorkspaceConfiguration } from 'vscode';

import { UserConfiguration } from '../types';

export const CONFIG = Object.freeze({
    get userConfig(): WorkspaceConfiguration & UserConfiguration {
        return workspace.getConfiguration(CONFIG.userConfigurationKey) as WorkspaceConfiguration & UserConfiguration;
    },
    get userWorkspaceConfig(): WorkspaceConfiguration {
        return workspace.getConfiguration();
    },
    extensionId: 'prismacloud.prisma-cloud',
    userConfigurationKey: 'prismaCloud',
    requirenments: {
        minPythonVersion: '3.7.0',
    },
    checkov: {
        version: 'latest',
        docker: {
            certificateMountPath: '/checkovCert/cacert.pem',
        },
    },
    filesSyncInterval: 5000,
    storage: {
        resultsKey: 'results',
    },
    userInterface: {
        extensionTitle: 'Prisma Cloud',
        resultPanelTitle: 'Prisma Issue',
    },
});
