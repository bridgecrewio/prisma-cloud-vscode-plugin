import * as vscode from 'vscode';

export const diagnosticsCollection = vscode.languages.createDiagnosticCollection('checkov');

export const DIAGNOSTICS_MAP = 'DIAGNOSTICS_MAP';