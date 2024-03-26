import { SEVERITY } from "../constants";

export type CheckovResult = {
    id: string;
    bc_check_id: string;
    check_id: string;
    check_class: string;
    check_name: string;
    code_block: [number, string][];
    original_abs_path: string;
    file_abs_path: string;
    file_line_range: number[];
    file_path: string;
    fixed_definition: string;
    guideline: string;
    repo_file_path: string;
    resource: string;
    severity: SEVERITY;
    vulnerability_details: {
        id: string;
        description: string;
        root_package_name: string;
        root_package_version: string;
        package_name: string;
        package_version: string;
        license: string;
        fix_command: {
            cmds: string[];
            manualCodeFix: boolean;
            msg: string;
        }
    };
    description: string;
    short_description: string;
};

export type CheckovCheckTypeOutput = {
    check_type: string;
    results: {
        failed_checks: CheckovResult[];
    }
    summary: {
        checkov_version: string;
        failed: number;
        parsing_errors: number;
        passed: number;
        resource_count: number;
        skipped: number;
    };
};

// response type from checkov when file is empty, the response is totally different format from the one with risks data
export type EmptyCheckovOutput = {
    checkov_version: string;
    failed: number;
    parsing_errors: number;
    passed: number;
    resource_count: number;
    skipped: number;
};

export type CheckovOutput = CheckovCheckTypeOutput[] | CheckovCheckTypeOutput;
