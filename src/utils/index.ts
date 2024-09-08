import { exec, ExecOptions } from 'child_process';
import { readdir, stat } from 'fs/promises';
import * as os from "os";
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as vscode from 'vscode';
import { CheckovInstall } from '../commands/checkov';
import { CHECKOV_INSTALLATION_TYPE, GLOBAL_CONTEXT } from '../constants';

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

export const formatWindowsAbsoluteFilePath = (path: string): string => {
    const splitPath = path.replace(/\\/g, '/').replace(/^\/+/g, '').split('/');
    splitPath[0] = splitPath[0].toLocaleUpperCase() + ':';
    return splitPath.join('/');
};

export const getOsNameAndVersion = async () => {
    const operatingSystem = os.type();
    if ("Darwin" === operatingSystem) {
        const {stdout} = await asyncExec("system_profiler SPSoftwareDataType  | grep 'System Version'");
        return stdout.substring(stdout.indexOf(':') + 1, stdout.indexOf('(') || stdout.length).trim();
    }
    return `${operatingSystem} ${os.release()}`;
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
    if (isWindows()) {
        if (dir[0] === '/' || dir[0] === '\\') {
            dir = dir.substring(1);
        }
    }

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

export const formatError = (err: Error): any => {
    return {
        name: err.name,
        message: err.message,
        stack: err.stack,
    };
};