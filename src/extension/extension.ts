// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { NotebookCellOutputItem } from 'vscode'; // Explicitly import NotebookCellOutputItem

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Custom notebook renderer extension activated');

    // Register the renderer with more configuration options
    const renderer = (vscode.notebooks as any).createNotebookRenderer( // Re-introduced temporary type assertion
        'aka', // Use the ID from package.json
        'aka', // Use the displayName from package.json
        [
            'x-application/custom-json-output', // Existing MIME type
            'application/vnd.code.notebook.my-custom-json',
            'application/vnd.code.notebook.my-custom-html',
            'application/vnd.code.notebook.my-custom-table',
            'application/vnd.code.notebook.my-custom-chart'
        ],
        {
            requiresMessaging: 'always',
        }
    );

    // This is the extension-side handler for rendering.
    // It will parse the data and pass it to the client-side (webview) renderer.
    renderer.onDidCreateOutputItem(async (outputItem: NotebookCellOutputItem, element: any) => { // Changed element type to any
        try {
            const data = parseOutputData(outputItem);
            // The actual rendering will happen in the client-side,
            // we just pass the parsed data.
            // The client-side renderer will receive outputItem.data as a Uint8Array
            // and outputItem.mime. The 'data' variable here is the parsed version
            // which should be passed if we are sending a message.
            // For now, we will simply pass the data as part of the outputItem.
            // The client-side will then handle the rendering based on MIME type.
        } catch (error) {
            console.error('Error parsing output data on extension side:', error);
            element.text = `Error: ${error instanceof Error ? error.message : String(error)}`; // Use element.text for NotebookRendererOutput
        }
    });

    context.subscriptions.push(renderer);
}

// Helper to parse output data on the extension side
function parseOutputData(outputItem: NotebookCellOutputItem): unknown {
    const decoder = new TextDecoder();
    const text = decoder.decode(outputItem.data);

    switch (outputItem.mime) {
        case 'x-application/custom-json-output': // Existing MIME type
        case 'application/vnd.code.notebook.my-custom-json':
        case 'application/vnd.code.notebook.my-custom-table':
        case 'application/vnd.code.notebook.my-custom-chart':
            return JSON.parse(text);
        case 'application/vnd.code.notebook.my-custom-html':
            return { html: text }; // Wrap HTML content
        default:
            throw new Error(`Unsupported MIME type: ${outputItem.mime}`);
    }
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('Custom notebook renderer extension deactivated');
}
