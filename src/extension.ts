import * as vscode from "vscode";
import { WidgetProvider } from "./widgetProvider";
import { createWidget } from "./commands";
import { DashboardPanel } from "./dashboardPanel";
import { IconHoverProvider } from "./hoverProvider";
import { ClassDefinitionProvider, addControlCommand } from "./codeHelpers";
import { FilePreviewProvider } from "./filePreviewProvider";
import { EiconHoverProvider, EiconBrowserPanel } from "./eiconProvider";
import { EnvatoThemeCheckProvider } from "./themeCheck/EnvatoThemeCheckProvider";
import { ThemeCheckTreeProvider } from "./themeCheck/ThemeCheckTreeProvider";

export function activate(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    const widgetProvider = new WidgetProvider(workspaceRoot);
    vscode.window.registerTreeDataProvider("elementorWidgets", widgetProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.refresh",
            () => widgetProvider.refresh()
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.openWidget",
            (resource) => {
                vscode.window.showTextDocument(resource);
            }
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.createWidget",
            () => createWidget(workspaceRoot)
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.openDashboard",
            () =>
                DashboardPanel.createOrShow(context.extensionUri, workspaceRoot)
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.addControl",
            addControlCommand
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.openEiconBrowser",
            () => EiconBrowserPanel.createOrShow()
        )
    );

    // Register hover provider for Elementor icons in PHP
    context.subscriptions.push(
        vscode.languages.registerHoverProvider("php", new IconHoverProvider())
    );

    // Register hover provider for Eicon references
    context.subscriptions.push(
        vscode.languages.registerHoverProvider("php", new EiconHoverProvider())
    );

    // Register definition provider for CSS class navigation
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            "php",
            new ClassDefinitionProvider()
        )
    );

    // Register custom editor for font and SVG preview
    context.subscriptions.push(FilePreviewProvider.register(context));

    // Register Envato Theme Check linter
    const themeCheckCollection =
        vscode.languages.createDiagnosticCollection("envato-theme-check");
    const themeCheckProvider = new EnvatoThemeCheckProvider(
        themeCheckCollection
    );
    context.subscriptions.push(themeCheckCollection);

    // Scan on save
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (document.languageId === "php") {
                themeCheckProvider.scan(document);
            }
        })
    );

    // Scan on change (debounced)
    let changeTimeout: NodeJS.Timeout | undefined;
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.languageId === "php") {
                if (changeTimeout) {
                    clearTimeout(changeTimeout);
                }
                changeTimeout = setTimeout(() => {
                    themeCheckProvider.scan(event.document);
                }, 500);
            }
        })
    );

    // Scan on open
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((document) => {
            if (document.languageId === "php") {
                themeCheckProvider.scan(document);
            }
        })
    );

    // Scan all open PHP documents on activation
    vscode.workspace.textDocuments.forEach((document) => {
        if (document.languageId === "php") {
            themeCheckProvider.scan(document);
        }
    });

    // Register Theme Check Tree View
    const themeCheckTreeProvider = new ThemeCheckTreeProvider(
        themeCheckCollection
    );
    vscode.window.registerTreeDataProvider(
        "themeCheckIssues",
        themeCheckTreeProvider
    );

    // Register command to scan theme
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.scanTheme",
            async () => {
                await themeCheckProvider.scanWorkspace();
                vscode.window.showInformationMessage(
                    "Đã hoàn thành quét theme!"
                );
            }
        )
    );

    // Register command to open issue
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.openIssue",
            (issue: any) => {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    return;
                }

                const filePath = vscode.Uri.joinPath(
                    workspaceFolder.uri,
                    issue.file
                );

                vscode.workspace.openTextDocument(filePath).then((doc) => {
                    vscode.window.showTextDocument(doc).then((editor) => {
                        const position = new vscode.Position(issue.line - 1, 0);
                        editor.selection = new vscode.Selection(
                            position,
                            position
                        );
                        editor.revealRange(
                            new vscode.Range(position, position),
                            vscode.TextEditorRevealType.InCenter
                        );
                    });
                });
            }
        )
    );

    // Refresh tree view when diagnostics change
    context.subscriptions.push(
        vscode.languages.onDidChangeDiagnostics(() => {
            themeCheckTreeProvider.refresh();
        })
    );
}

export function deactivate() {}
