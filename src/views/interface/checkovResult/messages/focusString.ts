import { FilesService } from '../../../../services';
import { CheckovResult } from '../../../../types';

export class FocusString {
    public static async handle({ result, row }: { result: CheckovResult, row: number }) {
        if (result && row) {
            await  FilesService.openResult(result, row);
            return;
        }

        throw new Error('There is no repo file path of file line to focus');
    }
}