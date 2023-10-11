import { filtersViewProvider } from './primarySidebar';
import { CheckovResultWebviewPanel } from './checkovResult';

export async function reRenderViews() {
    await filtersViewProvider.reRenderHtml();
    await CheckovResultWebviewPanel.reRenderHtml();
}