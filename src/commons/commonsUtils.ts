import * as os from "os";

export function mapLibraryName(baseName: string) {
    const platform = os.platform();
    const arch = os.arch();

    let fileType: string;
    let archSuffix: string;

    switch (arch) {
        case 'x64':
            archSuffix = 'x64';
            break;
        case 'arm':
        case 'arm64':
            archSuffix = 'arm';
            break;
        default:
            throw new Error(`Unsupported architecture: ${arch}`);
    }

    switch (platform) {
        case 'win32':
            fileType = 'dll';
            break;
        case 'darwin':
            fileType = 'dylib';
            break;
        case 'linux':
            fileType = 'so';
            break;
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }

    return `${baseName}-${archSuffix}.${fileType}`;
}
