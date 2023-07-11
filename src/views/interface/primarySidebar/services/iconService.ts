import * as path from 'path';
import { FormattedCheck } from "./treeService";

export class IconService {
    public getIconPath(treeItemName: string, formattedCheck: FormattedCheck) {
        const splitPath = formattedCheck.originalFilePath.split('/');
        const treeItemPathIndex = splitPath.indexOf(treeItemName);
        if (treeItemPathIndex !== -1) {
            if (treeItemPathIndex === splitPath.length - 1) {
                // it's file
                return this.getFileIconPath(treeItemName);
            }

            // it's folder
            return this.getFolderIconPath();
        } else {
            if (treeItemName === formattedCheck.checkClass) {
                // it's risk group
                return this.getRiskGroupIconPath();
            }

            if (treeItemName === formattedCheck.checkName) {
                // it's risk
                return this.getRiskIconPath();
            }
        }

        return {
            dark: path.join(__dirname, 'svg', 'file1.svg'),
            light: path.join(__dirname, 'svg', 'file1.svg'),
        };
    }

    private getFileIconPath(fileName: string) {
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

    private getRiskIconPath() {
        return {
            dark: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'risk.svg'),
            light: path.join(__dirname, '..', '..', '..', '..', '..', 'static', 'icons', 'svg', 'risk.svg'),
        };
    }
}