import * as vscode from 'vscode';
import { DiagnosticsService } from '../services';

export class OnChangeActiveTextEditor {
    public static handle(editor?: vscode.TextEditor) {
        if(editor) {
            DiagnosticsService.calculateAndApply();
        }
    }
};
