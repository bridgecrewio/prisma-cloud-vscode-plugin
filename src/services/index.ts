import * as vscode from 'vscode';

import {DiagnosticsService, ResultsService} from './';

export function initializeServices(context: vscode.ExtensionContext) {
    DiagnosticsService.initialize(context);
    ResultsService.initialize(context);
}

export * from './categoriesService';
export * from './checkov';
export * from './diagnosticsService';
export * from './fixService';
export * from './resultsService';
export * from './suppresService';