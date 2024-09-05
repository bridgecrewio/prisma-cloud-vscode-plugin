import { FilesService } from '../../../../services';

export class FocusString {
    public static async handle({ fileAbsPath, row }: { fileAbsPath: string, row: number }) {
        if (fileAbsPath && row) {
            await  FilesService.openFile(fileAbsPath, row);
            return;
        }

        throw new Error('There is no repo file path of file line to focus');
    }
}