import { Check } from "../services/treeService";
import { TreeDataProvider } from "./abstractTreeDataProvider";
import { checkovOutput } from "../views/checkovOutput";

export class VulnerabilitiesTreeDataProvider extends TreeDataProvider {
    getCheckovDataByType(): Array<Check> {
        // TODO implement getting vulnerabilities data from ResultsService
        const iacCheckTypes = ["sca_package", "sca_image"];
        return checkovOutput.filter(check => iacCheckTypes.indexOf(check.check_type) !== -1);
    }
}