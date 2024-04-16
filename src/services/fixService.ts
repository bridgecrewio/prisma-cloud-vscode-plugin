import { EOL } from 'os';

import * as vscode from 'vscode';

import { CONFIG } from '../config';
import { CHECKOV_RESULT_CATEGORY } from '../constants';
import { CheckovResult } from '../types';
import { CategoriesService, CheckovExecutor, ResultsService } from '../services';
import { CheckovResultWebviewPanel } from '../views/interface/checkovResult';
import { CustomPopupService } from './customPopupService';
import { TreeDataProvidersContainer } from '../views/interface/primarySidebar/services/treeDataProvidersContainer';
import { isPipInstall, isWindows } from '../utils';

export class FixService {
    public static async fix(result: CheckovResult) {
        if (!result.fixed_definition || !CheckovExecutor.getExecutor()) {
            return;
        }
        const resultCategory = CategoriesService.getCategory(result.check_id, result.check_type);
        
        if (resultCategory === CHECKOV_RESULT_CATEGORY.SCA) {
            await FixService.applyScaFix(result);
        }

        if (resultCategory === CHECKOV_RESULT_CATEGORY.IAC) {
            await FixService.applyIaCFix(result);
        }
    }

    private static async applyScaFix({ vulnerability_details }: CheckovResult) {
        const command = vulnerability_details.fix_command.cmds.join(EOL).replace(/`/g, '');
        const message = `${vulnerability_details.fix_command.msg}:${EOL}${command}`;

        if (vulnerability_details.fix_command.manualCodeFix) {
            const { msg, cmds } = vulnerability_details.fix_command;
            vscode.window.showInformationMessage(`${msg}: ${cmds.length > 1 ? cmds.join(', ') : cmds[0]}`);
            return;
        }

        const action = await vscode.window.showInformationMessage(
            CONFIG.userInterface.extensionTitle,
            {
                modal: true,
                detail: message,
            },
            {
                title: 'Copy Command',
            },
        );
        
        if (action) {
            if (action.title === 'Copy Command') {
                vscode.env.clipboard.writeText(command);   
            }
        }
    }

    private static async applyIaCFix(targetResult: CheckovResult) {
        const activeEditor = CheckovResultWebviewPanel.fileEditorMap.get(targetResult.file_abs_path) || vscode.window.activeTextEditor;
        if (activeEditor) {
            const { repo_file_path, file_line_range, fixed_definition, file_abs_path, original_abs_path } = targetResult;
            const workspaceEdit = new vscode.WorkspaceEdit();
            const workspaceFolders = vscode.workspace.workspaceFolders;
            const resultFileUri = vscode.Uri.joinPath(workspaceFolders![0].uri, repo_file_path);
            const blockRange = new vscode.Range(
                activeEditor.document.lineAt(file_line_range[0] === 0 ? 0 : file_line_range[0] - 1).range.start,
                activeEditor.document.lineAt(file_line_range[1] - 1).range.end
            );
            workspaceEdit.replace(resultFileUri, blockRange, fixed_definition);
            await vscode.workspace.applyEdit(workspaceEdit);
            await activeEditor.document.save();
            await CheckovExecutor.execute([(isWindows() && isPipInstall()) ? original_abs_path : file_abs_path]);
            CustomPopupService.highlightLines();
            TreeDataProvidersContainer.refresh();
            return;
        }

        throw new Error('There is no active text editor to aplly fix for');
    }
};
