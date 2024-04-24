import * as vscode from 'vscode';
import { FilesService } from '../../../../services';

export class FocusString {
    public static async handle({ repoFilePath, row }: { repoFilePath: string, row: number }) {
        if (repoFilePath && row) {
            await  FilesService.openFile(repoFilePath, row);
            return;
        }

        throw new Error('There is no repo file path of file line to focus');
    }
}