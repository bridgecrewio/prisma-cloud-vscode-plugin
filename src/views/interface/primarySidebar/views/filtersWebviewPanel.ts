import * as vscode from 'vscode';
import { COMMAND, SEVERITY } from '../../../../constants';
import { ResultsService } from '../../../../services';
import { AbstractExecutor } from '../../../../services/checkov/executors/abstractExecutor';

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

		await this.reRenderHtml();

		filtersWebview.webview.onDidReceiveMessage(data => {
			switch (data.command) {
				case 'applyFilter':
					ResultsService.addFilter(data.payload);
                    this.reRenderHtml();
                    return;
                case 'clickScanButton':
                    if (AbstractExecutor.isScanInProgress) {
                        vscode.commands.executeCommand(COMMAND.CHECKOV_STOP_EXECUTE);
                    } else {
                        vscode.commands.executeCommand(COMMAND.CHECKOV_EXECUTE);
                    }
                    return;
			}
		});
	}

    public async reRenderHtml() {
        if (FiltersViewProvider.filtersWebview) {
            const newHtml = await this._getHtmlForWebview();
            FiltersViewProvider.filtersWebview.webview.html = newHtml;
        }
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
            ),
            'scanButtonClass': AbstractExecutor.isScanInProgress ? 'stopScanIcon' : 'runScanIcon',
            'infoFilterActive': ResultsService.isFilterActive({ filterName: 'severity', filterValue: SEVERITY.INFO }) ? 'active' : '',
            'lowFilterActive': ResultsService.isFilterActive({ filterName: 'severity', filterValue: SEVERITY.LOW }) ? 'active' : '',
            'mediumFilterActive': ResultsService.isFilterActive({ filterName: 'severity', filterValue: SEVERITY.MEDIUM }) ? 'active' : '',
            'highFilterActive': ResultsService.isFilterActive({ filterName: 'severity', filterValue: SEVERITY.HIGH }) ? 'active' : '',
            'criticalFilterActive': ResultsService.isFilterActive({ filterName: 'severity', filterValue: SEVERITY.CRITICAL }) ? 'active' : '',
        };

        const htmlParams = htmlTemplate.matchAll(new RegExp('{{(.*?)}}', 'g'));
        for (const htmlParam of htmlParams) {
            htmlTemplate = htmlTemplate.replace(htmlParam[0], customParamsMap[htmlParam[1]] || '');
        }

        return htmlTemplate;
    };
}