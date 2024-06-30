import * as vscode from 'vscode';
import axios from 'axios';

import { CONFIG } from '../../../config';
import { CheckovResult, DataFlow } from '../../../types';
import { MessageHandlersFactory } from './messages';
import { CHECKOV_RESULT_CATEGORY, GLOBAL_CONTEXT } from '../../../constants';
import { AbstractExecutor } from '../../../services/checkov/executors/abstractExecutor';
import { CategoriesService } from '../../../services';
import { AnalyticsService } from '../../../services/analyticsService';
import logger from '../../../logger';
import { getPrismaApiUrl } from '../../../config/configUtils';
import { AuthenticationService } from '../../../services/authenticationService';

export class CheckovResultWebviewPanel {
    private static context: vscode.ExtensionContext;
    private static retryCount: number = 0;
    public static currentCategory: CHECKOV_RESULT_CATEGORY;
    public static webviewPanel?: vscode.WebviewPanel;
    public static checkovResult?: CheckovResult;
    public static fileEditorMap: Map<string, typeof vscode.window.activeTextEditor> = new Map();

    public static initialize(context: vscode.ExtensionContext) {
        CheckovResultWebviewPanel.context = context;
    }

    public static async show(category: CHECKOV_RESULT_CATEGORY, result: CheckovResult, activeEditor: typeof vscode.window.activeTextEditor) {
        CheckovResultWebviewPanel.fileEditorMap.set(result.file_abs_path, activeEditor);     
        CheckovResultWebviewPanel.currentCategory = category;   
        const html = await CheckovResultWebviewPanel.getHtmlTemplate(category);

        CheckovResultWebviewPanel.checkovResult = result;

        if (CheckovResultWebviewPanel.webviewPanel) {
            CheckovResultWebviewPanel.webviewPanel.webview.html = CheckovResultWebviewPanel.render(html, result);

            return CheckovResultWebviewPanel.webviewPanel.reveal(vscode.ViewColumn.Beside, true);
        }

        CheckovResultWebviewPanel.webviewPanel = vscode.window.createWebviewPanel(
            'prismaCloud',
            CONFIG.userInterface.resultPanelTitle,
            {
                viewColumn: vscode.ViewColumn.Beside,
                preserveFocus: true,
            },
            {
                localResourceRoots: [vscode.Uri.joinPath(CheckovResultWebviewPanel.context.extensionUri, 'static')],
                enableScripts: true,
            },
        );
        CheckovResultWebviewPanel.webviewPanel.webview.html = CheckovResultWebviewPanel.render(html, result);

        CheckovResultWebviewPanel.webviewPanel.webview.onDidReceiveMessage(MessageHandlersFactory.handle);
        CheckovResultWebviewPanel.webviewPanel.onDidDispose(
            () => {
                CheckovResultWebviewPanel.webviewPanel = undefined;
                CheckovResultWebviewPanel.checkovResult = undefined;
            },
            null,
            CheckovResultWebviewPanel.context.subscriptions,
        );
    }

    public static async reRenderHtml() {
        if (CheckovResultWebviewPanel.webviewPanel && CheckovResultWebviewPanel.checkovResult) {
            const newHtml = await CheckovResultWebviewPanel.getHtmlTemplate(CheckovResultWebviewPanel.currentCategory);
            CheckovResultWebviewPanel.webviewPanel.webview.html = CheckovResultWebviewPanel.render(newHtml, CheckovResultWebviewPanel.checkovResult);
        }
    }

    public static isSuppressionVisible(result: CheckovResult): boolean {
        const { check_id, vulnerability_details, check_type } = result;
        if (CategoriesService.isIaCRisk(check_id, check_type)) {
            return true;
        }

        if (CategoriesService.isSCARisk(check_id)) {
            if (CheckovResultWebviewPanel.restrictScaForFile(result)) {
                return false;
            }
            return Boolean(vulnerability_details?.id) || Boolean(check_id);
        }

        if (CategoriesService.isLicensesRisk(check_id) 
            || CategoriesService.isSecretsRisk(check_id) 
            || CategoriesService.isWeaknessesRisk(check_type)) {
            return false;
        }

        return true;
    }

    private static restrictScaForFile(result: CheckovResult): boolean {
        const restrictedFiles = ['.bicep', '.tf', '.yml'];

        for (const file of restrictedFiles) {
            if (result.file_abs_path.endsWith(file)) {
                return true;
            }
        }

        return false;
    } 

