import * as vscode from 'vscode';
import { ResultsService } from './resultsService';
import { SuppressService } from './suppresService';
import { SEVERITY } from '../constants';
import { FixService } from './fixService';

const severityColorMap: Record<SEVERITY, string> = {
	[SEVERITY.INFO]: '#E9EDEE',
	[SEVERITY.LOW]: '#27b0ed',
	[SEVERITY.HIGH]: '#f47206',
	[SEVERITY.MEDIUM]: '#f1b287',
	[SEVERITY.CRITICAL]: '#eb174a',
	[SEVERITY.UNKNOWN]: '#f5dabd'
};

let highlightDecorationType: vscode.TextEditorDecorationType;
let highlightIcon: vscode.TextEditorDecorationType;

export function registerCustomHighlight(context: vscode.ExtensionContext) {
    vscode.languages.registerHoverProvider({ scheme: "file" }, {
		provideHover: CustomPopupService.provideHover
	});
    vscode.commands.registerCommand('extension.suppress', async (...params) => {
		const justification = await vscode.window.showInputBox({
			placeHolder: 'Justification',
			prompt: 'Include a short justification for the suppression',
		});

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
                return { range: new vscode.Range(startPos, endPos)};
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

        // hover popup markdown generation
        hoverContent.appendMarkdown(`<div>`);
        risksForLine.map((failedCheck, index) => {
            const { severity, short_description, check_name, file_line_range, guideline } = failedCheck;
            hoverContent.appendMarkdown(`<div><span style="color:${severityColorMap[severity]};">${severity}</span><b> 
            ${short_description || check_name}</b><span>(${file_line_range[0] === 0 ? 0 : 
                file_line_range[0]} - ${file_line_range[1] === 0 ? 0 : file_line_range[1]})</span></div>`);
            if (failedCheck.description) {
                hoverContent.appendMarkdown(`<p>${failedCheck.description}<p>`);
            }
            if (guideline) {
                hoverContent.appendMarkdown(`<a href="${guideline}"><span>Lean more</span></a><br>`);
            }
            if (failedCheck.fixed_definition) {
                hoverContent.appendMarkdown(`<a href="command:extension.fix?${encodeURIComponent(JSON.stringify(failedCheck))}"><span style="color:#1481C1;">Fix</span></a>   `);
            }
            
            hoverContent.appendMarkdown(`<a href="command:extension.suppress?${encodeURIComponent(JSON.stringify(failedCheck))}"><span style="color:#1481C1;">Suppress</span></a>`);
            
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