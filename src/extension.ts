import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { registerEvents } from './events';
import { initializeServices } from './services';
import { registerSidebar } from './views/interface/primarySidebar/views';
import { registerCheckovResultView } from './views/interface/checkovResult';

export function activate(context: vscode.ExtensionContext) {
	registerCommands(context);
	registerEvents();
	initializeServices(context);
	registerSidebar();
  	registerCheckovResultView(context);
}

export function deactivate() {}

// import * as vscode from 'vscode';

// export function activate(context: vscode.ExtensionContext) {
//   let disposable = vscode.commands.registerCommand('extension.showWebView', () => {
//     const panel = vscode.window.createWebviewPanel(
//       'sampleWebView',
//       'Sample WebView',
//       vscode.ViewColumn.Beside,
//       {
//         enableScripts: true,
//       },
//     );

//     const filePath = vscode.Uri.file(
//       context.extensionPath + '/static/test.html'
//     );

//     getWebViewContent(filePath).then((data) => {
//       panel.webview.html = data;
//       panel.webview.onDidReceiveMessage((message) => {
//         console.log(message);
//         if (message.command === 'alert') {
//           vscode.window.showInformationMessage(message.text);
//         }
//       }, undefined, context.subscriptions);
//     });
//   });

//   context.subscriptions.push(disposable);
// }

// async function getWebViewContent(fileUri: vscode.Uri) {
//   const fileContent = await vscode.workspace.fs.readFile(fileUri);
//   return fileContent.toString();
// }

// export function deactivate() {}