    private static async getHtmlTemplate(category: CHECKOV_RESULT_CATEGORY) {
        const { extensionUri } = CheckovResultWebviewPanel.context;
        const [rootTemplate, resultTempalte] = await Promise.all([
            vscode.workspace.fs.readFile(
                vscode.Uri.file(`${extensionUri.path}/static/webviews/result/index.html`),
            ),
            vscode.workspace.fs.readFile(
                vscode.Uri.file(`${extensionUri.path}/static/webviews/result/types/${category}.html`),
            ),
        ]);

        return rootTemplate.toString().replace('{{resultTemplate}}', resultTempalte.toString());
    }

    private static render(htmlTemplate: string, result: CheckovResult) {
        const htmlParams = htmlTemplate.matchAll(new RegExp('{{(.*?)}}', 'g'));
        const customValues: Record<string, any> = {
            severityIconUri: CheckovResultWebviewPanel.webviewPanel?.webview.asWebviewUri(
                vscode.Uri.joinPath(CheckovResultWebviewPanel.context.extensionUri, 'static/icons/svg/severities', `${result.severity.toLowerCase()}.svg`),
            ),
            resourceIconUri: CheckovResultWebviewPanel.webviewPanel?.webview.asWebviewUri(
                vscode.Uri.joinPath(CheckovResultWebviewPanel.context.extensionUri, 'static/icons/svg', 'resource.svg'),
            ),
            fixIconUri: CheckovResultWebviewPanel.webviewPanel?.webview.asWebviewUri(
                vscode.Uri.joinPath(CheckovResultWebviewPanel.context.extensionUri, 'static/icons/svg', 'fix.svg'),
            ),
            suppressIconUri: CheckovResultWebviewPanel.webviewPanel?.webview.asWebviewUri(
                vscode.Uri.joinPath(CheckovResultWebviewPanel.context.extensionUri, 'static/icons/svg', 'suppress.svg'),
            ),
            guidelineIconUri: CheckovResultWebviewPanel.webviewPanel?.webview.asWebviewUri(
                vscode.Uri.joinPath(CheckovResultWebviewPanel.context.extensionUri, 'static/icons/svg', 'guideline.svg'),
            ),
            codeBlock: CheckovResultWebviewPanel.renderCodeBlock(result),
            fixActionState: result.fixed_definition ? 'available' : 'unavailable',
            guidelineActionState: result.guideline ? 'available' : 'unavailable',
            vulnerabilityDetailsId: result.vulnerability_details?.id,
            description: result.description || '',
            approvedSPDX: result.check_id === 'BC_LIC_1' ? 'true' : 'false',
            disabledClass: AbstractExecutor.isScanInProgress ? 'disabledDiv' : '',
            suppressActionState: CheckovResultWebviewPanel.isSuppressionVisible(result) ? 'visible' : 'hidden',
            taintRiskState: (result.metadata?.taint_mode || result.metadata?.code_locations?.length) ? 'visible' : 'hidden',
            nonTaintRiskState: (result.metadata?.taint_mode || result.metadata?.code_locations?.length) ? 'hidden' : 'visible',
            dataFlow: CheckovResultWebviewPanel.getDataFlowValue(result),
            owaspVisibility: result.owasp?.length ? 'visible' : 'hidden',
            owaspValue: CheckovResultWebviewPanel.getOwaspStringValue(result),
            cweVisibility: result.cwe?.length ? 'visible' : 'hidden',
            cweValue: CheckovResultWebviewPanel.getCweValue(result),
            dataFlowLinks: CheckovResultWebviewPanel.getDataFlowLinks(result),
            repoFilePath: result.repo_file_path,
            lineNumbers: CheckovResultWebviewPanel.getLineNumbers(result),
        };

        for (const htmlParam of htmlParams) {
            if (htmlParam[1].includes('.')) {
                htmlTemplate = htmlTemplate.replace(htmlParam[0], htmlParam[1].split('.').reduce((acc: any, key) => acc[key], result) || '');
                continue;
            }
            htmlTemplate = htmlTemplate.replace(htmlParam[0], customValues[htmlParam[1]] || result[htmlParam[1] as keyof CheckovResult] || '');
        }

        return htmlTemplate;
    }

