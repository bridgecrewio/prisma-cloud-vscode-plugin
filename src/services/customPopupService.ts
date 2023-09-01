import * as vscode from 'vscode';
import { ResultsService } from './resultsService';
import { SuppressService } from './suppresService';
import { SEVERITY, severityPriorityMap, suppressionInputBoxOptions } from '../constants';
import { FixService } from './fixService';

const iconsPath = 'static/icons/svg/severities';

let highlightDecorationType: vscode.TextEditorDecorationType;
let highlightIcon: vscode.TextEditorDecorationType;

export function registerCustomHighlight(context: vscode.ExtensionContext) {
    vscode.languages.registerHoverProvider({ scheme: "file" }, {
		provideHover: CustomPopupService.provideHover
	});
    vscode.commands.registerCommand('extension.suppress', async (...params) => {
		const justification = await vscode.window.showInputBox(suppressionInputBoxOptions);

        if (typeof justification === 'undefined') {
            return;
        }

		await SuppressService.suppress(params[0], justification);
        CustomPopupService.highlightLines();
	});

    vscode.commands.registerCommand('extension.fix', async (...params) => {
        await FixService.fix(params[0]);
        CustomPopupService.highlightLines();
	});
    CustomPopupService.context = context;
    CustomPopupService.severityIconMap = {
        [SEVERITY.INFO]: vscode.Uri.joinPath(CustomPopupService.context.extensionUri, iconsPath, 'info-popup.svg'),
        [SEVERITY.LOW]: vscode.Uri.joinPath(CustomPopupService.context.extensionUri, iconsPath, 'low-popup.svg'),
        [SEVERITY.MEDIUM]: vscode.Uri.joinPath(CustomPopupService.context.extensionUri, iconsPath, 'medium-popup.svg'),
        [SEVERITY.HIGH]: vscode.Uri.joinPath(CustomPopupService.context.extensionUri, iconsPath, 'high-popup.svg'),
        [SEVERITY.CRITICAL]: vscode.Uri.joinPath(CustomPopupService.context.extensionUri, iconsPath, 'critical-popup.svg'),
        [SEVERITY.UNKNOWN]: vscode.Uri.joinPath(CustomPopupService.context.extensionUri, iconsPath, 'info-popup.svg'),
    };
    highlightDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#D13C3C1A',
        isWholeLine: false,
    });
    highlightIcon = vscode.window.createTextEditorDecorationType({
        isWholeLine: false,
        gutterIconPath: vscode.Uri.joinPath(CustomPopupService.context.extensionUri, 'static/icons/svg', 'xmark.svg'),
        gutterIconSize: '95%'
    });
    CustomPopupService.highlightLines();
}

export class CustomPopupService {
    static context: vscode.ExtensionContext;
    static severityIconMap: Record<SEVERITY, vscode.Uri>;

    static highlightLines() {
        const document = vscode.window.activeTextEditor?.document;
        if (document) {
            let startLine: any;
            let endLine: any;
            const failedChecks = ResultsService.getByFilePath(document.fileName);
            const documentLineAmount = document.lineCount;
            const lineRangesForLineDecorations = failedChecks.map(failedCheck => {
                startLine = document.lineAt(failedCheck.file_line_range[0] === 0 ? 0 : failedCheck.file_line_range[0] - 1);
                endLine = document.lineAt(failedCheck.file_line_range[1] === 0 ? 0 : failedCheck.file_line_range[1] > documentLineAmount ? documentLineAmount : failedCheck.file_line_range[1] - 1);
                const startPos = startLine.range.start;
                const endPos = endLine.range.end;
                return { range: new vscode.Range(startPos, startLine.range.end)};
            });
            const lineRangesForIconDecorations = failedChecks.map(failedCheck => {
                const line = document.lineAt(failedCheck.file_line_range[0] === 0 ? 0 : failedCheck.file_line_range[0] - 1);
                return new vscode.Range(line.range.start, line.range.start.translate(0, 1));
            });

            vscode.window.activeTextEditor?.setDecorations(highlightDecorationType, lineRangesForLineDecorations);
            vscode.window.activeTextEditor?.setDecorations(highlightIcon, lineRangesForIconDecorations);
        }
    }

    static provideHover(document: vscode.TextDocument, position: vscode.Position) {
        const hoverContent = new vscode.MarkdownString();
        const failedChecks = ResultsService.getByFilePath(document.fileName);
        const risksForLine = failedChecks.filter(failedCheck => {
            return position.line >= (failedCheck.file_line_range[0] === 0 ? 0 : failedCheck.file_line_range[0] - 1)  && position.line <= (failedCheck.file_line_range[1] === 0 ? 0 : failedCheck.file_line_range[1] - 1);
        });

        if (risksForLine.length === 0) {
            return;
        }

        risksForLine.sort((a, b) => {
            return severityPriorityMap[b.severity || SEVERITY.UNKNOWN] - severityPriorityMap[a.severity || SEVERITY.UNKNOWN];
        });

        // const debugFileLineRange = `<span>(${file_line_range[0] === 0 ? 0 : 
            // file_line_range[0]} - ${file_line_range[1] === 0 ? 0 : file_line_range[1]})</span>`;
        // hover popup markdown generation
        hoverContent.appendMarkdown(`<div>`);
        risksForLine.map((failedCheck, index) => {
            const { severity, short_description, check_name, file_line_range, guideline } = failedCheck;
            hoverContent.appendMarkdown(`<div><img src="${CustomPopupService.severityIconMap[severity]}"/><b>${short_description || check_name}</b></div>`);
            if (failedCheck.description) {
                hoverContent.appendMarkdown(`<p>${failedCheck.description}<p>`);
            }
            if (guideline) {
                hoverContent.appendMarkdown(`<a href="${guideline}"><span>Learn more</span></a><br>`);
            }
            if (failedCheck.fixed_definition) {
                hoverContent.appendMarkdown(`<a href="command:extension.fix?${encodeURIComponent(JSON.stringify(failedCheck))}"><img src="${vscode.Uri.joinPath(CustomPopupService.context.extensionUri, 'static/icons/svg/', 'fix-popup.svg')}"/><span style="color:#ffffff;"> Fix</span></a><span>  </span>`);
            }
            
            hoverContent.appendMarkdown(`<a href="command:extension.suppress?${encodeURIComponent(JSON.stringify(failedCheck))}"><img src="${vscode.Uri.joinPath(CustomPopupService.context.extensionUri, 'static/icons/svg/', 'suppress-popup.svg')}"/><span style="color:#ffffff;"> Suppress</span></a>`);
            
            if (risksForLine.length > 1) {
                if (index < risksForLine.length - 1) {
                    hoverContent.appendMarkdown(`<br><span>_________________________________________________________________</span>`);
                }
            }
        });
        hoverContent.appendMarkdown(`</div>`);
        hoverContent.isTrusted = true;
        hoverContent.supportHtml = true;
        
        return new vscode.Hover(hoverContent);
    }
}