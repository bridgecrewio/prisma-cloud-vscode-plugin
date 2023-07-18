import * as vscode from 'vscode';

import { CONFIG } from '../../../config';
import { CheckovResult } from '../../../types';

export class CheckovResultWebviewPanel {
    private static context: vscode.ExtensionContext;
    private static webviewPanel?: vscode.WebviewPanel;

    public static initialize(context: vscode.ExtensionContext) {
        CheckovResultWebviewPanel.context = context;
    }

    public static async show(type: string, result: CheckovResult) {
        const html = await CheckovResultWebviewPanel.getHtmlTemplate(type);
        const renderedHtml = CheckovResultWebviewPanel.render(html, result);

        if (CheckovResultWebviewPanel.webviewPanel) {
            CheckovResultWebviewPanel.webviewPanel.webview.html = renderedHtml;
            return CheckovResultWebviewPanel.webviewPanel.reveal(vscode.ViewColumn.Beside);
        }

        CheckovResultWebviewPanel.webviewPanel = vscode.window.createWebviewPanel(
            'prismaCloud',
            CONFIG.userInterface.resultPanelTitle,
            {
                viewColumn: vscode.ViewColumn.Beside,
            },
        );
        CheckovResultWebviewPanel.webviewPanel.webview.html = renderedHtml;
        CheckovResultWebviewPanel.webviewPanel.onDidDispose(
            () => CheckovResultWebviewPanel.webviewPanel = undefined,
            null,
            CheckovResultWebviewPanel.context.subscriptions
        );
    }

    private static async getHtmlTemplate(resultType: string) {
        const { extensionUri } = CheckovResultWebviewPanel.context;
        const [rootTemplate, resultTempalte] = await Promise.all([
            vscode.workspace.fs.readFile(
                vscode.Uri.file(`${extensionUri.path}/static/webviews/result/index.html`),
            ),
            vscode.workspace.fs.readFile(
                vscode.Uri.file(`${extensionUri.path}/static/webviews/result/types/${resultType}.html`),
            ),
        ]);

        return rootTemplate.toString().replace('{{resultTemplate}}', resultTempalte.toString());
    }

    private static render(htmlTemplate: string, result: CheckovResult) {
        return htmlTemplate.replace('{{name}}', result.check_name);
    }
};
