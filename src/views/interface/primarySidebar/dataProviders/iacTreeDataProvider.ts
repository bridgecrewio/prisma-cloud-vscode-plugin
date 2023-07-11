import { Check } from "../services/treeService";
import { TreeDataProvider } from "./abstractTreeDataProvider";
import { checkovOutput } from "../views/checkovOutput";

export class IaCTreeDataProvider extends TreeDataProvider {
    getCheckovDataByType(): Array<Check> {
        // TODO implement getting IaC data from ResultsService
        const iacCheckTypes = ["ansible", "arm", "bicep", "cloudformation", "dockerfile", "helm", "json",
        "yaml", "kubernetes", "kustomize", "openapi", "serverless", "terraform", "terraform_plan"];
        return checkovOutput.filter(check => iacCheckTypes.indexOf(check.check_type) !== -1);
    }
}