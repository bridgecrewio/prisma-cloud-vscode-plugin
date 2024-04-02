import { CHECKOV_RESULT_CATEGORY } from "../constants";

export class CategoriesService {
    public static isIaCRisk(checkId: string): boolean {
        return ['BC_VUL', 'CKV_SECRET', 'BC_LIC'].every((prefix) => !checkId.startsWith(prefix));
    }

    public static isSCARisk(checkId: string): boolean {
        return checkId.startsWith('BC_VUL');
    }

    public static isSecretsRisk(checkId: string): boolean {
        return checkId.startsWith('CKV_SECRET');
    }

    public static isLicensesRisk(checkId: string): boolean {
        return checkId.startsWith('BC_LIC');
    }

    public static isWeaknessesRisk(checkType: string): boolean {
        return checkType.startsWith('cdk_') || checkType.startsWith('sast_');
    }

    public static getCategoryByCheckId(checkId: string): CHECKOV_RESULT_CATEGORY | undefined {
        if (this.isIaCRisk(checkId)) {
            return CHECKOV_RESULT_CATEGORY.IAC;
        }
        if (this.isSCARisk(checkId)) {
            return CHECKOV_RESULT_CATEGORY.SCA;
        }
        if (this.isSecretsRisk(checkId)) {
            return CHECKOV_RESULT_CATEGORY.SECRETS;
        }
        if (this.isLicensesRisk(checkId)) {
            return CHECKOV_RESULT_CATEGORY.LICENSES;
        }
        // TODO fix here to pass not checkId but checkType
        if (this.isWeaknessesRisk(checkId)) {
            return CHECKOV_RESULT_CATEGORY.WEAKNESSES;
        }
    }
}