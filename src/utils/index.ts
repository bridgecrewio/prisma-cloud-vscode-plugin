import { exec, ExecOptions } from 'child_process';

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
