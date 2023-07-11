import * as vscode from 'vscode';

import { ResultsService } from './resultsService';

export * from './checkov';

export function initializeServices(context: vscode.ExtensionContext) {
    ResultsService.initialize(context);
};
