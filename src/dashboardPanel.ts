import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { WidgetManager, ElementorWidget } from "./widgetManager";

export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _widgetManager: WidgetManager;
    private _workspaceRoot: string;

    public static createOrShow(
        extensionUri: vscode.Uri,
        workspaceRoot: string
    ) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "elementorDashboard",
            "Elementor Dashboard",
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "media"),
                    vscode.Uri.file(workspaceRoot),
                ],
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(
            panel,
            extensionUri,
            workspaceRoot
        );
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        workspaceRoot: string
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._workspaceRoot = workspaceRoot;
        this._widgetManager = new WidgetManager();

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case "openFile":
                        const openPath = vscode.Uri.file(message.path);
                        const options: vscode.TextDocumentShowOptions = {};
                        if (message.line) {
                            options.selection = new vscode.Range(
                                message.line - 1,
                                0,
                                message.line - 1,
                                0
                            );
                        }
                        vscode.window.showTextDocument(openPath, options);
                        return;
                    case "refresh":
                        this._update();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        DashboardPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const webview = this._panel.webview;
        const widgets = await this._widgetManager.findWidgets(
            this._workspaceRoot
        );
        this._panel.webview.html = this._getHtmlForWebview(webview, widgets);
    }

    private _getHtmlForWebview(
        webview: vscode.Webview,
        widgets: ElementorWidget[]
    ) {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "styles.css")
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
        );

        const widgetsJson = JSON.stringify(widgets).replace(/'/g, "\\'");

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Elementor Dashboard</title>
                <style>
                    body { font-family: var(--vscode-font-family); padding: 0; margin: 0; display: flex; height: 100vh; overflow: hidden; color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background); }
                    .sidebar { width: 300px; border-right: 1px solid var(--vscode-panel-border); overflow-y: auto; background-color: var(--vscode-sideBar-background); }
                    .main-content { flex: 1; padding: 20px; overflow-y: auto; }
                    .widget-item { padding: 10px; cursor: pointer; border-bottom: 1px solid var(--vscode-panel-border); display: flex; align-items: center; }
                    .widget-item:hover { background-color: var(--vscode-list-hoverBackground); }
                    .widget-item.active { background-color: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
                    .widget-icon { margin-right: 10px; font-size: 16px; }
                    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 5px; margin-top: 20px; }
                    .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
                    .layout-card { border: 1px solid var(--vscode-panel-border); border-radius: 4px; overflow: hidden; cursor: pointer; transition: transform 0.2s; }
                    .layout-card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                    .layout-img { width: 100%; height: 150px; object-fit: cover; display: block; }
                    .layout-name { padding: 8px; text-align: center; font-size: 12px; background-color: var(--vscode-editor-background); }
                    .file-list { list-style: none; padding: 0; }
                    .file-item { padding: 5px 0; display: flex; align-items: center; }
                    .file-link { color: var(--vscode-textLink-foreground); text-decoration: none; cursor: pointer; margin-left: 8px; }
                    .file-link:hover { text-decoration: underline; }
                    .badge { background-color: var(--vscode-badge-background); color: var(--vscode-badge-foreground); padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: auto; }
                    .empty-state { display: flex; justify-content: center; align-items: center; height: 100%; color: var(--vscode-descriptionForeground); }
                </style>
            </head>
            <body>
                <div class="sidebar" id="sidebar">
                    <!-- Widgets injected here -->
                </div>
                <div class="main-content" id="main-content">
                    <div class="empty-state">Select a widget to view details</div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const widgets = JSON.parse('${widgetsJson}');
                    
                    const sidebar = document.getElementById('sidebar');
                    const mainContent = document.getElementById('main-content');

                    function renderSidebar() {
                        sidebar.innerHTML = '';
                        widgets.forEach((widget, index) => {
                            const el = document.createElement('div');
                            el.className = 'widget-item';
                            el.innerHTML = \`
                                <span class="widget-icon">\${widget.icon ? '<i class="' + widget.icon + '"></i>' : '📦'}</span>
                                <div>
                                    <div>\${widget.title}</div>
                                    <div style="font-size: 10px; opacity: 0.7">\${widget.name}</div>
                                </div>
                            \`;
                            el.onclick = () => selectWidget(index);
                            sidebar.appendChild(el);
                        });
                    }

                    function selectWidget(index) {
                        const widget = widgets[index];
                        document.querySelectorAll('.widget-item').forEach(el => el.classList.remove('active'));
                        sidebar.children[index].classList.add('active');

                        let html = \`<h1>\${widget.title}</h1>\`;
                        
                        // Actions
                        html += \`
                            <div style="margin-bottom: 20px;">
                                <button onclick="openFile('\${widget.filePath.replace(/\\\\/g, '\\\\\\\\')}')" style="padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer;">Open PHP File</button>
                            </div>
                        \`;

                        // Layouts
                        if (widget.layouts && widget.layouts.length > 0) {
                            html += \`<div class="section-title">Layouts (\${widget.layouts.length})</div>\`;
                            html += \`<div class="grid-container">\`;
                            widget.layouts.forEach(layout => {
                                const name = layout.split(/[\\\\/]/).pop();
                                const uri = vscode.Uri ? vscode.Uri.file(layout) : layout; 
                                // Note: In a real webview we need to convert file path to webview URI. 
                                // Since we can't easily do that in this string injection without passing the webview context properly to the JSON, 
                                // we will use a placeholder image or just the name for now, OR better:
                                // We need to pass the webviewUri conversion logic or pre-convert them in the extension.
                                // For this iteration, let's just show the name and make it clickable.
                                html += \`
                                    <div class="layout-card" onclick="openFile('\${layout.replace(/\\\\/g, '\\\\\\\\')}')">
                                        <div style="height:150px; display:flex; align-items:center; justify-content:center; background:#333;">
                                            <span style="font-size:40px;">🖼️</span>
                                        </div>
                                        <div class="layout-name">\${name}</div>
                                    </div>
                                \`;
                            });
                            html += \`</div>\`;
                        }

                        // Templates
                        if (widget.templates && widget.templates.length > 0) {
                            html += \`<div class="section-title">Templates (\${widget.templates.length})</div>\`;
                            html += \`<ul class="file-list">\`;
                            widget.templates.forEach(tpl => {
                                html += \`
                                    <li class="file-item">
                                        <span>📄</span>
                                        <span class="file-link" onclick="openFile('\${tpl.filePath.replace(/\\\\/g, '\\\\\\\\')}', \${tpl.line || 0})">\${tpl.name}</span>
                                        \${tpl.cssClass ? \`<span class="badge">\${tpl.cssClass}</span>\` : ''}
                                    </li>
                                \`;
                            });
                            html += \`</ul>\`;
                        }

                        // SCSS
                        if (widget.scssFiles && widget.scssFiles.length > 0) {
                            html += \`<div class="section-title">Styles (SCSS)</div>\`;
                            html += \`<ul class="file-list">\`;
                            widget.scssFiles.forEach(scss => {
                                html += \`
                                    <li class="file-item">
                                        <span>🎨</span>
                                        <span class="file-link" onclick="openFile('\${scss.filePath.replace(/\\\\/g, '\\\\\\\\')}')">\${scss.label}</span>
                                    </li>
                                \`;
                            });
                            html += \`</ul>\`;
                        }

                        // Extra Links
                        if (widget.extraLinks && widget.extraLinks.length > 0) {
                            html += \`<div class="section-title">Related Files</div>\`;
                            html += \`<ul class="file-list">\`;
                            widget.extraLinks.forEach(link => {
                                html += \`
                                    <li class="file-item">
                                        <span>🔗</span>
                                        <span class="file-link" onclick="openFile('\${link.filePath.replace(/\\\\/g, '\\\\\\\\')}')">\${link.label}</span>
                                    </li>
                                \`;
                            });
                            html += \`</ul>\`;
                        }

                        mainContent.innerHTML = html;
                    }

                    window.openFile = (path, line) => {
                        vscode.postMessage({ command: 'openFile', path: path, line: line });
                    }

                    renderSidebar();
                </script>
            </body>
            </html>`;
    }
}
