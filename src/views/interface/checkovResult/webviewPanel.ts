import * as vscode from 'vscode';

import { CONFIG } from '../../../config';
import { CheckovResult } from '../../../types';
import { MessageHandlersFactory } from './messages';
import { CHECKOV_RESULT_CATEGORY } from '../../../constants';
import { AbstractExecutor } from '../../../services/checkov/executors/abstractExecutor';

export class CheckovResultWebviewPanel {
    private static context: vscode.ExtensionContext;
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
            approvedSPDX: result.check_id === 'BC_LIC_1' ? 'true' : 'false',
            disabledClass: AbstractExecutor.isScanInProgress ? 'disabledDiv' : '',
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

    private static renderCodeBlock(result: CheckovResult) {
        const codeBlock = result.code_block.map(([ line, code ]) => `<tr class="original"><td>${line}</td><td>${code}</td></tr>`);

        if (result.fixed_definition) {
            codeBlock.push(`<tr class="fixed"><td>${result.file_line_range[0]}</td><td>${result.fixed_definition}</td></tr>`);
        }

        return codeBlock.join('');
    }
};
