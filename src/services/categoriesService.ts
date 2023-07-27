import { CHECKOV_RESULT_CATEGORY } from "../constants";

export class CategoriesService {
    static isIaCRisk(checkId: string): boolean {
        return ['BC_VUL', 'CKV_SECRET', 'BC_LIC'].every((prefix) => !checkId.startsWith(prefix));
    }

    static isSCARisk(checkId: string): boolean {
        return checkId.startsWith('BC_VUL');
    }

    static isSecretsRisk(checkId: string): boolean {
        return checkId.startsWith('CKV_SECRET');
    }

    static isLicensesRisk(checkId: string): boolean {
        return checkId.startsWith('BC_LIC');
    }

    static getCategoryByCheckId(checkId: string): CHECKOV_RESULT_CATEGORY | undefined {
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
    }
}