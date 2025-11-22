import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class FontPreviewPanel {
    public static currentPanel: FontPreviewPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        fontPath: string
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update(fontPath);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri, fontPath: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (FontPreviewPanel.currentPanel) {
            FontPreviewPanel.currentPanel._panel.reveal(column);
            FontPreviewPanel.currentPanel._update(fontPath);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "fontPreview",
            "Font Preview",
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.dirname(fontPath))],
            }
        );

        FontPreviewPanel.currentPanel = new FontPreviewPanel(
            panel,
            extensionUri,
            fontPath
        );
    }

    public dispose() {
        FontPreviewPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update(fontPath: string) {
        this._panel.webview.html = this._getHtmlForWebview(
            this._panel.webview,
            fontPath
        );
    }

    private _getHtmlForWebview(webview: vscode.Webview, fontPath: string) {
        const fontUri = webview.asWebviewUri(vscode.Uri.file(fontPath));
        const fontName = path.basename(fontPath);

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Font Preview</title>
                <style>
                    @font-face {
                        font-family: 'PreviewFont';
                        src: url('${fontUri}');
                    }
                    body {
                        padding: 20px;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                        font-family: sans-serif;
                    }
                    .preview-container {
                        margin-top: 20px;
                    }
                    .preview-text {
                        font-family: 'PreviewFont';
                        margin-bottom: 20px;
                        word-wrap: break-word;
                    }
                    h1 { font-size: 24px; margin-bottom: 10px; }
                    .size-48 { font-size: 48px; }
                    .size-32 { font-size: 32px; }
                    .size-24 { font-size: 24px; }
                    .size-16 { font-size: 16px; }
                </style>
            </head>
            <body>
                <h1>Font Preview: ${fontName}</h1>
                <div class="preview-container">
                    <div class="preview-text size-48">The quick brown fox jumps over the lazy dog.</div>
                    <div class="preview-text size-32">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
                    <div class="preview-text size-24">abcdefghijklmnopqrstuvwxyz</div>
                    <div class="preview-text size-16">0123456789 !@#$%^&*()_+</div>
                </div>
            </body>
            </html>`;
    }
}
