import { exec, ExecOptions } from 'child_process';
import * as vscode from 'vscode';

export interface DiagnosticReferenceCode {
    target: vscode.Uri;
    value: string;
}

export const asyncExec = async (command: string, options: ExecOptions = {}): Promise<{ stdout: string, stderr: string }> => {
    const defaultOptions: ExecOptions = { maxBuffer: 1024 * 1000 };

    return new Promise((resolve, reject) => {
        exec(command, { ...defaultOptions, ...options }, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            resolve({ stdout, stderr });
        });
    });
};

export const createDiagnosticKey = (diagnostic: vscode.Diagnostic): string => {
    let checkId;
    if (typeof(diagnostic.code) === 'string') {
        // code is a custom policy in format: policy_id[:guideline]
        const colonIndex = diagnostic.code.indexOf(':');
        checkId = colonIndex === -1 ? diagnostic.code : diagnostic.code.substring(0, colonIndex);
    } else {
        checkId = (diagnostic.code as DiagnosticReferenceCode).value;
    }
    return `${checkId}-${diagnostic.range.start.line + 1}`;
};