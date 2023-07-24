export type CheckovResult = {
    bc_check_id: string;
    check_id: string;
    check_class: string;
    check_name: string;
    code_block: [number, string][];
    file_abs_path: string;
    file_line_range: number[];
    file_path: string;
    fixed_definition: string;
    guideline: string;
    repo_file_path: string;
    resource: string;
    severity: string;
    vulnerability_details: {
        id: string;
    };
};

export type CheckovOutput = [{
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
}];
