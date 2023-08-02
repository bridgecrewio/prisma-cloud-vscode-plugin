import * as vscode from 'vscode';

import { ResultsService, FilesService, DiagnosticsService } from './';

export function initializeServices(context: vscode.ExtensionContext) {
    DiagnosticsService.initialize(context);
    ResultsService.initialize(context);
    FilesService.initialize(context);
};

export * from './checkov';
export * from './categoriesService';
export * from './resultsService';
export * from './filesService';
export * from './diagnosticsService';
export * from './suppresService';
export * from './fixService';