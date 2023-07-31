import { CheckovResult } from '../types';

export class FixService {
    public static async fix(result: CheckovResult) {
        if (!result.fixed_definition) {
            return;
        }
        
    }
};
