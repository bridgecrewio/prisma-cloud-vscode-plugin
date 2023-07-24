import * as vscode from 'vscode';

import { ResultsService, FilesService } from './';

export function initializeServices(context: vscode.ExtensionContext) {
    ResultsService.initialize(context);
    FilesService.initialize(context);
};

export * from './checkov';
export * from './resultsService';
export * from './filesService';