    public static async fetchDescription(checkId: string, retryCount = 0): Promise<string | undefined> {
        const jwtToken = AuthenticationService.applicationContext.globalState.get(GLOBAL_CONTEXT.JWT_TOKEN) as string;

        try {
            const response = await axios.get(CheckovResultWebviewPanel.getDescriptionsEndpoint(checkId), { headers: {
                'Authorization': jwtToken } });
            
                if (response.status === 200) {
                    return response.data.description;
                }
        } catch (e: any) {
            if (retryCount === 3) {
                throw new Error('Unable to fetch description: ' + e.message);
            }

            if (e.response.status === 403) {
                await AuthenticationService.setAnalyticsJwtToken();
                return await CheckovResultWebviewPanel.fetchDescription(checkId, retryCount + 1);
            }

            logger.info('Error: ' + e.message, e);
            return;
        }
    }

    private static renderCodeBlock(result: CheckovResult) {
        const codeBlock = result.code_block.map(([ line, code ]) => `<tr class="original"><td>${line}</td><td>${code}</td></tr>`);

        if (result.fixed_definition) {
            const formattedFixCode = CheckovResultWebviewPanel.formatFixCode(result.fixed_definition, result.file_line_range[0]);
            formattedFixCode.map(([ line, code ]) => {
                codeBlock.push(`<tr class="fixed"><td>${line}</td><td>${code}</td></tr>`);
            });
        }

        return codeBlock.join('');
    }

    private static formatFixCode(fixCode: string, startLine: number) {
        const separatedFixCode = fixCode.split('\n');

        if (separatedFixCode[separatedFixCode.length - 1] === '') {
            separatedFixCode.pop();
        }

        const formattedFixCode: Array<any> = [];
        separatedFixCode.reduce((acc, stringLine) => {
            formattedFixCode.push([acc, stringLine]);
            acc++;
            return acc;
        }, startLine);
        return formattedFixCode;
    }

    private static getDescriptionsEndpoint(checkId: string) {
        return getPrismaApiUrl() + `/bridgecrew/api/v1/violations/${checkId}/description`;
    }

    private static getDataFlowValue(result: CheckovResult): string {
        let steps: number;
        let filesCount: number;
        const filesSet = new Set();

        if (result.metadata?.taint_mode) {
            steps = result.metadata?.taint_mode?.data_flow.length;

            for (const dataFlow of result.metadata.taint_mode.data_flow) {
                filesSet.add(dataFlow.path);
            }
            filesCount = filesSet.size;

            return `${steps} in ${filesCount} file(s)`;
        } else if (result.metadata?.code_locations) {
            steps = result.metadata?.code_locations?.length || 0;

            for (const dataFlow of result.metadata?.code_locations) {
                filesSet.add(dataFlow.path);
            }
            filesCount = filesSet.size;

            return `${steps} in ${filesCount} file(s)`;
        } else {
            return '---';
        }
    }

    private static getOwaspStringValue(result: CheckovResult): string {
        let resultString: string = '';
        
        if (result.owasp?.length) {
            for (const owaspString of result?.owasp) {
                resultString += `${owaspString}`;
            }
        }

        return resultString;
    }

    private static getCweValue(result: CheckovResult): string {
        let resultString: string = '';
        
        if (result.cwe?.length) {
            for (const cweString of result?.cwe) {
                resultString += `${cweString}`;
            }
        }

        return resultString;
    }

    private static getDataFlowLinks(result: CheckovResult): string {
        let resultString: string = '';

        if (result.metadata?.taint_mode) {
            const items = result.metadata.taint_mode.data_flow;
            items.sort((a, b) => {
                return a.start.row - b.start.row;
            });

            for (const dataFlow of items) {
                resultString += CheckovResultWebviewPanel.getDataFlowItemString(dataFlow, result);
            }

            return resultString;
        } else if (result.metadata?.code_locations) {
            const items = result.metadata.code_locations;
            items.sort((a, b) => {
                return a.start.row - b.start.row;
            });

            for (const dataFlow of items) {
                resultString += CheckovResultWebviewPanel.getDataFlowItemString(dataFlow, result);
            }

            return resultString;
        } else {
            return '---';
        }
    }

    private static getDataFlowItemString(dataFlow: DataFlow, result: CheckovResult): string {
        const splitPath = dataFlow.path.split('/');
        return `<div class="details">
                    <a target="_blank" onclick="onSastStepClick('${result.repo_file_path}', ${dataFlow.start.row})">${splitPath[splitPath.length - 1]}: ${dataFlow.start.row}</a><span>${dataFlow.code_block}</span>
                </div>`;
    }

    private static getLineNumbers(result: CheckovResult): string {
        const { file_line_range } = result;

        if (file_line_range[0] === file_line_range[1]) {
            return `${file_line_range[0]}`;
        }

        return `${file_line_range[0]} - ${file_line_range[1]}`;
    }
};
