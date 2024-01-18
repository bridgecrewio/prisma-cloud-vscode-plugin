import { CheckovResultWebviewPanel } from './checkovResult';

export async function reRenderViews() {
    await CheckovResultWebviewPanel.reRenderHtml();
}