import * as vscode from 'vscode';

import { CONFIG } from '../../../config';
import { CheckovResult } from '../../../types';
import { MessageHandlersFactory } from './messages';

export class CheckovResultWebviewPanel {
    private static context: vscode.ExtensionContext;
    private static webviewPanel?: vscode.WebviewPanel;

    public static initialize(context: vscode.ExtensionContext) {
        CheckovResultWebviewPanel.context = context;
    }

    public static async show(category: string, result: CheckovResult) {
        const html = await CheckovResultWebviewPanel.getHtmlTemplate(category);

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
            () => CheckovResultWebviewPanel.webviewPanel = undefined,
            null,
            CheckovResultWebviewPanel.context.subscriptions,
        );
    }

    private static async getHtmlTemplate(category: string) {
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
            codeBlock: CheckovResultWebviewPanel.renderCodeBlock(result.code_block),
            fixActionState: result.fixed_definition ? 'available' : 'unavailable',
            guidelineActionState: result.guideline ? 'available' : 'unavailable',
            vulnerabilityDetailsId: result.vulnerability_details?.id,
        };
        // TODO: Improve to work with dots prop access
        for (const htmlParam of htmlParams) {
            htmlTemplate = htmlTemplate.replace(htmlParam[0], customValues[htmlParam[1]] || result[htmlParam[1] as keyof CheckovResult] || '');
        }

        return htmlTemplate;
    }

    private static renderCodeBlock(codeBlock: [number, string][]) {
        return codeBlock.map(([ line, code ]) => `<tr class="original"><td>${line}</td><td>${code}</td></tr>`).join('');
    }
};
