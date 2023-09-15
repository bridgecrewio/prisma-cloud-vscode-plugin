import * as vscode from 'vscode';
import { ResultsService } from './resultsService';
import { SuppressService } from './suppresService';
import { SEVERITY, severityPriorityMap, suppressionInputBoxOptions } from '../constants';
import { FixService } from './fixService';

const iconsPath = 'static/icons/svg/severities';
export let lineClickDisposable: vscode.Disposable;

let highlightDecorationType: vscode.TextEditorDecorationType;
let highlightIcon: vscode.TextEditorDecorationType;

export function registerCustomHighlight(context: vscode.ExtensionContext) {
    lineClickDisposable = vscode.window.onDidChangeTextEditorSelection(event => {
        // Check if the event was triggered by a mouse click
        if (event.selections.length === 1 && event.kind === vscode.TextEditorSelectionChangeKind.Mouse) {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const document = vscode.window.activeTextEditor?.document;

            if (!document) {
                return;
            }
    
            const clickedLineNumber = event.selections[0].active.line;
            const failedChecks = ResultsService.getByFilePath(document.fileName);
            const checksForLineNumber = failedChecks.filter(failedCheck => {
                const { file_line_range } = failedCheck;
                if (clickedLineNumber === 0) {
                    return file_line_range[0] === 0 || file_line_range[0] === 1;
                }

                return clickedLineNumber === file_line_range[0] - 1;
            });

            // sort so first item has biggest file_line_range
            checksForLineNumber.sort((a, b) => {
                return b.file_line_range[1] - a.file_line_range[1];
            });
            
            CustomPopupService.highlightLines(checksForLineNumber[0].id);
        }
    });

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

    static highlightLines(idToFullyHighlight?: string) {
        const document = vscode.window.activeTextEditor?.document;
        if (document) {
            let startLine: any;
            let endLine: any;
            const failedChecks = ResultsService.getByFilePath(document.fileName);
            const failedChecksWithoutEmptyRisks = failedChecks.filter(failedCheck => failedCheck.file_line_range[1] !== 0);
            const documentLineAmount = document.lineCount;
            const lineRangesForLineDecorations = failedChecksWithoutEmptyRisks.map(failedCheck => {
                // if (failedCheck.id === idToFullyHighlight) {
                //     // debug for full highlighting
                //     console.log(failedCheck);
                // }
                startLine = document.lineAt(failedCheck.file_line_range[0] === 0 ? 0 : failedCheck.file_line_range[0] - 1);
                endLine = document.lineAt(failedCheck.file_line_range[1] === 0 ? 0 : failedCheck.file_line_range[1] > documentLineAmount ? documentLineAmount : failedCheck.file_line_range[1] - 1);
                const startPos = startLine.range.start;
                // const endPos = endLine.range.end; commented for further usage when needed
                return { range: new vscode.Range(startPos, failedCheck.id === idToFullyHighlight ? endLine.range.end : startLine.range.end)};
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