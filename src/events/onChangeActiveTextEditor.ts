import * as vscode from 'vscode';
import { CustomPopupService } from '../services/customPopupService';

export class OnChangeActiveTextEditor {
    public static handle(editor?: vscode.TextEditor) {
        if (editor) {
            CustomPopupService.highlightLines();
        }
    }
};
