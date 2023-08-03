import * as vscode from 'vscode';
import * as path from 'path';
import { COMMAND, SEVERITY } from '../../../../constants';
import { ResultsService } from '../../../../services';

export class FiltersViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'calicoColors.colorsView';
    public static webviewView: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public async resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
	) {
        FiltersViewProvider.webviewView = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri,
			]
		};

		webviewView.webview.html = await this._getHtmlForWebview();

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.command) {
				case 'applyFilter':
					ResultsService.addFilter(data.payload);
                    return;
                case 'runScan':
                    vscode.commands.executeCommand(COMMAND.CHECKOV_EXECUTE);
			}
		});
	}

	private async _getHtmlForWebview() {
        let htmlTemplate = (await vscode.workspace.fs.readFile(
            vscode.Uri.file(`${this._extensionUri.path}/static/webviews/filters/index.html`),
        )).toString();

        const customParamsMap: Record<string, any> = {
            'severityInfo': SEVERITY.INFO,
            'severityLow': SEVERITY.LOW,
            'severityMedium': SEVERITY.MEDIUM,
            'severityHigh': SEVERITY.HIGH,
            'severityCritical': SEVERITY.CRITICAL,
            'playIconPath': FiltersViewProvider.webviewView?.webview.asWebviewUri(
                vscode.Uri.joinPath(this._extensionUri, 'static/icons/svg', 'play.svg')
            )
        };

        const htmlParams = htmlTemplate.matchAll(new RegExp('{{(.*?)}}', 'g'));
        for (const htmlParam of htmlParams) {
            htmlTemplate = htmlTemplate.replace(htmlParam[0], customParamsMap[htmlParam[1]] || '');
        }

        return htmlTemplate;
    };
		
}