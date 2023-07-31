import * as path from 'path';
import { SEVERITY, PATH_TYPE } from '../../../../constants';

export class IconsService {
    public getIconPath(pathType: PATH_TYPE, severity?: SEVERITY) {
        switch(pathType) {
            case PATH_TYPE.FILE:
                return this.getFileIconPath();
            case PATH_TYPE.FOLDER:
                return this.getFolderIconPath();
            case PATH_TYPE.PACKAGE:
                return this.getPackageIconPath();
            case PATH_TYPE.RISK:
                return this.getRiskIconPath(severity || SEVERITY.INFO);
            default:
                return this.getEmptyIconPath();
        }
    }

    private getEmptyIconPath() {
        return {
            dark: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'empty.svg'),
            light: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'empty.svg'),
        };
    }

    private getPackageIconPath() {
        return {
            dark: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'package.svg'),
            light: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'package.svg'),
        };
    }

    private getFileIconPath() {
        return {
            dark: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'file.svg'),
            light: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'file.svg'),
        };
    }

    private getFolderIconPath() {
        return {
            dark: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'folder.svg'),
            light: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'folder.svg'),
        };
    }

    private getRiskGroupIconPath() {
        return {
            dark: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'risk-group.svg'),
            light: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'risk-group.svg'),
        };
    }

    private getRiskIconPath(severity: SEVERITY) {
        return {
            dark: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', `severities/${severity.toLowerCase()}.svg`),
            light: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', `severities/${severity.toLowerCase()}.svg`),
        };
    }
};
