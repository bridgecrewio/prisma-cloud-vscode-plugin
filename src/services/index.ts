import * as vscode from 'vscode';

import { ResultsService } from './resultsService';

export function initializeServices(context: vscode.ExtensionContext) {
    ResultsService.initialize(context);
};

export * from './checkov';
export * from './resultsService';
