import { exec, ExecOptions } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { readdir, stat } from 'fs/promises';
import * as vscode from 'vscode';
import { CHECKOV_INSTALLATION_TYPE, GLOBAL_CONTEXT } from '../constants';
import { CheckovInstall } from '../commands/checkov';

export interface DiagnosticReferenceCode {
    target: vscode.Uri;
    value: string;
}

export const isPipInstall = (): boolean => {
    return CheckovInstall.installationType === CHECKOV_INSTALLATION_TYPE.PIP3;
};

export const isWindows = (): boolean => {
    return process.platform === 'win32';
};

export const formatWindowsFilePath = (path: string): string => {
    return path.replace(':', '').replace(/\\/g, '/');
};

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

export const initializeInstallationId = (context: vscode.ExtensionContext) => {
    const installationId = context.globalState.get(GLOBAL_CONTEXT.INSTALLATION_ID);
    if (installationId) {
        return;
    }

    context.globalState.update(GLOBAL_CONTEXT.INSTALLATION_ID, uuidv4());
};

export const getDirSize = async (dir: string): Promise<number> => {
    const files = await readdir(dir, { withFileTypes: true });

  const paths: Promise<number>[] = files.map(async file => {
    const path = join(dir, file.name);

    if (file.isDirectory()) {
        return await getDirSize(path);
    }

    if (file.isFile()) {
      const { size } = await stat(path);
      
      return size;
    }

    return 0;
  } );

  return (await Promise.all(paths)).flat(Infinity).reduce((i, size) => i + size, 0);
};