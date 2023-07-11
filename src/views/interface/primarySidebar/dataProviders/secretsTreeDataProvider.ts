import { Check } from "../services/treeService";
import { TreeDataProvider } from "./abstractTreeDataProvider";
import { checkovOutput } from "../views/checkovOutput";

export class SecretsTreeDataProvider extends TreeDataProvider {
    getCheckovDataByType(): Array<Check> {
        // TODO implement getting secrets data from ResultsService
        return checkovOutput.filter(check => check.check_type === 'secrets');
    }
}