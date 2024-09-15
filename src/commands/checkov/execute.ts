import {CheckovExecutor} from '../../services';

export class CheckovExecute {

    public static async execute() {
        return CheckovExecutor.execute();
    }
}