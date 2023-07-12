import { CheckovExecutor } from '../../services';
import { StatusBar } from '../../views';

export class CheckovExecute {
    public static async execute() {
        StatusBar.setText('Running Scanning', 'sync~spin');

        await CheckovExecutor.execute();

        StatusBar.reset();
    }
};
