import * as vscode from 'vscode';
import * as path from 'path';
import { COMMAND, SEVERITY } from '../../../../constants';
import { ResultsService } from '../../../../services';

export class FiltersViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'calicoColors.colorsView';
    public static filtersWebview: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public async resolveWebviewView(
		filtersWebview: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
	) {
        FiltersViewProvider.filtersWebview = filtersWebview;

		filtersWebview.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri,
			]
		};

		filtersWebview.webview.html = await this._getHtmlForWebview();

		filtersWebview.webview.onDidReceiveMessage(data => {
			switch (data.command) {
				case 'applyFilter':
					ResultsService.addFilter(data.payload);
                    return;
                case 'runScan':
                    vscode.commands.executeCommand(COMMAND.CHECKOV_EXECUTE);
                    return;
                case 'stopScan':
                    // TODO implement stop scan logic call here
                    return;
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
            'playIconPath': FiltersViewProvider.filtersWebview?.webview.asWebviewUri(
                vscode.Uri.joinPath(this._extensionUri, 'static/icons/svg', 'play.svg')
            ),
            'stopIconPath': FiltersViewProvider.filtersWebview?.webview.asWebviewUri(
                vscode.Uri.joinPath(this._extensionUri, 'static/icons/svg', 'stop.svg')
            )
        };

        const htmlParams = htmlTemplate.matchAll(new RegExp('{{(.*?)}}', 'g'));
        for (const htmlParam of htmlParams) {
            htmlTemplate = htmlTemplate.replace(htmlParam[0], customParamsMap[htmlParam[1]] || '');
        }

        return htmlTemplate;
    };
		
}