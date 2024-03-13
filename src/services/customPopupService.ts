import * as vscode from 'vscode';
import { ResultsService } from './resultsService';
import { SuppressService } from './suppresService';
import { SEVERITY, severityPriorityMap, suppressionInputBoxOptions } from '../constants';
import { FixService } from './fixService';
import { AnalyticsService } from './analyticsService';
import { OpenDocumentation } from '../views/interface/checkovResult/messages/openDocumentation';
import { CheckovResultWebviewPanel } from '../views/interface/checkovResult';
import { TreeDataProvidersContainer } from '../views/interface/primarySidebar/services/treeDataProvidersContainer';
import { PrimarySidebar } from '../views/interface/primarySidebar';
import { formatWindowsFilePath } from '../utils';

const iconsPath = 'static/icons/svg/severities';
export let lineClickDisposable: vscode.Disposable;

const createCommandUri = (payload: any): string => {
    return encodeURIComponent(JSON.stringify(payload));
};

const createIconUri = (iconName: string): vscode.Uri => {
    return vscode.Uri.joinPath(CustomPopupService.context.extensionUri, 'static/icons/svg/', iconName);
};

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
            
            CustomPopupService.highlightLines(checksForLineNumber[0]?.id);
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
        await AnalyticsService.trackSuppressFromBaloon();
	});

    vscode.commands.registerCommand('extension.fix', async (...params) => {
        await FixService.fix(params[0]);
        CustomPopupService.highlightLines();
        await AnalyticsService.trackFixFromBaloon();
	});

    vscode.commands.registerCommand('extension.focusTreeItem', async (...params) => {
        const { checkId, id } = params[0];
        const treeItemToFocus = TreeDataProvidersContainer.getTreeItemByCheckIds({ checkId, id });
        const treeView = PrimarySidebar.getTreeViewByCheckId(checkId);
        
        if (treeView && treeItemToFocus) {
            treeView.reveal(treeItemToFocus, { focus: true, select: true });
        } else {
            console.error(`Eithere there are no treeView or treeItemToFocus for the risk: ${JSON.stringify(params[0])}, treeItemToFocus: ${treeItemToFocus}`);
        }
	});


    vscode.commands.registerCommand('extension.openLink', async (...params) => {
        await OpenDocumentation.handle(params[0]);
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
            const failedChecks = ResultsService.getByFilePath(process.platform === 'win32' ? formatWindowsFilePath(document.fileName) : document.fileName);
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
            const notEmptyFailedChecks = failedChecks.filter(failedCheck => failedCheck.file_line_range[1] !== 0);
            const lineRangesForIconDecorations = notEmptyFailedChecks.map(failedCheck => {
                const line = document.lineAt(failedCheck.file_line_range[0] === 0 ? 0 : failedCheck.file_line_range[0] - 1);
                return new vscode.Range(line.range.start, line.range.start.translate(0, 1));
            });

            vscode.window.activeTextEditor?.setDecorations(highlightDecorationType, lineRangesForLineDecorations);
            vscode.window.activeTextEditor?.setDecorations(highlightIcon, lineRangesForIconDecorations);
        }
    }

    static provideHover(document: vscode.TextDocument, position: vscode.Position) {
        const hoverContent = new vscode.MarkdownString();
        const failedChecks = ResultsService.getByFilePath(process.platform === 'win32' ? formatWindowsFilePath(document.fileName) : document.fileName);
        const risksForLine = failedChecks.filter(failedCheck => {
            return position.line === (failedCheck.file_line_range[0] === 0 ? 0 : failedCheck.file_line_range[0] - 1) && failedCheck.file_line_range[1] !== 0;
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
        risksForLine.map((failedCheck, index) => {
            const { 
                severity, 
                short_description, 
                check_name, 
                guideline, 
                check_id, 
                id, 
                fixed_definition,
                vulnerability_details,
                file_abs_path,
                repo_file_path,
                file_line_range
            } = failedCheck;
            hoverContent.appendMarkdown('<div>');
            hoverContent.appendMarkdown(`<div><img src="${CustomPopupService.severityIconMap[severity]}"/><b>${short_description || check_name} (Prisma Cloud)</b></div>`);
            if (failedCheck.description) {
                hoverContent.appendMarkdown(`<span>${failedCheck.description.replace(/[^a-zA-Z ]/g, "")}</span><br>`);
            }
            if (fixed_definition) {
                hoverContent.appendMarkdown(`<a href="command:extension.fix?${createCommandUri({ 
                    fixed_definition, 
                    check_id, 
                    vulnerability_details,
                    file_abs_path,
                    repo_file_path,
                    file_line_range,
                })}"><img src="${createIconUri('fix.svg')}"/><span style="color:#ffffff;"> Fix </span></a>`);
            }
            if (CheckovResultWebviewPanel.isSuppressionVisible(failedCheck)) {
                hoverContent.appendMarkdown(`<a href="command:extension.suppress?${createCommandUri({
                    vulnerability_details,
                    check_id,
                    repo_file_path,
                    file_line_range,
                    file_abs_path,
                })}"><img src="${createIconUri('suppress-popup.svg')}"/><span style="color:#ffffff;"> Suppress </span></a>`);
            }
            if (guideline) {
                hoverContent.appendMarkdown(`<a href="command:extension.openLink?${createCommandUri(guideline)}"><span> Documentation </span></a>`);
            }
            hoverContent.appendMarkdown(`<a href="command:extension.focusTreeItem?${createCommandUri({checkId: check_id, id })}"><img src="${createIconUri('console.svg')}"/><span style="color:#ffffff;"> Console</span></a>`);
            
            if (risksForLine.length > 1) {
                if (index < risksForLine.length - 1) {
                    hoverContent.appendMarkdown(`<br><span>_________________________________________________________________</span>`);
                }
            }
            hoverContent.appendMarkdown('</div>');
        });
        hoverContent.isTrusted = true;
        hoverContent.supportThemeIcons = true;
        hoverContent.supportHtml = true;
        
        return new vscode.Hover(hoverContent);
    }
}