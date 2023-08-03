import { EOL } from 'os';

import * as vscode from 'vscode';

import { CONFIG } from '../config';
import { CHECKOV_RESULT_CATEGORY } from '../constants';
import { CheckovResult } from '../types';
import { CategoriesService } from '../services';

export class FixService {
    public static async fix(result: CheckovResult) {
        if (!result.fixed_definition) {
            return;
        }
        const resultCategory = CategoriesService.getCategoryByCheckId(result.check_id);
        
        if (resultCategory === CHECKOV_RESULT_CATEGORY.SCA) {
            await FixService.applyScaFix(result);
        }
    }

    private static async applyScaFix({ vulnerability_details }: CheckovResult) {
        const command = vulnerability_details.fix_command.cmds.join(EOL).replace(/`/g, '');
        const message = `${vulnerability_details.fix_command.msg}:${EOL}${command}`;

        if (vulnerability_details.fix_command.manualCodeFix) {
            // todo
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
};
